import { PDFDocument, StandardFonts, rgb, type PDFFont, type RGB } from "pdf-lib";

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const BORDER_INSET = 20;
const BORDER_WIDTH = 2;
const CORNER_SIZE = 8;

export type CertificatePdfInput = {
  organizationName: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  titleText: string;
  bodyText: string;
  footerText: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
  participantName: string;
  experienceTitle: string;
  completionDate: string;
  verificationUrl: string;
};

function hexToRgb(hex: string): RGB {
  const normalized = hex.replace("#", "");
  const bigint = Number.parseInt(normalized.length === 3 ? normalized.replace(/(.)/g, "$1$1") : normalized, 16);

  if (Number.isNaN(bigint)) {
    return rgb(0, 0, 0);
  }

  return rgb(((bigint >> 16) & 255) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255);
}

function formatCompletionDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type FontSet = { regular: PDFFont; bold: PDFFont };

async function loadFonts(pdfDoc: PDFDocument, fontFamily: string): Promise<FontSet> {
  const isSans = fontFamily.toLowerCase().includes("sans");

  return {
    regular: await pdfDoc.embedFont(isSans ? StandardFonts.Helvetica : StandardFonts.TimesRoman),
    bold: await pdfDoc.embedFont(isSans ? StandardFonts.HelveticaBold : StandardFonts.TimesRomanBold),
  };
}

function drawCentered(
  page: import("pdf-lib").PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  color: RGB
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (PAGE_WIDTH - width) / 2, y, font, size, color });
}

const MAX_TEXT_WIDTH = PAGE_WIDTH - 160;

/**
 * Participant names and experience titles are unbounded user data — shrink
 * the font (down to a floor) rather than let a long one overrun the card's
 * border, since there's no line-wrapping in this single-line layout.
 */
function fittedSize(text: string, font: PDFFont, size: number): number {
  let fitted = size;
  while (fitted > 10 && font.widthOfTextAtSize(text, fitted) > MAX_TEXT_WIDTH) {
    fitted -= 1;
  }
  return fitted;
}

/**
 * Geometric shapes and standard PDF fonts only — no embedded logo images
 * and no custom font embedding, per the Sprint 16 brief. Runs server-side
 * only; never import this from a Client Component.
 */
export async function generateCertificatePdf(input: CertificatePdfInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const primary = hexToRgb(input.primaryColor);
  const secondary = hexToRgb(input.secondaryColor);
  const background = hexToRgb(input.backgroundColor);
  const muted = rgb(0.45, 0.45, 0.45);
  const ink = rgb(0.12, 0.12, 0.12);

  const { regular, bold } = await loadFonts(pdfDoc, input.fontFamily);

  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: background });

  page.drawRectangle({
    x: BORDER_INSET,
    y: BORDER_INSET,
    width: PAGE_WIDTH - BORDER_INSET * 2,
    height: PAGE_HEIGHT - BORDER_INSET * 2,
    borderColor: primary,
    borderWidth: BORDER_WIDTH,
  });

  const cornerInset = BORDER_INSET + 6;
  for (const x of [cornerInset, PAGE_WIDTH - cornerInset - CORNER_SIZE]) {
    for (const y of [cornerInset, PAGE_HEIGHT - cornerInset - CORNER_SIZE]) {
      page.drawRectangle({ x, y, width: CORNER_SIZE, height: CORNER_SIZE, color: primary });
    }
  }

  drawCentered(page, input.organizationName.toUpperCase(), 500, bold, 16, ink);

  page.drawLine({
    start: { x: PAGE_WIDTH / 2 - 60, y: 486 },
    end: { x: PAGE_WIDTH / 2 + 60, y: 486 },
    thickness: 1,
    color: primary,
  });

  drawCentered(page, input.titleText, 432, bold, 34, secondary);

  drawCentered(page, input.bodyText, 384, regular, 14, muted);
  drawCentered(page, input.participantName, 348, bold, fittedSize(input.participantName, bold, 28), ink);

  drawCentered(page, "for successfully completing", 310, regular, 13, muted);
  drawCentered(page, input.experienceTitle, 276, bold, fittedSize(input.experienceTitle, bold, 20), primary);

  drawCentered(page, `Completed on ${formatCompletionDate(input.completionDate)}`, 240, regular, 11, muted);

  const signatoryX = 70;
  if (input.signatoryName) {
    page.drawLine({
      start: { x: signatoryX, y: 108 },
      end: { x: signatoryX + 160, y: 108 },
      thickness: 1,
      color: muted,
    });
    page.drawText(input.signatoryName, { x: signatoryX, y: 90, font: bold, size: 12, color: ink });
    if (input.signatoryTitle) {
      page.drawText(input.signatoryTitle, { x: signatoryX, y: 74, font: regular, size: 10, color: muted });
    }
  }

  const verifyText = `Verify at: ${input.verificationUrl}`;
  const verifyWidth = regular.widthOfTextAtSize(verifyText, 9);
  page.drawText(verifyText, {
    x: PAGE_WIDTH - BORDER_INSET - 24 - verifyWidth,
    y: 74,
    font: regular,
    size: 9,
    color: muted,
  });

  if (input.footerText) {
    drawCentered(page, input.footerText, 48, regular, 9, muted);
  }

  return pdfDoc.save();
}
