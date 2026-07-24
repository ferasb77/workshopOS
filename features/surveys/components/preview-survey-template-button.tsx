"use client";

import { useState } from "react";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { SurveyQuestion } from "@/features/surveys/data";

import { getTemplateForPreview } from "../actions";
import { QuestionRenderer, type AnswerValue } from "./question-renderer";

type Props = {
  templateId: string;
};

/**
 * List-page variant of PreviewSurveyTemplateDialog — the list only has
 * question counts, not full question data, so this loads the template on
 * first open instead of taking pre-fetched questions as a prop.
 */
export function PreviewSurveyTemplateButton({ templateId }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<SurveyQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    setOpen(true);
    if (questions !== null) {
      return;
    }
    setIsLoading(true);
    try {
      const template = await getTemplateForPreview(templateId);
      if (!template) {
        setError("Template not found.");
        return;
      }
      setQuestions([...template.questions].sort((a, b) => a.orderIndex - b.orderIndex));
    } catch {
      setError("Unable to load this template.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" onClick={handleOpen}>
        <Eye className="size-3.5" />
        Preview
      </Button>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
          <DialogDescription>
            This is exactly what a participant sees. Nothing you enter here is saved.
          </DialogDescription>
        </DialogHeader>

        {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>}
        {error && <p className="py-6 text-center text-sm text-destructive">{error}</p>}

        {questions && questions.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">This template has no questions yet.</p>
        )}

        {questions && questions.length > 0 && (
          <div className="space-y-8 rounded-xl border border-border-subtle bg-night/40 p-5">
            {questions.map((question) => (
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
