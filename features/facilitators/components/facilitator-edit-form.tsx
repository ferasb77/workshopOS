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
import { AVAILABILITY_OPTIONS, REGIONS } from "@/features/facilitators/schema";
import type { FacilitatorProfile } from "@/features/facilitators/data";

import { updateFacilitator, type UpdateFacilitatorResult } from "../actions";
import { TagInput } from "./tag-input";

const initialState: UpdateFacilitatorResult = { success: false, error: "", values: {} };

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

function CheckboxGroup({
  name,
  options,
  defaultValue = [],
}: {
  name: string;
  options: readonly string[];
  defaultValue?: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2 text-sm text-ivory">
          <input
            type="checkbox"
            name={name}
            value={option}
            defaultChecked={defaultValue.includes(option)}
            className="size-4 rounded border-input accent-gold"
          />
          {option}
        </label>
      ))}
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
  facilitator: FacilitatorProfile;
};

export function FacilitatorEditForm({ facilitator }: Props) {
  const boundUpdateFacilitator = updateFacilitator.bind(null, facilitator.id);
  const [state, action] = useActionState(boundUpdateFacilitator, initialState);
  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const errorValues = !state.success ? state.values : undefined;

  const field = (name: string, fallback: string): string => {
    if (errorValues && name in errorValues) {
      const value = errorValues[name];
      return typeof value === "string" ? value : fallback;
    }
    return fallback;
  };

  const fieldList = (name: string, fallback: string[]): string[] => {
    if (errorValues && name in errorValues) {
      const value = errorValues[name];
      return Array.isArray(value) ? value : fallback;
    }
    return fallback;
  };

  // See features/experiences/components/experience-form.tsx for why the form
  // is keyed on its own error state: React resets uncontrolled fields after
  // every action dispatch, so re-mounting with fresh defaultValues is how
  // submitted data survives a validation error.
  const formKey = errorValues ? JSON.stringify(errorValues) : "initial";

  return (
    <form key={formKey} action={action} className="space-y-6" noValidate>
      {!state.success && state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {state.error}
        </div>
      )}

      <FormSection
        number={1}
        title="Personal Details"
        description="Who this facilitator is and how to reach them."
      >
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First name <span className="text-gold">*</span>
          </Label>
          <Input id="firstName" name="firstName" required defaultValue={field("firstName", facilitator.firstName)} />
          <FieldError messages={fieldErrors?.firstName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last name <span className="text-gold">*</span>
          </Label>
          <Input id="lastName" name="lastName" required defaultValue={field("lastName", facilitator.lastName)} />
          <FieldError messages={fieldErrors?.lastName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-gold">*</span>
          </Label>
          <Input id="email" name="email" type="email" required defaultValue={field("email", facilitator.email)} />
          <FieldError messages={fieldErrors?.email} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={field("phone", facilitator.phone ?? "")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={field("title", facilitator.title ?? "")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organization">Organization</Label>
          <Input
            id="organization"
            name="organization"
            defaultValue={field("organization", facilitator.organization ?? "")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="yearsExperience">Years of experience</Label>
          <Input
            id="yearsExperience"
            name="yearsExperience"
            type="number"
            min={0}
            defaultValue={field("yearsExperience", facilitator.yearsExperience?.toString() ?? "")}
          />
          <FieldError messages={fieldErrors?.yearsExperience} />
        </div>
      </FormSection>

      <FormSection number={2} title="Bio" description="A short professional summary." columns={false}>
        <Textarea id="bio" name="bio" rows={4} defaultValue={field("bio", facilitator.bio ?? "")} />
      </FormSection>

      <FormSection
        number={3}
        title="Expertise"
        description="What this facilitator specializes in."
        columns={false}
      >
        <TagInput
          name="expertiseAreas"
          label="Expertise areas"
          placeholder="e.g. Leadership Development"
          defaultValue={fieldList("expertiseAreas", facilitator.expertiseAreas)}
        />
        <TagInput
          name="certifications"
          label="Certifications"
          placeholder="e.g. Hogan Certified Assessor"
          defaultValue={fieldList("certifications", facilitator.certifications)}
        />
      </FormSection>

      <FormSection
        number={4}
        title="Languages and Regions"
        description="Where and in what languages this facilitator can deliver."
        columns={false}
      >
        <TagInput
          name="languages"
          label="Languages"
          placeholder="e.g. Arabic"
          defaultValue={fieldList("languages", facilitator.languages)}
        />

        <div className="space-y-2">
          <Label>Regions</Label>
          <CheckboxGroup name="regions" options={REGIONS} defaultValue={fieldList("regions", facilitator.regions)} />
        </div>

        <label className="flex items-center gap-2 text-sm text-ivory">
          <input
            type="checkbox"
            name="willingToTravel"
            defaultChecked={
              errorValues && "willingToTravel" in errorValues
                ? errorValues.willingToTravel === "on"
                : facilitator.willingToTravel
            }
            className="size-4 rounded border-input accent-gold"
          />
          Willing to travel
        </label>

        <div className="space-y-2">
          <Label htmlFor="travelNotes">Travel notes</Label>
          <Textarea
            id="travelNotes"
            name="travelNotes"
            rows={2}
            defaultValue={field("travelNotes", facilitator.travelNotes ?? "")}
          />
        </div>
      </FormSection>

      <FormSection
        number={5}
        title="Documents"
        description="Passport and visa coverage."
      >
        <div className="space-y-2">
          <Label htmlFor="passportExpiry">Passport expiry</Label>
          <Input
            id="passportExpiry"
            name="passportExpiry"
            type="date"
            defaultValue={field("passportExpiry", facilitator.passportExpiry ?? "")}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Visa countries</Label>
          <CheckboxGroup
            name="visaCountries"
            options={REGIONS}
            defaultValue={fieldList("visaCountries", facilitator.visaCountries)}
          />
        </div>
      </FormSection>

      <FormSection
        number={6}
        title="Availability"
        description="Current status and any scheduling notes."
      >
        <div className="space-y-2">
          <Label htmlFor="availabilityStatus">Status</Label>
          <Select
            name="availabilityStatus"
            defaultValue={field("availabilityStatus", facilitator.availabilityStatus)}
            items={AVAILABILITY_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          >
            <SelectTrigger id="availabilityStatus" className="w-full">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABILITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="availabilityNotes">Availability notes</Label>
          <Textarea
            id="availabilityNotes"
            name="availabilityNotes"
            rows={2}
            defaultValue={field("availabilityNotes", facilitator.availabilityNotes ?? "")}
          />
        </div>
      </FormSection>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          variant="ghost"
          size="lg"
          nativeButton={false}
          className="w-full sm:w-auto"
          render={<Link href={`/dashboard/facilitators/${facilitator.id}`} />}
        >
          Cancel
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
