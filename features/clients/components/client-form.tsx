"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { createClient, type CreateClientResult } from "../actions";
import { CLIENT_TYPE_LABELS, CLIENT_TYPES, COUNTRIES } from "../schema";

const initialState: CreateClientResult = { success: false, error: "", values: {} };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return <p className="mt-1 text-sm text-destructive">{messages[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Adding..." : "Add Client"}
    </Button>
  );
}

export function ClientForm() {
  const [state, action] = useActionState(createClient, initialState);
  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const values = !state.success ? state.values : {};
  const field = (name: string) => values[name] ?? "";

  // See features/experiences/components/experience-form.tsx for why the
  // form is remounted on error — uncontrolled fields only read
  // defaultValue on mount.
  const formKey = !state.success ? JSON.stringify(state.values) : "initial";

  return (
    <form key={formKey} action={action} className="space-y-6" noValidate>
      {!state.success && state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {state.error}
        </div>
      )}

      <Card className="bg-surface-elevated">
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Who this client is and where they&apos;re based.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">
              Client name <span className="text-gold">*</span>
            </Label>
            <Input id="name" name="name" required defaultValue={field("name")} />
            <FieldError messages={fieldErrors?.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              name="type"
              defaultValue={field("type") || "corporate"}
              items={CLIENT_TYPES.map((type) => ({ value: type, label: CLIENT_TYPE_LABELS[type] }))}
            >
              <SelectTrigger id="type" className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {CLIENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" name="industry" defaultValue={field("industry")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select name="country" defaultValue={field("country") || undefined}>
              <SelectTrigger id="country" className="w-full">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={field("city")} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="https://"
              defaultValue={field("website")}
            />
            <FieldError messages={fieldErrors?.website} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface-elevated">
        <CardHeader>
          <CardTitle>Primary Contact</CardTitle>
          <CardDescription>Who to reach at this client.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryContactName">Contact name</Label>
            <Input id="primaryContactName" name="primaryContactName" defaultValue={field("primaryContactName")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryContactEmail">Contact email</Label>
            <Input
              id="primaryContactEmail"
              name="primaryContactEmail"
              type="email"
              defaultValue={field("primaryContactEmail")}
            />
            <FieldError messages={fieldErrors?.primaryContactEmail} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="primaryContactPhone">Contact phone</Label>
            <Input id="primaryContactPhone" name="primaryContactPhone" type="tel" defaultValue={field("primaryContactPhone")} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={field("notes")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          variant="ghost"
          size="lg"
          nativeButton={false}
          className="w-full sm:w-auto"
          render={<Link href="/dashboard/clients" />}
        >
          Cancel
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
