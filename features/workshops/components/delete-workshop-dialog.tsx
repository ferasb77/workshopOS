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

import { deleteWorkshop } from "../actions";

type Props = {
  workshopId: string;
  className?: string;
};

export function DeleteWorkshopDialog({ workshopId, className }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);

    startTransition(async () => {
      const result = await deleteWorkshop(workshopId);

      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="destructive" className={className} />}>
        Delete Workshop
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this workshop?</DialogTitle>
          <DialogDescription>
            This will permanently delete the workshop and all associated data. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button type="button" variant="destructive" disabled={isPending} onClick={handleConfirm}>
            {isPending ? "Deleting..." : "Delete Workshop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
