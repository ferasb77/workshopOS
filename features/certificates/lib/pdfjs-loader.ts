"use client";

// pdf.js is loaded from a CDN (not npm-installed) purely for client-side
// preview rendering — the actual certificates are generated server-side
// with pdf-lib, which is already a project dependency. There's no shipped
// type package for the CDN build, so this models only the small slice of
// its API the field-placement editor and template thumbnail actually call.

const PDFJS_VERSION = "3.11.174";
const PDFJS_SCRIPT_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

export type PdfJsViewport = { width: number; height: number };

export type PdfJsPage = {
  getViewport: (params: { scale: number }) => PdfJsViewport;
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PdfJsViewport }) => {
    promise: Promise<void>;
  };
};

export type PdfJsDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPage>;
};

export type PdfJsLib = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: string) => { promise: Promise<PdfJsDocument> };
};

declare global {
  interface Window {
    pdfjsLib?: PdfJsLib;
  }
}

let loadPromise: Promise<PdfJsLib> | null = null;

export function loadPdfJs(): Promise<PdfJsLib> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadPdfJs can only run in the browser."));
  }

  if (window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<PdfJsLib>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PDFJS_SCRIPT_URL}"]`);

    function onReady() {
      const lib = window.pdfjsLib;
      if (!lib) {
        reject(new Error("pdf.js failed to initialize."));
        return;
      }
      lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      resolve(lib);
    }

    if (existing) {
      existing.addEventListener("load", onReady);
      existing.addEventListener("error", () => reject(new Error("Unable to load pdf.js from CDN.")));
      return;
    }

    const script = document.createElement("script");
    script.src = PDFJS_SCRIPT_URL;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => reject(new Error("Unable to load pdf.js from CDN."));
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Renders page 1 of a PDF (fetched from `url`) onto `canvas` at `scale`. */
export async function renderPdfFirstPage(
  url: string,
  canvas: HTMLCanvasElement,
  scale: number
): Promise<PdfJsViewport> {
  const pdfjsLib = await loadPdfJs();
  const doc = await pdfjsLib.getDocument(url).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to get a 2D canvas context.");
  }

  await page.render({ canvasContext: context, viewport }).promise;

  return viewport;
}
