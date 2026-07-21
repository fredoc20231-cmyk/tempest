import { useState } from "react";
import { Database, Download, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { containsSecret } from "@/lib/security/redact";

const SqlSchemaPanel = () => {
  const { toast } = useToast();
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [engine, setEngine] = useState("InnoDB");
  const [charset, setCharset] = useState("utf8mb4");
  const [sql, setSql] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (description.trim().length < 10) {
      toast({ title: "Description too short", description: "Please describe your app in at least 10 characters.", variant: "destructive" });
      return;
    }
    if (containsSecret(description) || containsSecret(appName)) {
      toast({ title: "Secret detected", description: "Remove API keys or tokens from your input.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setSql("");
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sql-schema`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ description, appName, engine, charset }),
      });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j.error || "Generation failed");
      setSql(j.sql);
      toast({ title: "Schema generated", description: "Review, copy, or download the MySQL DDL." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([sql], { type: "application/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(appName || "schema").toLowerCase().replace(/[^a-z0-9]+/g, "_")}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center">
          <Database className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">SQL Schema Generator</h1>
          <p className="text-sm text-muted-foreground">AI-powered MySQL schema as a replacement for Supabase / Lovable Cloud backends.</p>
        </div>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="text-xs font-mono uppercase text-muted-foreground">App Name</label>
            <Input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="my_app" />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-muted-foreground">Engine</label>
            <Input value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="InnoDB" />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-muted-foreground">Charset</label>
            <Input value={charset} onChange={(e) => setCharset(e.target.value)} placeholder="utf8mb4" />
          </div>
        </div>

        <div>
          <label className="text-xs font-mono uppercase text-muted-foreground">
            Describe your application data model
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            placeholder="e.g. A SaaS invoicing app. Users belong to organizations. Each organization has customers, invoices with line items, and payments. Track invoice status (draft, sent, paid, overdue). Support role-based access: owner, admin, member."
            className="font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
            Generate MySQL Schema
          </Button>
        </div>
      </Card>

      {sql && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Generated Schema</h2>
              <p className="text-xs text-muted-foreground">MySQL 8+ · Run against a fresh database.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="outline" size="sm" onClick={download}>
                <Download className="w-4 h-4 mr-1" />
                Download .sql
              </Button>
            </div>
          </div>
          <pre className="bg-muted/40 border rounded-md p-4 text-xs font-mono overflow-auto max-h-[600px] whitespace-pre">
            {sql}
          </pre>
          <p className="text-[11px] text-muted-foreground">
            Note: MySQL has no native Row-Level Security. Enforce access rules in your application layer using the <code>user_id</code>/<code>user_roles</code> columns included in the generated schema.
          </p>
        </Card>
      )}
    </div>
  );
};

export default SqlSchemaPanel;
