import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getWorkshopBySlug } from "@/features/workshops/data";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditWorkshopPage({ params }: Props) {
  const { slug } = await params;
  const workshop = await getWorkshopBySlug(slug);

  if (!workshop) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/dashboard/workshops/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="size-4" />
        Back to {workshop.title}
      </Link>

      <Card className="bg-surface-elevated">
        <CardHeader>
          <CardTitle>Edit Workshop</CardTitle>
          <CardDescription>
            Editing is planned for a later sprint. For now, this is a placeholder.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This is where program details, schedule, client and facilitator information, and
          logistics notes for <strong className="text-ivory">{workshop.title}</strong> can be
          updated.
        </CardContent>
      </Card>
    </div>
  );
}
