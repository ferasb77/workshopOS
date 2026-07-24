import { Badge } from "@/components/ui/badge";

type Props = {
  status: "not_issued" | "issued" | "revoked";
  issuedAt?: string | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function CertificateStatusBadge({ status, issuedAt }: Props) {
  if (status === "issued") {
    return (
      <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
        Issued{issuedAt ? ` · ${formatDate(issuedAt)}` : ""}
      </Badge>
    );
  }

  if (status === "revoked") {
    return <Badge variant="destructive">Revoked</Badge>;
  }

  return <Badge variant="secondary">Not Issued</Badge>;
}
