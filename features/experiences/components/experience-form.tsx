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

import { createExperience, type CreateExperienceResult } from "../actions";
import {
  COUNTRIES,
  CREATE_STATUS_OPTIONS,
  EXPERIENCE_TYPE_LABELS,
  EXPERIENCE_TYPES,
  PROGRAM_TYPES,
} from "../schema";

const initialState: CreateExperienceResult = { success: false, error: "", values: {} };

type ClientOption = { id: string; name: string };
type EngagementOption = { id: string; title: string; clientId: string; clientName: string };

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
}: {
  name: string;
  label: string;
  placeholder: string;
  options: readonly string[];
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Select name={name} defaultValue={defaultValue || undefined}>
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
      {pending ? "Creating..." : "Create Experience"}
    </Button>
  );
}

type Props = {
  clients?: ClientOption[];
  engagements?: EngagementOption[];
  defaultClientId?: string;
  defaultEngagementId?: string;
};

export function ExperienceForm({
  clients = [],
  engagements = [],
  defaultClientId,
  defaultEngagementId,
}: Props) {
  const [state, action] = useActionState(createExperience, initialState);
  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const values = !state.success ? state.values : {};
  const field = (name: string) => values[name] ?? "";

  // Uncontrolled inputs only read `defaultValue` on mount. React also
  // resets a <form>'s fields after any action dispatch (success or not),
  // so on a validation/insert error we force a remount — keyed on the
  // returned values — to re-hydrate the form with what the user typed
  // instead of leaving it blank.
  const formKey = !state.success ? JSON.stringify(state.values) : "initial";

  return (
    <form key={formKey} action={action} className="space-y-6" noValidate>
      {!state.success && state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {state.error}
        </div>
      )}

      <FormSection
        number={1}
        title="Program Details"
        description="What this experience is and how it's tagged."
      >
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">
            Title <span className="text-gold">*</span>
          </Label>
          <Input id="title" name="title" required defaultValue={field("title")} />
          <FieldError messages={fieldErrors?.title} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="experienceType">Experience type</Label>
          <Select
            name="experienceType"
            defaultValue={field("experienceType") || "workshop"}
            items={EXPERIENCE_TYPES.map((type) => ({ value: type, label: EXPERIENCE_TYPE_LABELS[type] }))}
          >
            <SelectTrigger id="experienceType" className="w-full">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {EXPERIENCE_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <StringSelectField
          name="programType"
          label="Program type"
          placeholder="Select a type"
          options={PROGRAM_TYPES}
          defaultValue={field("programType")}
        />

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            name="status"
            defaultValue={field("status") || "active"}
            items={CREATE_STATUS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              {CREATE_STATUS_OPTIONS.map((option) => (
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
            defaultValue={field("description")}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            placeholder="e.g. leadership, executive, arabic-delivery"
            defaultValue={field("tags")}
          />
          <p className="text-xs text-muted-foreground">Comma-separated.</p>
        </div>
      </FormSection>

      {(clients.length > 0 || engagements.length > 0) && (
        <FormSection
          number={2}
          title="Client and Engagement"
          description="Which client and contract this experience belongs to, if any."
        >
          <div className="space-y-2">
            <Label htmlFor="clientId">Client</Label>
            <Select
              name="clientId"
              defaultValue={field("clientId") || defaultClientId || undefined}
              items={clients.map((client) => ({ value: client.id, label: client.name }))}
            >
              <SelectTrigger id="clientId" className="w-full">
                <SelectValue placeholder="No client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="engagementId">Engagement</Label>
            <Select
              name="engagementId"
              defaultValue={field("engagementId") || defaultEngagementId || undefined}
              items={engagements.map((engagement) => ({
                value: engagement.id,
                label: `${engagement.title} — ${engagement.clientName}`,
              }))}
            >
              <SelectTrigger id="engagementId" className="w-full">
                <SelectValue placeholder="No engagement" />
              </SelectTrigger>
              <SelectContent>
                {engagements.map((engagement) => (
                  <SelectItem key={engagement.id} value={engagement.id}>
                    {engagement.title} — {engagement.clientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FormSection>
      )}

      <FormSection
        number={clients.length > 0 || engagements.length > 0 ? 3 : 2}
        title="Schedule and Location"
        description="When and where this experience runs."
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
            defaultValue={field("startDate")}
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
            defaultValue={field("endDate")}
          />
          <FieldError messages={fieldErrors?.endDate} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="venueName">
            Venue name <span className="text-gold">*</span>
          </Label>
          <Input id="venueName" name="venueName" required defaultValue={field("venueName")} />
          <FieldError messages={fieldErrors?.venueName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={field("city")} />
        </div>

        <StringSelectField
          name="country"
          label="Country"
          placeholder="Select a country"
          options={COUNTRIES}
          defaultValue={field("country")}
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
            defaultValue={field("capacity")}
          />
          <FieldError messages={fieldErrors?.capacity} />
        </div>
      </FormSection>

      <FormSection
        number={clients.length > 0 || engagements.length > 0 ? 4 : 3}
        title="Client Details"
        description="Who this experience is being delivered for."
      >
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="clientName">Client organization name</Label>
          <Input id="clientName" name="clientName" defaultValue={field("clientName")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientContactName">Client contact name</Label>
          <Input
            id="clientContactName"
            name="clientContactName"
            defaultValue={field("clientContactName")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientContactEmail">Client contact email</Label>
          <Input
            id="clientContactEmail"
            name="clientContactEmail"
            type="email"
            defaultValue={field("clientContactEmail")}
          />
          <FieldError messages={fieldErrors?.clientContactEmail} />
        </div>
      </FormSection>

      <FormSection
        number={clients.length > 0 || engagements.length > 0 ? 5 : 4}
        title="Facilitator"
        description="Who is delivering this experience."
      >
        <div className="space-y-2">
          <Label htmlFor="facilitatorName">Facilitator name</Label>
          <Input
            id="facilitatorName"
            name="facilitatorName"
            defaultValue={field("facilitatorName")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="facilitatorEmail">Facilitator email</Label>
          <Input
            id="facilitatorEmail"
            name="facilitatorEmail"
            type="email"
            defaultValue={field("facilitatorEmail")}
          />
          <FieldError messages={fieldErrors?.facilitatorEmail} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="facilitatorNotes">Notes for facilitator</Label>
          <Textarea
            id="facilitatorNotes"
            name="facilitatorNotes"
            rows={3}
            defaultValue={field("facilitatorNotes")}
          />
        </div>
      </FormSection>

      <FormSection
        number={clients.length > 0 || engagements.length > 0 ? 6 : 5}
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
            defaultValue={field("materialsNotes")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logisticsNotes">Logistics notes</Label>
          <Textarea
            id="logisticsNotes"
            name="logisticsNotes"
            rows={3}
            placeholder="Venue setup, catering, AV requirements."
            defaultValue={field("logisticsNotes")}
          />
        </div>
      </FormSection>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          variant="ghost"
          size="lg"
          nativeButton={false}
          className="w-full sm:w-auto"
          render={<Link href="/dashboard/experiences" />}
        >
          Cancel
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
