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

import { createEngagement, type CreateEngagementResult } from "../actions";
import { CURRENCIES, ENGAGEMENT_STATUS_OPTIONS, ENGAGEMENT_TYPES, ENGAGEMENT_TYPE_LABELS } from "../schema";

const initialState: CreateEngagementResult = { success: false, error: "", values: {} };

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
      {pending ? "Creating..." : "Create Engagement"}
    </Button>
  );
}

type Props = {
  clientId: string;
  clientName: string;
};

export function EngagementForm({ clientId, clientName }: Props) {
  const boundCreateEngagement = createEngagement.bind(null, clientId);
  const [state, action] = useActionState(boundCreateEngagement, initialState);
  const fieldErrors = !state.success ? state.fieldErrors : undefined;
  const values = !state.success ? state.values : {};
  const field = (name: string) => values[name] ?? "";

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
          <CardTitle>Engagement Details</CardTitle>
          <CardDescription>The contract or project for {clientName}.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">
              Title <span className="text-gold">*</span>
            </Label>
            <Input id="title" name="title" required defaultValue={field("title")} />
            <FieldError messages={fieldErrors?.title} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              name="type"
              defaultValue={field("type") || "training_contract"}
              items={ENGAGEMENT_TYPES.map((type) => ({ value: type, label: ENGAGEMENT_TYPE_LABELS[type] }))}
            >
              <SelectTrigger id="type" className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {ENGAGEMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {ENGAGEMENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              name="status"
              defaultValue={field("status") || "active"}
              items={ENGAGEMENT_STATUS_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {ENGAGEMENT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={field("description")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start date</Label>
            <Input id="startDate" name="startDate" type="date" defaultValue={field("startDate")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End date</Label>
            <Input id="endDate" name="endDate" type="date" defaultValue={field("endDate")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractValue">Contract value</Label>
            <Input
              id="contractValue"
              name="contractValue"
              type="number"
              min={0}
              step="0.01"
              defaultValue={field("contractValue")}
            />
            <FieldError messages={fieldErrors?.contractValue} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select name="currency" defaultValue={field("currency") || "USD"} items={CURRENCIES.map((c) => ({ value: c, label: c }))}>
              <SelectTrigger id="currency" className="w-full">
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          render={<Link href={`/dashboard/clients/${clientId}`} />}
        >
          Cancel
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
