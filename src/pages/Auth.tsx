import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User as UserIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Username-based login mapped to email under a fixed local domain.
const USERNAME_DOMAIN = "tempest.local";
const toEmail = (username: string) =>
  `${username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "")}@${USERNAME_DOMAIN}`;

const AuthPage = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [username, setUsername] = useState("User");
  const [password, setPassword] = useState("Password123");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && session) navigate("/", { replace: true });
  }, [authLoading, session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setSubmitting(true);
    const email = toEmail(username);

    // Try sign-in first
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (!signInErr) {
      toast.success("Signed in");
      setSubmitting(false);
      return;
    }

    // If the account doesn't exist, create it then sign in.
    const msg = signInErr.message?.toLowerCase() ?? "";
    const isMissing = msg.includes("invalid login") || msg.includes("invalid credentials") || msg.includes("not confirmed");

    if (isMissing) {
      const { error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (signUpErr && !signUpErr.message.toLowerCase().includes("already")) {
        toast.error(signUpErr.message);
        setSubmitting(false);
        return;
      }
      const { error: retryErr } = await supabase.auth.signInWithPassword({ email, password });
      if (retryErr) {
        toast.error(retryErr.message);
        setSubmitting(false);
        return;
      }
      toast.success("Account created and signed in");
    } else {
      toast.error(signInErr.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm border border-border rounded-lg bg-card p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-primary" />
          <h1 className="text-base font-semibold text-foreground">TEMPEST · Sign in</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-6 font-mono">
          Research-use only. Authenticated access required.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-mono text-muted-foreground">Username</span>
            <div className="mt-1 flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-background focus-within:border-primary/60">
              <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="flex-1 bg-transparent text-sm outline-none text-foreground"
                placeholder="User"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-mono text-muted-foreground">Password</span>
            <div className="mt-1 flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-background focus-within:border-primary/60">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="flex-1 bg-transparent text-sm outline-none text-foreground"
                placeholder="Password"
                required
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Sign in
          </button>
        </form>

        <p className="text-[11px] text-muted-foreground mt-6 font-mono leading-relaxed">
          Default credentials: <span className="text-foreground">User</span> /{" "}
          <span className="text-foreground">Password123</span>. On first sign-in the account is created automatically.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
