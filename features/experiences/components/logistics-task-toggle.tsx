"use client";

import { useState, useTransition } from "react";

import { Checkbox } from "@/components/ui/checkbox";

import { updateLogisticsTask } from "../actions";

type Props = {
  taskId: string;
  initialCompleted: boolean;
  disabled?: boolean;
  experienceSlug: string;
};

export function LogisticsTaskToggle({ taskId, initialCompleted, disabled, experienceSlug }: Props) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    setCompleted(checked);

    startTransition(async () => {
      const result = await updateLogisticsTask(taskId, checked, experienceSlug);

      if (!result.success) {
        setCompleted(!checked);
      }
    });
  }

  return (
    <Checkbox
      checked={completed}
      onCheckedChange={handleChange}
      disabled={disabled || isPending}
      className="mt-0.5"
      aria-label="Mark task complete"
    />
  );
}
