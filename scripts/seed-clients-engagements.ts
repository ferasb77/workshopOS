/**
 * Client / engagement demo seed for Sprint 11's Organization -> Client ->
 * Engagement -> Experience hierarchy.
 *
 * Run with: npx tsx scripts/seed-clients-engagements.ts
 *
 * Prerequisite: migrations/0011_client_engagement_hierarchy.sql must already
 * be applied (via the Supabase SQL editor) — this script only inserts rows,
 * it does not create tables or columns.
 *
 * Inserts 8 clients, 6 engagements, and links a subset of the existing demo
 * experiences (seeded by scripts/seed-demo.ts) to the engagement they
 * logically belong to. Never touches the real "ai-powered-design-thinking"
 * experience.
 *
 * Safe to re-run: clients are matched by name, engagements by
 * (client_id, title), and experience linking is idempotent (an UPDATE, not
 * an INSERT).
 */

import path from "node:path";

import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(path.resolve(import.meta.dirname, "..", ".env"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env. Aborting.");
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY in .env. This script needs the service role key " +
      "to bypass RLS (find it in Supabase → Project Settings → API). Aborting."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type ClientSeed = {
  name: string;
  type: "corporate" | "government";
  industry: string;
  country: string;
};

const CLIENTS: ClientSeed[] = [
  { name: "Saudi Aramco", type: "corporate", industry: "Energy", country: "Saudi Arabia" },
  { name: "Qatar Airways", type: "corporate", industry: "Aviation", country: "Qatar" },
  { name: "Emirates NBD", type: "corporate", industry: "Banking", country: "UAE" },
  {
    name: "Ministry of Human Resources KSA",
    type: "government",
    industry: "Government",
    country: "Saudi Arabia",
  },
  { name: "Ooredoo Group", type: "corporate", industry: "Telecom", country: "Qatar" },
  { name: "Majid Al Futtaim", type: "corporate", industry: "Retail", country: "UAE" },
  {
    name: "General Authority for Statistics KSA",
    type: "government",
    industry: "Government",
    country: "Saudi Arabia",
  },
  { name: "Etihad Airways", type: "corporate", industry: "Aviation", country: "UAE" },
];

type EngagementSeed = {
  clientName: string;
  title: string;
  type: "training_contract" | "coaching_program" | "blended_program";
  status: "active" | "completed";
  contractValue: number;
  /** Slugs of existing demo experiences (from scripts/seed-demo.ts) to link to this engagement. */
  experienceSlugs: string[];
};

const ENGAGEMENTS: EngagementSeed[] = [
  {
    clientName: "Saudi Aramco",
    title: "Leadership Excellence Program 2026",
    type: "training_contract",
    status: "active",
    contractValue: 180_000,
    experienceSlugs: ["demo-leadership-essentials-mar26", "demo-strategic-thinking-executives-apr26"],
  },
  {
    clientName: "Qatar Airways",
    title: "Customer Service Leadership",
    type: "training_contract",
    status: "active",
    contractValue: 95_000,
    experienceSlugs: ["demo-coaching-skills-managers-may26"],
  },
  {
    clientName: "Emirates NBD",
    title: "Digital Banking Leadership",
    type: "blended_program",
    status: "active",
    contractValue: 120_000,
    experienceSlugs: ["demo-emotional-intelligence-leadership-may26", "demo-change-management-fundamentals-jun26"],
  },
  {
    clientName: "Ministry of Human Resources KSA",
    title: "National Leadership Initiative",
    type: "training_contract",
    status: "active",
    contractValue: 350_000,
    experienceSlugs: ["demo-high-performance-teams-jun26", "demo-presentation-skills-advanced-jul26"],
  },
  {
    clientName: "Majid Al Futtaim",
    title: "Retail Leadership Academy",
    type: "training_contract",
    status: "completed",
    contractValue: 85_000,
    // The only unassigned demo experience with status "completed" — see
    // the sprint brief's "Majid Al Futtaim gets the completed workshops".
    experienceSlugs: ["demo-hogan-debrief-masterclass-apr26"],
  },
  {
    clientName: "Ooredoo Group",
    title: "Innovation Leadership Program",
    type: "coaching_program",
    status: "active",
    contractValue: 60_000,
    // Deliberately left without an experience yet — the brief doesn't
    // assign one, and it doubles as a live example for the dashboard's
    // "engagement with no experiences linked yet" attention flag.
    experienceSlugs: [],
  },
];

/**
 * clients/engagements carry workspace_id NOT NULL (unlike experiences,
 * where it's deliberately deferred — see migration 0002's comment). This
 * app is single-tenant so far, so the first workspace row is the only
 * sensible choice.
 */
async function resolveWorkspaceId(): Promise<string> {
  const { data, error } = await supabase.from("workspaces").select("id").limit(1).maybeSingle();

  if (error) {
    throw new Error(`Failed to read workspaces: ${error.message}`);
  }

  if (!data) {
    throw new Error("No workspace found — run migration 0001 (or its seed) before this script.");
  }

  return data.id;
}

async function seedClients(workspaceId: string): Promise<Map<string, string>> {
  const { data: existing, error: fetchError } = await supabase.from("clients").select("id, name");

  if (fetchError) {
    throw new Error(`Failed to read existing clients: ${fetchError.message}`);
  }

  const idByName = new Map<string, string>((existing ?? []).map((row) => [row.name, row.id]));

  for (const client of CLIENTS) {
    if (idByName.has(client.name)) {
      console.log(`Client "${client.name}" already exists — skipping.`);
      continue;
    }

    const { data: inserted, error } = await supabase
      .from("clients")
      .insert({
        workspace_id: workspaceId,
        name: client.name,
        type: client.type,
        industry: client.industry,
        country: client.country,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      throw new Error(`Failed to insert client "${client.name}": ${error?.message}`);
    }

    idByName.set(client.name, inserted.id);
    console.log(`Inserted client "${client.name}".`);
  }

  return idByName;
}

async function seedEngagements(
  workspaceId: string,
  clientIdByName: Map<string, string>
): Promise<Map<string, string>> {
  const { data: existing, error: fetchError } = await supabase.from("engagements").select("id, title, client_id");

  if (fetchError) {
    throw new Error(`Failed to read existing engagements: ${fetchError.message}`);
  }

  const idByKey = new Map<string, string>(
    (existing ?? []).map((row) => [`${row.client_id}::${row.title}`, row.id])
  );

  for (const engagement of ENGAGEMENTS) {
    const clientId = clientIdByName.get(engagement.clientName);
    if (!clientId) {
      throw new Error(`No client id resolved for "${engagement.clientName}" — cannot seed engagement.`);
    }

    const key = `${clientId}::${engagement.title}`;
    if (idByKey.has(key)) {
      console.log(`Engagement "${engagement.title}" already exists — skipping.`);
      continue;
    }

    const { data: inserted, error } = await supabase
      .from("engagements")
      .insert({
        workspace_id: workspaceId,
        client_id: clientId,
        title: engagement.title,
        type: engagement.type,
        status: engagement.status,
        contract_value: engagement.contractValue,
        currency: "USD",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      throw new Error(`Failed to insert engagement "${engagement.title}": ${error?.message}`);
    }

    idByKey.set(key, inserted.id);
    console.log(`Inserted engagement "${engagement.title}" for ${engagement.clientName}.`);
  }

  return idByKey;
}

async function linkExperiences(clientIdByName: Map<string, string>, engagementIdByKey: Map<string, string>) {
  for (const engagement of ENGAGEMENTS) {
    if (engagement.experienceSlugs.length === 0) {
      continue;
    }

    const clientId = clientIdByName.get(engagement.clientName);
    const engagementId = engagementIdByKey.get(`${clientId}::${engagement.title}`);

    if (!clientId || !engagementId) {
      throw new Error(`Could not resolve client/engagement ids for "${engagement.title}".`);
    }

    for (const slug of engagement.experienceSlugs) {
      const { data: updated, error } = await supabase
        .from("experiences")
        .update({ client_id: clientId, engagement_id: engagementId })
        .eq("slug", slug)
        .select("id")
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to link experience "${slug}": ${error.message}`);
      }

      if (!updated) {
        console.warn(`No experience found with slug "${slug}" — skipped (run scripts/seed-demo.ts first?).`);
        continue;
      }

      console.log(`Linked experience "${slug}" to "${engagement.title}" (${engagement.clientName}).`);
    }
  }
}

async function main() {
  const workspaceId = await resolveWorkspaceId();

  console.log("Seeding clients...");
  const clientIdByName = await seedClients(workspaceId);

  console.log("\nSeeding engagements...");
  const engagementIdByKey = await seedEngagements(workspaceId, clientIdByName);

  console.log("\nLinking experiences to engagements...");
  await linkExperiences(clientIdByName, engagementIdByKey);

  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
