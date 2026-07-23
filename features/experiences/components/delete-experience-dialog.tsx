"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { deleteExperience } from "../actions";

type Props = {
  experienceId: string;
  className?: string;
};

export function DeleteExperienceDialog({ experienceId, className }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);

    startTransition(async () => {
      const result = await deleteExperience(experienceId);

      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="destructive" className={className} />}>
        Delete Experience
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this experience?</DialogTitle>
          <DialogDescription>
            This will permanently delete the experience and all associated data. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button type="button" variant="destructive" disabled={isPending} onClick={handleConfirm}>
            {isPending ? "Deleting..." : "Delete Experience"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
