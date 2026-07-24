import { Download } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CertificateTemplate, CompletionCriteria, ExperienceCertificateRow } from "@/features/certificates/data";

import { CompletionCriteriaForm } from "./completion-criteria-form";
import { CertificateStatusBadge } from "./certificate-status-badge";
import { IssueCertificateButton } from "./issue-certificate-button";
import { IssueAllEligibleButton } from "./issue-all-eligible-button";
import { EmailCertificateButton } from "./email-certificate-button";
import { RevokeCertificateDialog } from "./revoke-certificate-dialog";

const SURVEY_STATUS_LABEL: Record<ExperienceCertificateRow["surveyStatus"], string> = {
  not_sent: "Not Sent",
  sent: "Sent",
  opened: "Opened",
  completed: "Completed",
};

function RowActions({ row, experienceId }: { row: ExperienceCertificateRow; experienceId: string }) {
  if (!row.certificate || row.certificate.status === "revoked") {
    return <IssueCertificateButton participantId={row.participantId} experienceId={experienceId} eligible={row.eligible} />;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <a
        href={row.certificate.downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
      >
        <Download className="size-3.5" />
        Download
      </a>
      <EmailCertificateButton certificateId={row.certificate.id} alreadyEmailed={row.certificate.emailedAt !== null} />
      <RevokeCertificateDialog certificateId={row.certificate.id} participantName={row.fullName} />
    </div>
  );
}

type Props = {
  experienceId: string;
  criteria: CompletionCriteria;
  templates: CertificateTemplate[];
  rows: ExperienceCertificateRow[];
};

export function CertificatesTab({ experienceId, criteria, templates, rows }: Props) {
  const eligibleUnissuedCount = rows.filter((row) => row.eligible && (!row.certificate || row.certificate.status === "revoked")).length;
  const issuedCount = rows.filter((row) => row.certificate?.status === "issued").length;

  return (
    <div className="space-y-6">
      <CompletionCriteriaForm experienceId={experienceId} criteria={criteria} templates={templates} />

      <Card className="bg-surface-elevated">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Issued Certificates</CardTitle>
            <CardDescription>
              {issuedCount} of {rows.length} participants have a certificate.
            </CardDescription>
          </div>
          <IssueAllEligibleButton experienceId={experienceId} eligibleUnissuedCount={eligibleUnissuedCount} />
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No participants yet.</p>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Survey</TableHead>
                      <TableHead>Eligible</TableHead>
                      <TableHead>Certificate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.participantId}>
                        <TableCell className="font-medium">{row.fullName}</TableCell>
                        <TableCell className="text-muted-foreground">{row.company ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.checkedIn ? "Checked in" : "Not checked in"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {SURVEY_STATUS_LABEL[row.surveyStatus]}
                        </TableCell>
                        <TableCell>
                          {row.eligible ? (
                            <span className="text-emerald-400">Eligible</span>
                          ) : (
                            <span className="text-muted-foreground">Not eligible</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <CertificateStatusBadge
                            status={row.certificate ? row.certificate.status : "not_issued"}
                            issuedAt={row.certificate?.issuedAt}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <RowActions row={row} experienceId={experienceId} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <ul className="space-y-3 md:hidden">
                {rows.map((row) => (
                  <li key={row.participantId} className="rounded-lg border border-border-subtle bg-night/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ivory">{row.fullName}</p>
                      <CertificateStatusBadge
                        status={row.certificate ? row.certificate.status : "not_issued"}
                        issuedAt={row.certificate?.issuedAt}
                      />
                    </div>
                    {row.company && <p className="mt-1 text-sm text-muted-foreground">{row.company}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {row.checkedIn ? "Checked in" : "Not checked in"} · Survey: {SURVEY_STATUS_LABEL[row.surveyStatus]} ·{" "}
                      {row.eligible ? "Eligible" : "Not eligible"}
                    </p>
                    <div className="mt-3">
                      <RowActions row={row} experienceId={experienceId} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
