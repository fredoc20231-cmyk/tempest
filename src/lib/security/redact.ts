// Client-side twin of supabase/functions/_shared/redact.ts.
// Use before pushing any string into chat messages, toasts, error state,
// localStorage, or network payloads.

const KEY_PATTERNS: RegExp[] = [
  /AIza[0-9A-Za-z\-_]{20,}/g,
  /AQ\.[A-Za-z0-9_\-]{20,}/g,
  /sk-[A-Za-z0-9_\-]{20,}/g,
  /sk-ant-[A-Za-z0-9_\-]{20,}/g,
  /xox[abpsr]-[A-Za-z0-9-]{10,}/g,
  /ghp_[A-Za-z0-9]{30,}/g,
  /gho_[A-Za-z0-9]{30,}/g,
  /github_pat_[A-Za-z0-9_]{60,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /(?:rk|sk)_(?:live|test)_[A-Za-z0-9]{20,}/g,
  /eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}/g,
  /\b(?:LOVABLE|GEMINI|OPENAI|ANTHROPIC)_API_KEY\b\s*[:=]\s*\S+/gi,
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

/**
 * Preflight guard for user-submitted chat text. Returns:
 *  - { ok: true, text } when clean
 *  - { ok: false, reason } when a secret shape is detected — caller MUST
 *    refuse to send, show `reason` to the user, and not log the raw text.
 */
export function preflightUserInput(text: string):
  | { ok: true; text: string }
  | { ok: false; reason: string } {
  if (containsSecret(text)) {
    return {
      ok: false,
      reason:
        "Your message looks like it contains an API key or credential. It was NOT sent. Please remove the secret and try again.",
    };
  }
  return { ok: true, text };
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
