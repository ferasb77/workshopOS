"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CertificateTemplate } from "@/features/certificates/data";

import { updateUploadedTemplateBasics, type SaveUploadedBasicsResult } from "../actions";
import { FieldPlacementCanvas } from "./field-placement-canvas";
import { PreviewTemplateButton } from "./preview-template-button";
import { TemplateUploadPanel } from "./template-upload-panel";

const initialState: SaveUploadedBasicsResult = { success: false, error: "" };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) {
    return null;
  }
  return <p className="mt-1 text-sm text-destructive">{messages[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  );
}

type Props = {
  workspaceId: string;
  template: CertificateTemplate;
};

export function UploadedTemplateEditor({ workspaceId, template }: Props) {
  const boundUpdateBasics = updateUploadedTemplateBasics.bind(null, template.id);
  const [state, formAction] = useActionState(boundUpdateBasics, initialState);
  const fieldErrors = !state.success ? state.fieldErrors : undefined;

  return (
    <div className="space-y-6">
      {/* The field-placement editor is a full drag-and-drop canvas — not
          worth trying to cram into a touch screen. A clear notice beats a
          broken experience. */}
      <div className="rounded-lg border border-border-subtle bg-night/40 p-6 text-center md:hidden">
        <Monitor className="mx-auto size-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-ivory">Certificate template configuration requires a desktop browser.</p>
      </div>

      <div className="hidden space-y-6 md:block">
        <Card className="bg-surface-elevated">
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>Name and organization for this template.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="grid gap-5 sm:grid-cols-2" noValidate>
              {!state.success && state.error && (
                <div className="sm:col-span-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                  {state.error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Template name <span className="text-gold">*</span>
                </Label>
                <Input id="name" name="name" required defaultValue={template.name} />
                <FieldError messages={fieldErrors?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizationName">
                  Organization name <span className="text-gold">*</span>
                </Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  required
                  defaultValue={template.organizationName}
                />
                <FieldError messages={fieldErrors?.organizationName} />
              </div>
              <div className="sm:col-span-2">
                <SubmitButton />
              </div>
            </form>
          </CardContent>
        </Card>

        <TemplateUploadPanel templateId={template.id} workspaceId={workspaceId} hasUpload={Boolean(template.uploadedPdfPath)} />

        {template.uploadedPdfPath ? (
          <>
            <FieldPlacementCanvas
              key={template.uploadedPdfPath}
              templateId={template.id}
              initialFieldPlacements={template.fieldPlacements}
              initialPageWidthPts={template.pageWidthPts}
              initialPageHeightPts={template.pageHeightPts}
            />

            <Card className="bg-surface-elevated">
              <CardHeader>
                <CardTitle>4. Preview Certificate</CardTitle>
                <CardDescription>
                  Generates a sample certificate with placeholder values using the uploaded PDF and current field
                  positions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PreviewTemplateButton templateId={template.id} />
              </CardContent>
            </Card>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Upload a PDF above to position fields and preview the certificate.
          </p>
        )}
      </div>
    </div>
  );
}
