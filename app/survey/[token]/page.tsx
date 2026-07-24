import { SurveyForm } from "@/features/surveys/components/survey-form";
import { CustomSurveyForm } from "@/features/surveys/components/custom-survey-form";
import { SurveyThankYou } from "@/features/surveys/components/survey-thank-you";
import type { PublicSurveyQuestion } from "@/features/surveys/components/question-renderer";
import { createClient } from "@/infrastructure/supabase/server";

type SurveyContextRow = {
  token_id: string | null;
  is_valid: boolean;
  is_completed: boolean;
  participant_first_name: string | null;
  experience_title: string | null;
  template_id: string | null;
  template_questions: PublicSurveyQuestion[] | null;
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function SurveyPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_survey_context", { p_token: token }).single();

  const context = !error && data ? (data as SurveyContextRow) : null;

  return (
    <main className="min-h-screen bg-night px-4 py-10 text-ivory sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        {!context || !context.is_valid ? (
          <InvalidState />
        ) : (
          <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-10">
            {context.is_completed ? (
              <SurveyThankYou />
            ) : context.template_questions && context.template_questions.length > 0 ? (
              <CustomSurveyForm
                token={token}
                participantFirstName={context.participant_first_name ?? "there"}
                experienceTitle={context.experience_title ?? "the experience"}
                questions={context.template_questions}
              />
            ) : (
              <SurveyForm
                token={token}
                participantFirstName={context.participant_first_name ?? "there"}
                experienceTitle={context.experience_title ?? "the experience"}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function InvalidState() {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-10 text-center">
      <h1 className="font-heading text-2xl font-semibold text-ivory">Survey link not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This survey link is invalid or has expired. Please contact Enable My Growth if you believe
        this is a mistake.
      </p>
    </div>
  );
}
