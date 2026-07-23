import Link from "next/link";

import { cn } from "@/lib/utils";

export const WORKSHOP_TABS = [
  { key: "participants", label: "Participants" },
  { key: "survey", label: "Survey Results" },
  { key: "logistics", label: "Logistics" },
] as const;

export type WorkshopTabKey = (typeof WORKSHOP_TABS)[number]["key"];

type Props = {
  slug: string;
  activeTab: WorkshopTabKey;
};

export function WorkshopTabs({ slug, activeTab }: Props) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-border-subtle">
      {WORKSHOP_TABS.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <Link
            key={tab.key}
            href={`/dashboard/workshops/${slug}?tab=${tab.key}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "border-gold text-gold"
                : "border-transparent text-muted-foreground hover:text-ivory"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
