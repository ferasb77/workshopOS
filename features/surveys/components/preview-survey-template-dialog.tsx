"use client";

import { useState } from "react";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { SurveyQuestion } from "@/features/surveys/data";

import { QuestionRenderer, type AnswerValue } from "./question-renderer";

type Props = {
  questions: SurveyQuestion[];
  triggerLabel?: string;
};

export function PreviewSurveyTemplateDialog({ questions, triggerLabel = "Preview" }: Props) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  const sorted = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Eye className="size-3.5" />
        {triggerLabel}
      </Button>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
          <DialogDescription>
            This is exactly what a participant sees. Nothing you enter here is saved.
          </DialogDescription>
        </DialogHeader>

        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">This template has no questions yet.</p>
        ) : (
          <div className="space-y-8 rounded-xl border border-border-subtle bg-night/40 p-5">
            {sorted.map((question) => (
              <QuestionRenderer
                key={question.id}
                question={question}
                value={answers[question.id]}
                onChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
              />
            ))}
            <Button type="button" size="lg" className="w-full" disabled>
              Submit Feedback
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
