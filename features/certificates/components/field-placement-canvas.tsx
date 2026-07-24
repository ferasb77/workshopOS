"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CERTIFICATE_FIELD_KEYS,
  CERTIFICATE_FIELD_LABELS,
  type CertificateFieldKey,
  type FieldPlacements,
} from "@/features/certificates/schema";

import { getUploadedTemplatePreviewUrl, updateFieldPlacements } from "../actions";
import { canvasToPdf, canvasXToPdf, pdfToCanvas, pdfXToCanvas } from "../lib/coordinates";
import { renderPdfFirstPage } from "../lib/pdfjs-loader";

const CANVAS_DISPLAY_WIDTH = 700;
const GRID_STEP_PTS = 50;

type Props = {
  templateId: string;
  initialFieldPlacements: FieldPlacements;
  initialPageWidthPts: number;
  initialPageHeightPts: number;
};

function drawGrid(canvas: HTMLCanvasElement, scale: number) {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.strokeStyle = "rgba(255, 255, 255, 0.14)";
  context.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += GRID_STEP_PTS * scale) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }

  for (let y = 0; y <= canvas.height; y += GRID_STEP_PTS * scale) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }
}

export function FieldPlacementCanvas({
  templateId,
  initialFieldPlacements,
  initialPageWidthPts,
  initialPageHeightPts,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveRequestIdRef = useRef(0);

  const [placements, setPlacements] = useState<FieldPlacements>(initialFieldPlacements);
  // Mirrors `placements` synchronously. setState's functional-updater form
  // only runs at render time (not synchronously at the call site), so it
  // can't be used to read the "just computed" value back out for persist().
  // The ref is written and read in the same synchronous call, so rapid
  // successive edits (e.g. two quick alignment clicks) each build on the
  // other's real result instead of racing a stale render closure.
  const placementsRef = useRef(initialFieldPlacements);
  const [pageHeightPts, setPageHeightPts] = useState(initialPageHeightPts);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [dragKey, setDragKey] = useState<CertificateFieldKey | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const scale = CANVAS_DISPLAY_WIDTH / initialPageWidthPts;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoadingPreview(true);
      setLoadError(null);

      const result = await getUploadedTemplatePreviewUrl(templateId);

      if (cancelled) {
        return;
      }

      if (!result.success) {
        setLoadError(result.error);
        setIsLoadingPreview(false);
        return;
      }

      setPageHeightPts(result.pageHeightPts);

      const canvas = canvasRef.current;
      if (!canvas) {
        setIsLoadingPreview(false);
        return;
      }

      try {
        const viewport = await renderPdfFirstPage(result.url, canvas, scale);
        if (cancelled) {
          return;
        }
        drawGrid(canvas, scale);
        setCanvasSize({ width: viewport.width, height: viewport.height });
      } catch (renderError) {
        if (!cancelled) {
          setLoadError(renderError instanceof Error ? renderError.message : "Unable to render the PDF preview.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPreview(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  async function persist(next: FieldPlacements) {
    setSaveStatus("saving");
    setSaveError(null);

    const requestId = ++saveRequestIdRef.current;
    const result = await updateFieldPlacements(templateId, next);

    // Each field change sends the full merged placements object, so an
    // older in-flight request that resolves after a newer one must not be
    // allowed to overwrite it with stale data.
    if (requestId !== saveRequestIdRef.current) {
      return;
    }

    if (result.success) {
      setSaveStatus("saved");
    } else {
      setSaveStatus("error");
      setSaveError(result.error);
    }
  }

  function updateField(key: CertificateFieldKey, patch: Partial<FieldPlacements[CertificateFieldKey]>) {
    const next = {
      ...placementsRef.current,
      [key]: { ...placementsRef.current[key], ...patch },
    };
    placementsRef.current = next;
    setPlacements(next);
    persist(next);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragKey(null);

    const key = event.dataTransfer.getData("text/plain") as CertificateFieldKey;
    if (!CERTIFICATE_FIELD_KEYS.includes(key)) {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !canvasSize) {
      return;
    }

    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    const pdfX = Math.round(canvasXToPdf(canvasX, scale));
    const pdfY = Math.round(canvasToPdf(canvasY, canvasSize.height, pageHeightPts, scale));

    const clampedX = Math.max(0, Math.min(initialPageWidthPts, pdfX));
    const clampedY = Math.max(0, Math.min(pageHeightPts, pdfY));

    updateField(key, { x: clampedX, y: clampedY });
  }

  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle>2. Position Fields</CardTitle>
        <CardDescription>
          Drag each marker to where it should appear. The grid is spaced every 50 points.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loadError && <p className="text-sm text-destructive">{loadError}</p>}
        {isLoadingPreview && !loadError && <p className="text-sm text-muted-foreground">Loading preview...</p>}

        <div
          ref={containerRef}
          className="relative inline-block overflow-hidden rounded-lg border border-border-subtle"
          style={canvasSize ? { width: canvasSize.width, height: canvasSize.height } : undefined}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <canvas ref={canvasRef} className="block" />

          {canvasSize &&
            CERTIFICATE_FIELD_KEYS.map((key) => {
              const placement = placements[key];
              const left = pdfXToCanvas(placement.x, scale);
              const top = pdfToCanvas(placement.y, pageHeightPts, scale);

              return (
                <div
                  key={key}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", key);
                    setDragKey(key);
                  }}
                  onDragEnd={() => setDragKey(null)}
                  className={cn(
                    "absolute flex -translate-x-1/2 -translate-y-1/2 cursor-grab select-none flex-col items-center gap-0.5",
                    dragKey === key && "opacity-50"
                  )}
                  style={{ left, top }}
                >
                  <span className="size-3 rounded-full border-2 border-gold bg-night shadow" />
                  <span className="whitespace-nowrap rounded bg-night/90 px-1.5 py-0.5 text-[10px] font-medium text-gold shadow">
                    {CERTIFICATE_FIELD_LABELS[key]}
                  </span>
                  <span className="whitespace-nowrap rounded bg-night/80 px-1 text-[9px] text-muted-foreground">
                    ({placement.x}, {placement.y})
                  </span>
                </div>
              );
            })}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-ivory">3. Field Appearance</h3>
          <div className="space-y-4">
            {CERTIFICATE_FIELD_KEYS.map((key) => {
              const placement = placements[key];

              return (
                <div
                  key={key}
                  className="grid grid-cols-2 items-end gap-3 rounded-lg border border-border-subtle bg-night/40 p-3 sm:grid-cols-4"
                >
                  <p className="col-span-2 text-sm font-medium text-ivory sm:col-span-4">
                    {CERTIFICATE_FIELD_LABELS[key]}
                  </p>

                  <div className="space-y-1.5">
                    <Label htmlFor={`${key}-font-size`} className="text-xs">
                      Font size
                    </Label>
                    <Input
                      id={`${key}-font-size`}
                      type="number"
                      min={6}
                      max={96}
                      defaultValue={placement.font_size}
                      onBlur={(event) => {
                        const value = Number(event.target.value);
                        if (Number.isFinite(value)) {
                          updateField(key, { font_size: Math.max(6, Math.min(96, value)) });
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`${key}-color`} className="text-xs">
                      Color
                    </Label>
                    <input
                      id={`${key}-color`}
                      type="color"
                      value={placement.color}
                      onChange={(event) => updateField(key, { color: event.target.value })}
                      className="h-11 w-full cursor-pointer rounded-lg border border-input bg-transparent md:h-8"
                    />
                  </div>

                  <div className="col-span-2 space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">Alignment</Label>
                    <div className="flex gap-1.5">
                      {(["left", "center", "right"] as const).map((align) => (
                        <Button
                          key={align}
                          type="button"
                          size="sm"
                          variant={placement.align === align ? "default" : "outline"}
                          onClick={() => updateField(key, { align })}
                          className="flex-1 capitalize"
                        >
                          {align}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-sm">
          {saveStatus === "saving" && <p className="text-muted-foreground">Saving...</p>}
          {saveStatus === "saved" && <p className="text-emerald-400">All changes saved.</p>}
          {saveStatus === "error" && <p className="text-destructive">{saveError}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
