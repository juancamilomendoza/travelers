import { createClient } from "@supabase/supabase-js";
import type { Config } from "@netlify/functions";

// Marks a lead as "wants an agency to contact me".
export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const body = (await req.json().catch(() => null)) as { leadId?: unknown } | null;
  const leadId = typeof body?.leadId === "string" ? body.leadId : "";
  if (!/^[0-9a-f-]{36}$/i.test(leadId)) return Response.json({ ok: false }, { status: 400 });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Response.json({ ok: false }, { status: 503 });

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.from("leads").update({ wants_contact: true }).eq("id", leadId);
  if (error) {
    console.error("contact update failed", error);
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true });
};

export const config: Config = { path: "/api/contact" };
