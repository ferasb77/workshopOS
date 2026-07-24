"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CertificateTemplate } from "@/features/certificates/data";

import type { SaveTemplateResult } from "../actions";

const initialState: SaveTemplateResult = { success: false, error: "" };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return <p className="mt-1 text-sm text-destructive">{messages[0]}</p>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Saving..." : label}
    </Button>
  );
}

type Props = {
  action: (prevState: SaveTemplateResult | null, formData: FormData) => Promise<SaveTemplateResult>;
  submitLabel: string;
  template?: CertificateTemplate;
};

export function TemplateForm({ action, submitLabel, template }: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const fieldErrors = !state.success ? state.fieldErrors : undefined;

  const formKey = fieldErrors ? JSON.stringify(fieldErrors) : "initial";

  const defaults = {
    name: template?.name ?? "",
    organizationName: template?.organizationName ?? "Enable My Growth",
    organizationLogoUrl: template?.organizationLogoUrl ?? "",
    primaryColor: template?.primaryColor ?? "#C9A96E",
    secondaryColor: template?.secondaryColor ?? "#26215C",
    backgroundColor: template?.backgroundColor ?? "#FFFFFF",
    fontFamily: template?.fontFamily ?? "serif",
    titleText: template?.titleText ?? "Certificate of Completion",
    bodyText: template?.bodyText ?? "This is to certify that",
    footerText: template?.footerText ?? "",
    signatoryName: template?.signatoryName ?? "",
    signatoryTitle: template?.signatoryTitle ?? "",
  };

  return (
    <form key={formKey} action={formAction} className="space-y-6" noValidate>
      {!state.success && state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {state.error}
        </div>
      )}

      <Card className="bg-surface-elevated">
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Who this certificate is issued by, and its colors.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">
              Template name <span className="text-gold">*</span>
            </Label>
            <Input id="name" name="name" required defaultValue={defaults.name} />
            <FieldError messages={fieldErrors?.name} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="organizationName">
              Organization name <span className="text-gold">*</span>
            </Label>
            <Input id="organizationName" name="organizationName" required defaultValue={defaults.organizationName} />
            <FieldError messages={fieldErrors?.organizationName} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="organizationLogoUrl">Logo URL (not shown on the PDF — reserved for future use)</Label>
            <Input
              id="organizationLogoUrl"
              name="organizationLogoUrl"
              type="url"
              placeholder="https://"
              defaultValue={defaults.organizationLogoUrl}
            />
            <FieldError messages={fieldErrors?.organizationLogoUrl} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary color</Label>
            <Input id="primaryColor" name="primaryColor" defaultValue={defaults.primaryColor} />
            <FieldError messages={fieldErrors?.primaryColor} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary color</Label>
            <Input id="secondaryColor" name="secondaryColor" defaultValue={defaults.secondaryColor} />
            <FieldError messages={fieldErrors?.secondaryColor} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="backgroundColor">Background color</Label>
            <Input id="backgroundColor" name="backgroundColor" defaultValue={defaults.backgroundColor} />
            <FieldError messages={fieldErrors?.backgroundColor} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fontFamily">Font family</Label>
            <Select
              name="fontFamily"
              defaultValue={defaults.fontFamily}
              items={[
                { value: "serif", label: "Serif" },
                { value: "sans", label: "Sans-serif" },
              ]}
            >
              <SelectTrigger id="fontFamily" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="serif">Serif</SelectItem>
                <SelectItem value="sans">Sans-serif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface-elevated">
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>The text printed on the certificate.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="titleText">
              Title <span className="text-gold">*</span>
            </Label>
            <Input id="titleText" name="titleText" required defaultValue={defaults.titleText} />
            <FieldError messages={fieldErrors?.titleText} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bodyText">
              Body text <span className="text-gold">*</span>
            </Label>
            <Input id="bodyText" name="bodyText" required defaultValue={defaults.bodyText} />
            <FieldError messages={fieldErrors?.bodyText} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="footerText">Footer text</Label>
            <Input id="footerText" name="footerText" defaultValue={defaults.footerText} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signatoryName">Signatory name</Label>
            <Input id="signatoryName" name="signatoryName" defaultValue={defaults.signatoryName} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signatoryTitle">Signatory title</Label>
            <Input id="signatoryTitle" name="signatoryTitle" defaultValue={defaults.signatoryTitle} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          variant="ghost"
          size="lg"
          nativeButton={false}
          className="w-full sm:w-auto"
          render={<Link href="/dashboard/settings/certificates" />}
        >
          Cancel
        </Button>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
