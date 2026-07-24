import { requireEnv } from "@/infrastructure/env";
import { createServiceRoleClient } from "@/infrastructure/supabase/service-role";

const CERTIFICATES_BUCKET = "certificates";

let bucketEnsured = false;

/**
 * Creates the "certificates" bucket the first time it's needed. Cheap to
 * call on every issue/preview — after the first successful run in a given
 * server instance, `bucketEnsured` short-circuits the network round trip.
 * Public, since the whole point of a verification link is that anyone can
 * open the PDF without signing in — if the bucket already exists (this
 * project has one pre-provisioned) but is private, it's flipped to public
 * rather than left as a silent 404 on every verification link.
 */
async function ensureCertificatesBucket(): Promise<void> {
  if (bucketEnsured) {
    return;
  }

  const supabase = createServiceRoleClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(listError.message);
  }

  const existing = (buckets ?? []).find((bucket) => bucket.name === CERTIFICATES_BUCKET);

  if (!existing) {
    const { error: createError } = await supabase.storage.createBucket(CERTIFICATES_BUCKET, {
      public: true,
      fileSizeLimit: "10MB",
    });

    if (createError) {
      throw new Error(createError.message);
    }
  } else if (!existing.public) {
    const { error: updateError } = await supabase.storage.updateBucket(CERTIFICATES_BUCKET, { public: true });

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  bucketEnsured = true;
}

function objectPath(verificationCode: string): string {
  return `${verificationCode}.pdf`;
}

export async function uploadCertificatePdf(verificationCode: string, pdfBytes: Uint8Array): Promise<string> {
  await ensureCertificatesBucket();

  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage
    .from(CERTIFICATES_BUCKET)
    .upload(objectPath(verificationCode), Buffer.from(pdfBytes), {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return getCertificatePublicUrl(verificationCode);
}

export function getCertificatePublicUrl(verificationCode: string): string {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  return `${supabaseUrl}/storage/v1/object/public/${CERTIFICATES_BUCKET}/${objectPath(verificationCode)}`;
}

export async function downloadCertificatePdf(verificationCode: string): Promise<Buffer> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage.from(CERTIFICATES_BUCKET).download(objectPath(verificationCode));

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to download certificate PDF.");
  }

  return Buffer.from(await data.arrayBuffer());
}
