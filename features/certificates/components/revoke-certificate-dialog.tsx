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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { revokeCertificate } from "../actions";

type Props = {
  certificateId: string;
  participantName: string;
};

export function RevokeCertificateDialog({ certificateId, participantName }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);

    startTransition(async () => {
      const result = await revokeCertificate(certificateId, reason);

      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="ghost" size="sm" className="text-destructive" />}>
        Revoke
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke {participantName}&apos;s certificate?</DialogTitle>
          <DialogDescription>
            The certificate will no longer verify as valid. The PDF is kept for audit purposes but the public
            verification page will show it as revoked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="revocation-reason">Reason (optional)</Label>
          <Textarea
            id="revocation-reason"
            rows={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button type="button" variant="destructive" disabled={isPending} onClick={handleConfirm}>
            {isPending ? "Revoking..." : "Revoke Certificate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
