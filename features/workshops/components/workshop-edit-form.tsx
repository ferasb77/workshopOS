"use client";

import type { ReactNode } from "react";
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
import type { WorkshopDetailRecord } from "@/features/workshops/data";

import { updateWorkshop, type UpdateWorkshopResult } from "../actions";
import { COUNTRIES, PROGRAM_TYPES, WORKSHOP_STATUS_OPTIONS, WORKSHOP_STATUS_TRANSITIONS } from "../schema";
import { DeleteWorkshopDialog } from "./delete-workshop-dialog";

const initialState: UpdateWorkshopResult = { success: false, error: "", values: {} };

/** Postgres returns timestamptz as an ISO string with an offset; the value
 * was originally written as a bare datetime-local string (see actions.ts),
 * so slicing back to "YYYY-MM-DDTHH:mm" round-trips exactly — running it
 * through Date getters instead would reinterpret it in the browser's local
 * timezone and could shift the displayed time. */
function toDateTimeLocalValue(iso: string): string {
  return iso.slice(0, 16);
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return <p className="mt-1 text-sm text-destructive">{messages[0]}</p>;
}

function FormSection({
  number,
  title,
  description,
  children,
  columns = true,
}: {
  number: number;
  title: string;
  description: string;
  children: ReactNode;
  columns?: boolean;
}) {
  return (
    <Card className="bg-surface-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5 text-ivory">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-semibold text-night">
            {number}
          </span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className={columns ? "grid gap-5 sm:grid-cols-2" : "space-y-5"}>
        {children}
      </CardContent>
    </Card>
  );
}

function StringSelectField({
  name,
  label,
  placeholder,
  options,
  defaultValue,
  disabled,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: readonly string[];
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Select name={name} defaultValue={defaultValue || undefined} disabled={disabled}>
        <SelectTrigger id={name} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  );
}

type Props = {
  workshop: WorkshopDetailRecord;
};

