import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LogisticsCategory, LogisticsCategoryGroup, LogisticsStatus } from "@/features/workshops/data";

import { LogisticsTaskToggle } from "./logistics-task-toggle";

const CATEGORY_LABEL: Record<LogisticsCategory, string> = {
  venue: "Venue",
  catering: "Catering",
  printing: "Printing",
  shipping: "Shipping",
  travel: "Travel",
  accommodation: "Accommodation",
  av_equipment: "AV Equipment",
  materials: "Materials",
  communication: "Communication",
  other: "Other",
};

const STATUS_LABEL: Record<LogisticsStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
  not_applicable: "Not Applicable",
};

function StatusBadge({ status }: { status: LogisticsStatus }) {
  if (status === "completed") {
    return (
      <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">
        {STATUS_LABEL[status]}
      </Badge>
    );
  }

  if (status === "in_progress") {
    return (
      <Badge variant="outline" className="border-gold/40 text-gold">
        {STATUS_LABEL[status]}
      </Badge>
    );
  }

  if (status === "blocked") {
    return (
      <Badge variant="outline" className="border-destructive/30 text-destructive">
        {STATUS_LABEL[status]}
      </Badge>
    );
  }

  if (status === "not_applicable") {
    return (
      <Badge variant="outline" className="border-transparent bg-muted/50 text-muted-foreground/70">
        {STATUS_LABEL[status]}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-muted-foreground">
      {STATUS_LABEL[status]}
    </Badge>
  );
}

function dueDateInfo(
  dueDate: string | null,
  status: LogisticsStatus
): { label: string | null; overdue: boolean } {
  if (!dueDate) {
    return { label: null, overdue: false };
  }

  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  const isDone = status === "completed" || status === "not_applicable";

  if (diffDays < 0 && !isDone) {
    const days = Math.abs(diffDays);
    return { label: `Overdue by ${days} day${days === 1 ? "" : "s"}`, overdue: true };
  }

  if (diffDays === 0) {
    return { label: "Due today", overdue: false };
  }

  if (diffDays > 0) {
    return { label: `Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`, overdue: false };
  }

  const days = Math.abs(diffDays);
  return { label: `Was due ${days} day${days === 1 ? "" : "s"} ago`, overdue: false };
}

function SummaryTile({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-night/40 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-heading text-2xl font-semibold",
          danger ? "text-destructive" : "text-gold"
        )}
      >
        {value}
      </p>
    </div>
  );
}

type Props = {
  workshopSlug: string;
  isLocked: boolean;
  groups: LogisticsCategoryGroup[];
};

export function LogisticsTab({ workshopSlug, isLocked, groups }: Props) {
  const allTasks = groups.flatMap((group) => group.tasks);
  const total = allTasks.length;

  if (total === 0) {
    return (
      <Card className="bg-surface-elevated">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No logistics tasks yet.
        </CardContent>
      </Card>
    );
  }

  const completedCount = isLocked
    ? total
    : allTasks.filter((task) => task.status === "completed" || task.status === "not_applicable")
        .length;

  const overdueCount = isLocked
    ? 0
    : allTasks.filter((task) => dueDateInfo(task.dueDate, task.status).overdue).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryTile label="Tasks Complete" value={`${completedCount} of ${total}`} />
        <SummaryTile label="Overdue" value={String(overdueCount)} danger={overdueCount > 0} />
      </div>

      {isLocked && (
        <p className="text-sm text-muted-foreground">
          This workshop is no longer active, so the logistics checklist is read-only.
        </p>
      )}

      {groups.map((group) => (
        <Card key={group.category} className="bg-surface-elevated">
          <CardHeader>
            <CardTitle>{CATEGORY_LABEL[group.category]}</CardTitle>
            <CardDescription>
              {group.tasks.length} task{group.tasks.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border-subtle">
              {group.tasks.map((task) => {
                const due = dueDateInfo(task.dueDate, task.status);
                const checked = isLocked || task.status === "completed";

                return (
                  <li key={task.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <LogisticsTaskToggle
                      taskId={task.id}
                      initialCompleted={checked}
                      disabled={isLocked}
                      workshopSlug={workshopSlug}
                    />

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium text-ivory",
                            checked && "text-muted-foreground line-through"
                          )}
                        >
                          {task.title}
                        </p>
                        <StatusBadge status={isLocked ? "completed" : task.status} />
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {due.label && (
                          <span className={due.overdue ? "font-medium text-destructive" : ""}>
                            {due.label}
                          </span>
                        )}
                        {task.assignedTo && <span>Assigned to {task.assignedTo}</span>}
                      </div>

                      {task.notes && <p className="text-xs text-muted-foreground">{task.notes}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
