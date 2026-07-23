"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

import { downloadSurveyResults } from "../actions";

type Props = {
  experienceId: string;
  experienceSlug: string;
};

export function DownloadSurveyResultsButton({ experienceId, experienceSlug }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleDownload() {
    setIsExporting(true);
    try {
      const csv = await downloadSurveyResults(experienceId);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${experienceSlug}-survey-results.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleDownload} disabled={isExporting}>
      <Download className="size-4" />
      {isExporting ? "Exporting..." : "Download Results CSV"}
    </Button>
  );
}
