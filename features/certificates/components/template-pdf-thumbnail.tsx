"use client";

import { useEffect, useRef, useState } from "react";

import { getUploadedTemplatePreviewUrl } from "../actions";
import { renderPdfFirstPage } from "../lib/pdfjs-loader";

const THUMBNAIL_WIDTH = 72;

type Props = {
  templateId: string;
};

export function TemplatePdfThumbnail({ templateId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getUploadedTemplatePreviewUrl(templateId);
      if (cancelled) {
        return;
      }
      if (!result.success) {
        setFailed(true);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      try {
        await renderPdfFirstPage(result.url, canvas, THUMBNAIL_WIDTH / result.pageWidthPts);
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [templateId]);

  if (failed) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="rounded border border-border-subtle bg-white"
      style={{ width: THUMBNAIL_WIDTH, height: "auto" }}
    />
  );
}
