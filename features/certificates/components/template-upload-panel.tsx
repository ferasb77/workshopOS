"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { uploadCertificateTemplatePdf } from "../actions";

type Props = {
  templateId: string;
  workspaceId: string;
  hasUpload: boolean;
};

export function TemplateUploadPanel({ templateId, workspaceId, hasUpload }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [isUploading, startTransition] = useTransition();

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError(null);
    setSucceeded(false);
    setFileName(file.name);

    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadCertificateTemplatePdf(templateId, workspaceId, formData);

      if (result.success) {
        setSucceeded(true);
        router.refresh();
      } else {
        setError(result.error);
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    });
  }

  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle>1. Upload</CardTitle>
        <CardDescription>
          Upload the certificate background as a PDF. This is the design participants will receive — the
          platform only overlays the dynamic fields on top of it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelected}
          className="hidden"
          id="template-pdf-input"
        />
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="size-4" />
          {isUploading ? "Uploading..." : hasUpload ? "Replace PDF" : "Choose PDF"}
        </Button>

        {fileName && !error && !isUploading && (
          <p className="text-sm text-muted-foreground">{fileName}</p>
        )}
        {isUploading && <p className="text-sm text-muted-foreground">Uploading {fileName}...</p>}
        {succeeded && !isUploading && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-400">
            <CheckCircle2 className="size-4" />
            PDF uploaded successfully.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