export function WorkshopEditForm({ workshop }: Props) {
  const boundUpdateWorkshop = updateWorkshop.bind(null, workshop.id, workshop.slug);
  const [state, action] = useActionState(boundUpdateWorkshop, initialState);

  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const errorValues = !state.success ? state.values : undefined;

  const readOnly = workshop.status === "completed" || workshop.status === "cancelled";
  const canDelete = workshop.status === "draft" || workshop.status === "cancelled";

  // Falls back to the workshop's current value; once the action returns an
  // error, falls back to what the user actually typed instead so it isn't
  // lost. See workshop-form.tsx for why the form is remounted (via `key`)
  // on every error — uncontrolled fields only read defaultValue on mount.
  const field = (name: string, fallback: string): string => {
    if (errorValues && name in errorValues) {
      return errorValues[name] ?? "";
    }
    return fallback;
  };

  const formKey = errorValues ? JSON.stringify(errorValues) : "initial";

  const statusOptions = WORKSHOP_STATUS_OPTIONS.filter((option) =>
    WORKSHOP_STATUS_TRANSITIONS[workshop.status].includes(option.value)
  );

  return (
    <form key={formKey} action={action} className="space-y-6" noValidate>
      {readOnly && (
        <div className="rounded-lg border border-border-subtle bg-night/40 px-4 py-3 text-sm text-muted-foreground">
          This workshop has been {workshop.status === "completed" ? "completed" : "cancelled"} and
          cannot be edited.
        </div>
      )}

      {!state.success && state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {state.error}
        </div>
      )}

      <FormSection
        number={1}
        title="Program Details"
        description="What this workshop is and how it's tagged."
      >
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">
            Title <span className="text-gold">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            required
            disabled={readOnly}
            defaultValue={field("title", workshop.title)}
          />
          <FieldError messages={fieldErrors?.title} />
          <p className="text-xs text-muted-foreground">
            URL: /dashboard/workshops/{workshop.slug} — the slug is set once and cannot be
            changed.
          </p>
        </div>

        <StringSelectField
          name="programType"
          label="Program type"
          placeholder="Select a type"
          options={PROGRAM_TYPES}
          defaultValue={field("programType", workshop.programType ?? "")}
          disabled={readOnly}
        />

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            name="status"
            defaultValue={field("status", workshop.status)}
            disabled={readOnly}
            items={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            disabled={readOnly}
            defaultValue={field("description", workshop.description ?? "")}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            placeholder="e.g. leadership, executive, arabic-delivery"
            disabled={readOnly}
            defaultValue={field("tags", workshop.tags.join(", "))}
          />
          <p className="text-xs text-muted-foreground">Comma-separated.</p>
        </div>
      </FormSection>

      <FormSection
        number={2}
        title="Schedule and Location"
        description="When and where this workshop runs."
      >
        <div className="space-y-2">
          <Label htmlFor="startDate">
            Start date and time <span className="text-gold">*</span>
          </Label>
          <Input
            id="startDate"
            name="startDate"
            type="datetime-local"
            required
            disabled={readOnly}
            defaultValue={field("startDate", toDateTimeLocalValue(workshop.startDate))}
          />
          <FieldError messages={fieldErrors?.startDate} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">
            End date and time <span className="text-gold">*</span>
          </Label>
          <Input
            id="endDate"
            name="endDate"
            type="datetime-local"
            required
            disabled={readOnly}
            defaultValue={field("endDate", toDateTimeLocalValue(workshop.endDate))}
          />
          <FieldError messages={fieldErrors?.endDate} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="venueName">
            Venue name <span className="text-gold">*</span>
          </Label>
          <Input
            id="venueName"
            name="venueName"
            required
            disabled={readOnly}
            defaultValue={field("venueName", workshop.venue ?? "")}
          />
          <FieldError messages={fieldErrors?.venueName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            disabled={readOnly}
            defaultValue={field("city", workshop.city ?? "")}
          />
        </div>

        <StringSelectField
          name="country"
          label="Country"
          placeholder="Select a country"
          options={COUNTRIES}
          defaultValue={field("country", workshop.country ?? "")}
          disabled={readOnly}
        />

        <div className="space-y-2">
          <Label htmlFor="capacity">
            Capacity <span className="text-gold">*</span>
          </Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            required
            disabled={readOnly}
            defaultValue={field("capacity", String(workshop.capacity))}
          />
          <FieldError messages={fieldErrors?.capacity} />
        </div>
      </FormSection>

      <FormSection
        number={3}
        title="Client Details"
        description="Who this workshop is being delivered for."
      >
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="clientName">Client organization name</Label>
          <Input
            id="clientName"
            name="clientName"
            disabled={readOnly}
            defaultValue={field("clientName", workshop.clientName ?? "")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientContactName">Client contact name</Label>
          <Input
            id="clientContactName"
            name="clientContactName"
            disabled={readOnly}
            defaultValue={field("clientContactName", workshop.clientContactName ?? "")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientContactEmail">Client contact email</Label>
          <Input
            id="clientContactEmail"
            name="clientContactEmail"
            type="email"
            disabled={readOnly}
            defaultValue={field("clientContactEmail", workshop.clientContactEmail ?? "")}
          />
          <FieldError messages={fieldErrors?.clientContactEmail} />
        </div>
      </FormSection>

      <FormSection
        number={4}
        title="Facilitator"
        description="Who is delivering this workshop."
      >
        <div className="space-y-2">
          <Label htmlFor="facilitatorName">Facilitator name</Label>
          <Input
            id="facilitatorName"
            name="facilitatorName"
            disabled={readOnly}
            defaultValue={field("facilitatorName", workshop.facilitatorName ?? "")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="facilitatorEmail">Facilitator email</Label>
          <Input
            id="facilitatorEmail"
            name="facilitatorEmail"
            type="email"
            disabled={readOnly}
            defaultValue={field("facilitatorEmail", workshop.facilitatorEmail ?? "")}
          />
          <FieldError messages={fieldErrors?.facilitatorEmail} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="facilitatorNotes">Notes for facilitator</Label>
          <Textarea
            id="facilitatorNotes"
            name="facilitatorNotes"
            rows={3}
            disabled={readOnly}
            defaultValue={field("facilitatorNotes", workshop.facilitatorNotes ?? "")}
          />
        </div>
      </FormSection>

      <FormSection
        number={5}
        title="Logistics and Materials"
        description="What needs to be prepared before the day."
        columns={false}
      >
        <div className="space-y-2">
          <Label htmlFor="materialsNotes">Materials notes</Label>
          <Textarea
            id="materialsNotes"
            name="materialsNotes"
            rows={3}
            placeholder="What needs to be prepared, printed, or shipped."
            disabled={readOnly}
            defaultValue={field("materialsNotes", workshop.materialsNotes ?? "")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logisticsNotes">Logistics notes</Label>
          <Textarea
            id="logisticsNotes"
            name="logisticsNotes"
            rows={3}
            placeholder="Venue setup, catering, AV requirements."
            disabled={readOnly}
            defaultValue={field("logisticsNotes", workshop.logisticsNotes ?? "")}
          />
        </div>
      </FormSection>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          {canDelete && (
            <DeleteWorkshopDialog workshopId={workshop.id} className="w-full sm:w-auto" />
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <Button
            variant="ghost"
            size="lg"
            nativeButton={false}
            className="w-full sm:w-auto"
            render={<Link href={`/dashboard/workshops/${workshop.slug}`} />}
          >
            {readOnly ? "Back" : "Cancel"}
          </Button>
          {!readOnly && <SubmitButton />}
        </div>
      </div>
    </form>
  );
}
