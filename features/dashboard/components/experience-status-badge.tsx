import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ExperienceStatus } from "@/infrastructure/repositories/dashboard";

const STATUS_LABEL: Record<ExperienceStatus, string> = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

type Props = {
  status: ExperienceStatus;
  className?: string;
};

export function ExperienceStatusBadge({ status, className }: Props) {
  if (status === "active") {
    return <Badge className={className}>{STATUS_LABEL[status]}</Badge>;
  }

  if (status === "completed") {
    return (
      <Badge
        variant="outline"
        className={cn("border-transparent bg-muted text-muted-foreground", className)}
      >
        {STATUS_LABEL[status]}
      </Badge>
    );
  }

  if (status === "cancelled") {
    return (
      <Badge
        variant="outline"
        className={cn("border-destructive/30 text-destructive", className)}
      >
        {STATUS_LABEL[status]}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
