/**
 * PDF coordinates (pdf-lib convention) are points from the bottom-left of
 * the page; the preview `<canvas>` is pixels from the top-left, like every
 * other browser coordinate system. Every field marker's on-screen position
 * and every drag-and-drop must go through these two functions — get the Y
 * flip wrong and fields placed in the top half of the preview land in the
 * bottom half of the generated PDF.
 *
 * X needs no flip (canvas and PDF space agree on left-to-right), so it's
 * just a scale multiply/divide — see canvasXToPdf/pdfXToCanvas below.
 */
export function canvasToPdf(canvasY: number, canvasHeight: number, pdfHeight: number, scale: number): number {
  void canvasHeight;
  return pdfHeight - canvasY / scale;
}

export function pdfToCanvas(pdfY: number, pdfHeight: number, scale: number): number {
  return (pdfHeight - pdfY) * scale;
}

export function canvasXToPdf(canvasX: number, scale: number): number {
  return canvasX / scale;
}

export function pdfXToCanvas(pdfX: number, scale: number): number {
  return pdfX * scale;
}
