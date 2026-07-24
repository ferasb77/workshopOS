"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { SurveyQuestion } from "@/features/surveys/data";
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  isChoiceQuestionType,
  isRatingQuestionType,
  type QuestionType,
} from "@/features/surveys/schema";

import { addQuestion, updateQuestion } from "../actions";
import { QUESTION_TYPE_ICONS } from "./question-type-icon";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  question?: SurveyQuestion;
};

export function QuestionEditorSheet({ open, onOpenChange, templateId, question }: Props) {
  const router = useRouter();
  const isEditMode = Boolean(question);

  const [questionType, setQuestionType] = useState<QuestionType>(question?.questionType ?? "rating_5");
  const [questionText, setQuestionText] = useState(question?.questionText ?? "");
  const [description, setDescription] = useState(question?.description ?? "");
  const [isRequired, setIsRequired] = useState(question?.isRequired ?? true);
  const [lowLabel, setLowLabel] = useState(question?.lowLabel ?? "");
  const [highLabel, setHighLabel] = useState(question?.highLabel ?? "");
  const [options, setOptions] = useState<string[]>(question?.options ?? []);
  const [optionInput, setOptionInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function addOption() {
    const trimmed = optionInput.trim();
    if (trimmed.length === 0) {
      return;
    }
    setOptions((prev) => [...prev, trimmed]);
    setOptionInput("");
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);

    const values = {
      questionType,
      questionText,
      description: description || undefined,
      isRequired,
      lowLabel: lowLabel || undefined,
      highLabel: highLabel || undefined,
      options: isChoiceQuestionType(questionType) ? options : undefined,
    };

    const result = isEditMode
      ? await updateQuestion(question!.id, templateId, values)
      : await addQuestion(templateId, values);

    setIsSaving(false);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Question" : "Add Question"}</SheetTitle>
          <SheetDescription>Configure how this question appears to participants.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4">
          <div className="space-y-2">
            <Label htmlFor="question-type">Question type</Label>
            <Select
              value={questionType}
              onValueChange={(value) => value && setQuestionType(value as QuestionType)}
              items={QUESTION_TYPES.map((type) => ({ value: type, label: QUESTION_TYPE_LABELS[type] }))}
            >
              <SelectTrigger id="question-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((type) => {
                  const Icon = QUESTION_TYPE_ICONS[type];
                  return (
                    <SelectItem key={type} value={type}>
                      <Icon className="size-4" />
                      {QUESTION_TYPE_LABELS[type]}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-text">
              Question text <span className="text-gold">*</span>
            </Label>
            <Input id="question-text" value={questionText} onChange={(event) => setQuestionText(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-description">Description / hint (optional)</Label>
            <Textarea
              id="question-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="question-required">Required</Label>
            <Switch id="question-required" checked={isRequired} onCheckedChange={setIsRequired} />
          </div>

          {isRatingQuestionType(questionType) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="low-label">Low label</Label>
                <Input id="low-label" value={lowLabel} onChange={(event) => setLowLabel(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="high-label">High label</Label>
                <Input id="high-label" value={highLabel} onChange={(event) => setHighLabel(event.target.value)} />
              </div>
            </div>
          )}

          {isChoiceQuestionType(questionType) && (
            <div className="space-y-2">
              <Label htmlFor="option-input">Options</Label>
              <div className="flex gap-2">
                <Input
                  id="option-input"
                  value={optionInput}
                  onChange={(event) => setOptionInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addOption();
                    }
                  }}
                  placeholder="Type an option, press Enter"
                />
                <Button type="button" variant="outline" onClick={addOption}>
                  Add
                </Button>
              </div>
              <ul className="space-y-1.5">
                {options.map((option, index) => (
                  <li
                    key={`${option}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle bg-night/40 px-3 py-2 text-sm"
                  >
                    {option}
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${option}`}
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
              {options.length < 2 && (
                <p className="text-xs text-muted-foreground">Add at least 2 options.</p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter>
          <Button type="button" disabled={isSaving || questionText.trim().length === 0} onClick={handleSave}>
            {isSaving ? "Saving..." : "Save Question"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
