// Preflight secret guard. Used by every edge function to:
//  1) Reject inbound payloads that look like they contain API keys.
//  2) Redact any secret-shaped substring from strings before logging or returning.
// Never echoes matched values.

// Common key shapes across providers (Google, OpenAI, Anthropic, AWS, Stripe,
// Supabase JWTs, GitHub, Slack, generic long base64/hex tokens).
const KEY_PATTERNS: RegExp[] = [
  /AIza[0-9A-Za-z\-_]{20,}/g,                        // Google API keys
  /AQ\.[A-Za-z0-9_\-]{20,}/g,                        // Google AI Studio legacy
  /sk-[A-Za-z0-9_\-]{20,}/g,                         // OpenAI
  /sk-ant-[A-Za-z0-9_\-]{20,}/g,                     // Anthropic
  /xox[abpsr]-[A-Za-z0-9-]{10,}/g,                   // Slack
  /ghp_[A-Za-z0-9]{30,}/g,                           // GitHub PAT
  /gho_[A-Za-z0-9]{30,}/g,
  /github_pat_[A-Za-z0-9_]{60,}/g,
  /AKIA[0-9A-Z]{16}/g,                               // AWS access key id
  /(?:rk|sk)_(?:live|test)_[A-Za-z0-9]{20,}/g,       // Stripe
  /eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}/g, // JWT
  /\bLOVABLE_API_KEY\b\s*[:=]\s*\S+/g,
  /\bGEMINI_API_KEY\b\s*[:=]\s*\S+/g,
];

const REDACTED = "[REDACTED_SECRET]";

export function redact(input: unknown): string {
  const s = typeof input === "string" ? input : safeStringify(input);
  let out = s;
  for (const re of KEY_PATTERNS) out = out.replace(re, REDACTED);
  return out;
}

export function containsSecret(input: unknown): boolean {
  const s = typeof input === "string" ? input : safeStringify(input);
  return KEY_PATTERNS.some((re) => {
    re.lastIndex = 0;
    return re.test(s);
  });
}

// Reject any request whose JSON body carries a secret-shaped token.
// Returns a Response to send back, or null if the body is clean.
export function preflightRejectSecrets(
  body: unknown,
  corsHeaders: Record<string, string>,
): Response | null {
  if (containsSecret(body)) {
    return new Response(
      JSON.stringify({
        error:
          "Request blocked: content resembles an API key or credential. Remove the secret and retry.",
        code: "secret_in_payload",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  return null;
}

// Console.* wrapper that redacts every argument before emitting.
export const safeConsole = {
  log: (...args: unknown[]) => console.log(...args.map(redact)),
  warn: (...args: unknown[]) => console.warn(...args.map(redact)),
  error: (...args: unknown[]) => console.error(...args.map(redact)),
};

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
