import { preflightRejectSecrets } from "../_shared/redact.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const pf = preflightRejectSecrets(body, corsHeaders);
    if (pf) return pf;

    const { description, appName, engine = "InnoDB", charset = "utf8mb4" } = body as {
      description?: string;
      appName?: string;
      engine?: string;
      charset?: string;
    };

    if (!description || typeof description !== "string" || description.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Provide a description of at least 10 characters." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const prompt = `You are a senior database architect. Generate a production-ready MySQL 8+ schema as a REPLACEMENT for a Supabase/Postgres backend. Output ONLY valid MySQL DDL — no markdown fences, no prose.

Requirements:
- Dialect: MySQL 8.0+, ENGINE=${engine}, DEFAULT CHARSET=${charset}, COLLATE=${charset}_unicode_ci
- Use CHAR(36) for UUID primary keys with DEFAULT (UUID())
- Use TIMESTAMP columns with DEFAULT CURRENT_TIMESTAMP and ON UPDATE CURRENT_TIMESTAMP for updated_at
- Add appropriate indexes and FOREIGN KEY constraints with ON DELETE CASCADE where sensible
- Include a users table (id, email UNIQUE, password_hash, created_at) as MySQL substitute for Supabase auth.users
- Add a user_roles table + role enum for RBAC (substitute for Supabase RLS)
- Add SQL COMMENTs describing each table and non-obvious columns
- Wrap in a single transaction; end with a brief -- NOTES comment block explaining RLS-equivalent enforcement (must be done in the application layer via user_id filters)
- ${appName ? `Application name: ${appName}` : ""}

App description:
${description}`;

    const aiResp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: "You output MySQL DDL only. No markdown, no commentary outside SQL comments." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("gen-sql error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: `AI error: ${aiResp.status}` }), {
        status: aiResp.status === 429 ? 429 : aiResp.status === 402 ? 402 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    let sql: string = aiData.choices?.[0]?.message?.content || "";
    // Strip accidental markdown fences
    sql = sql.replace(/^```(?:sql|mysql)?\s*/i, "").replace(/```\s*$/i, "").trim();

    return new Response(JSON.stringify({ success: true, sql, dialect: "mysql" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-sql-schema error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
