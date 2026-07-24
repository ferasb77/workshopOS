import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PrePostSurveyStatus } from "@/features/surveys/data";

const LABEL: Record<PrePostSurveyStatus, string> = {
  not_configured: "Not Configured",
  not_sent: "Not Sent",
  sent: "Sent",
  completed: "Completed",
};

type Props = {
  status: PrePostSurveyStatus;
  className?: string;
};

export function PrePostStatusBadge({ status, className }: Props) {
  if (status === "completed") {
    return <Badge className={className}>{LABEL[status]}</Badge>;
  }

  if (status === "sent") {
    return (
      <Badge variant="secondary" className={className}>
        {LABEL[status]}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn("border-transparent bg-muted text-muted-foreground", className)}>
      {LABEL[status]}
    </Badge>
  );
}
