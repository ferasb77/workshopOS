/**
 * Pre/post training survey template seed for CapabilityOS (Sprint 19).
 *
 * Run with: npx tsx scripts/seed-survey-templates.ts
 *
 * Creates "Standard Pre-Training Assessment" and "Standard Post-Training
 * Assessment" as the default templates for their respective survey types,
 * so operators have a ready-to-use starting point instead of building
 * pre/post surveys from scratch. Kept as a separate seed script (not part
 * of migration 0017) so operators can freely edit or delete these without
 * a future migration re-inserting them.
 *
 * The two rating questions ("How confident are you in [topic]?" and "What
 * is your current knowledge level?") are deliberately worded identically on
 * both templates — the Learning Impact tab matches pre/post questions by
 * question_text, so this is what makes the two templates comparable.
 *
 * Safe to re-run: templates are looked up by (workspace_id, name) first and
 * skipped if they already exist; each already-existing template's questions
 * are left untouched (an operator may have customized them).
 */

import path from "node:path";

import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(path.resolve(import.meta.dirname, "..", ".env"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env. Aborting.");
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY in .env. This script needs the service role key " +
      "to bypass RLS (find it in Supabase → Project Settings → API). Aborting."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type QuestionSeed = {
  orderIndex: number;
  questionType: "rating_5" | "rating_10" | "nps" | "single_choice" | "multiple_choice" | "open_text" | "yes_no";
  questionText: string;
  lowLabel?: string;
  highLabel?: string;
  isRequired?: boolean;
};

const CONFIDENCE_QUESTION = "How confident are you in [topic]?";
const KNOWLEDGE_QUESTION = "What is your current knowledge level?";

const PRE_TRAINING_QUESTIONS: QuestionSeed[] = [
  { orderIndex: 1, questionType: "rating_5", questionText: CONFIDENCE_QUESTION },
  { orderIndex: 2, questionType: "rating_5", questionText: KNOWLEDGE_QUESTION, lowLabel: "Beginner", highLabel: "Expert" },
  { orderIndex: 3, questionType: "open_text", questionText: "What do you hope to learn from this program?", isRequired: false },
  {
    orderIndex: 4,
    questionType: "open_text",
    questionText: "What challenges do you currently face related to this topic?",
    isRequired: false,
  },
];

const POST_TRAINING_QUESTIONS: QuestionSeed[] = [
  { orderIndex: 1, questionType: "rating_5", questionText: CONFIDENCE_QUESTION },
  { orderIndex: 2, questionType: "rating_5", questionText: KNOWLEDGE_QUESTION, lowLabel: "Beginner", highLabel: "Expert" },
  { orderIndex: 3, questionType: "rating_5", questionText: "How has your confidence changed?" },
  { orderIndex: 4, questionType: "open_text", questionText: "What will you apply from this program?", isRequired: false },
  {
    orderIndex: 5,
    questionType: "nps",
    questionText: "How likely are you to recommend this program?",
    lowLabel: "Not at all likely",
    highLabel: "Extremely likely",
  },
];

async function ensureTemplate(
  workspaceId: string,
  name: string,
  surveyType: "pre_training" | "post_training",
  questions: QuestionSeed[]
) {
  const { data: existing, error: existingError } = await supabase
    .from("survey_templates")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("name", name)
    .maybeSingle();

  if (existingError) {
    console.error(`Failed to check for existing template "${name}": ${existingError.message}`);
    process.exit(1);
  }

  if (existing) {
    console.log(`  - "${name}" already exists, skipping`);
    return;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("survey_templates")
    .insert({
      workspace_id: workspaceId,
      name,
      description: `Default ${surveyType === "pre_training" ? "pre" : "post"}-training survey.`,
      survey_type: surveyType,
      is_default: true,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error(`Failed to create template "${name}": ${insertError?.message ?? "unknown error"}`);
    process.exit(1);
  }

  for (const question of questions) {
    const { error: questionError } = await supabase.from("survey_questions").insert({
      template_id: inserted.id,
      order_index: question.orderIndex,
      question_type: question.questionType,
      question_text: question.questionText,
      is_required: question.isRequired ?? true,
      low_label: question.lowLabel ?? null,
      high_label: question.highLabel ?? null,
    });

    if (questionError) {
      console.error(`Failed to insert question "${question.questionText}" for "${name}": ${questionError.message}`);
      process.exit(1);
    }
  }

  console.log(`  + "${name}" (${questions.length} questions)`);
}

async function main() {
  console.log("CapabilityOS pre/post survey template seed");
  console.log("============================================\n");

  const { data: workspace, error: workspaceError } = await supabase.from("workspaces").select("id").limit(1).maybeSingle();

  if (workspaceError) {
    console.error(`Failed to read workspaces: ${workspaceError.message}`);
    process.exit(1);
  }

  if (!workspace) {
    console.error("No workspace found. Aborting.");
    process.exit(1);
  }

  console.log("Creating default templates...");
  await ensureTemplate(workspace.id, "Standard Pre-Training Assessment", "pre_training", PRE_TRAINING_QUESTIONS);
  await ensureTemplate(workspace.id, "Standard Post-Training Assessment", "post_training", POST_TRAINING_QUESTIONS);

  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Seed script failed:", error);
  process.exit(1);
});
