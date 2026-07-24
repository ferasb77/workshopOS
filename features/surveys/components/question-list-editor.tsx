"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SurveyQuestion } from "@/features/surveys/data";
import { QUESTION_TYPE_LABELS } from "@/features/surveys/schema";

import { deleteQuestion, reorderQuestions } from "../actions";
import { QuestionEditorSheet } from "./question-editor-sheet";
import { QUESTION_TYPE_ICONS } from "./question-type-icon";

type Props = {
  templateId: string;
  questions: SurveyQuestion[];
};

function QuestionRow({
  question,
  index,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onEdit,
  onDelete,
}: {
  question: SurveyQuestion;
  index: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const Icon = QUESTION_TYPE_ICONS[question.questionType];

  return (
    <li
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(index);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(index);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-night/40 p-3 transition-colors",
        isDragging ? "opacity-40" : "opacity-100",
        isDragOver ? "border-gold/60" : "border-border-subtle"
      )}
    >
      <span className="mt-1 cursor-grab text-muted-foreground active:cursor-grabbing" aria-hidden>
        <GripVertical className="size-4" />
      </span>

      <Icon className="mt-0.5 size-4 shrink-0 text-gold" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-ivory">{question.questionText}</p>
          {question.isRequired && (
            <Badge variant="outline" className="border-gold/30 text-gold">
              Required
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{QUESTION_TYPE_LABELS[question.questionType]}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit question">
          <Pencil className="size-4" />
        </Button>
        {confirmingDelete ? (
          <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
            Confirm?
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setConfirmingDelete(true)}
            onBlur={() => setConfirmingDelete(false)}
            aria-label="Delete question"
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        )}
      </div>
    </li>
  );
}

export function QuestionListEditor({ templateId, questions }: Props) {
  const router = useRouter();
  // Seeded once from props — this component is remounted (via a `key` on
  // the element in the edit page tied to the question list's identity)
  // whenever the server data actually changes, so there's no need to
  // sync `questions` into state with an effect.
  const [localQuestions, setLocalQuestions] = useState(questions);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | undefined>(undefined);
  // Bumped on every open so QuestionEditorSheet remounts with fresh initial
  // state (derived straight from props) instead of needing an effect to
  // reset its fields when switching between questions or reopening "Add".
  const [sheetInstance, setSheetInstance] = useState(0);

  function handleDrop(dropIndex: number) {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...localQuestions];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    setLocalQuestions(reordered);
    setDragIndex(null);
    setDragOverIndex(null);

    reorderQuestions(
      templateId,
      reordered.map((question) => question.id)
    ).then(() => router.refresh());
  }

  async function handleDelete(questionId: string) {
    setLocalQuestions((prev) => prev.filter((question) => question.id !== questionId));
    await deleteQuestion(questionId, templateId);
    router.refresh();
  }

  function openAddSheet() {
    setEditingQuestion(undefined);
    setSheetInstance((n) => n + 1);
    setSheetOpen(true);
  }

  function openEditSheet(question: SurveyQuestion) {
    setEditingQuestion(question);
    setSheetInstance((n) => n + 1);
    setSheetOpen(true);
  }

  return (
    <Card className="bg-surface-elevated">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Questions</CardTitle>
          <CardDescription>Drag to reorder. Click a question to edit it.</CardDescription>
        </div>
        <Button type="button" onClick={openAddSheet}>
          <Plus className="size-4" />
          Add Question
        </Button>
      </CardHeader>
      <CardContent>
        {localQuestions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No questions yet. Add one to get started.</p>
        ) : (
          <ul className="space-y-2">
            {localQuestions.map((question, index) => (
              <QuestionRow
                key={question.id}
                question={question}
                index={index}
                isDragging={dragIndex === index}
                isDragOver={dragOverIndex === index}
                onDragStart={setDragIndex}
                onDragOver={setDragOverIndex}
                onDrop={handleDrop}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onEdit={() => openEditSheet(question)}
                onDelete={() => handleDelete(question.id)}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <QuestionEditorSheet
        key={sheetInstance}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        templateId={templateId}
        question={editingQuestion}
      />
    </Card>
  );
}
