import { useState, useRef } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTempest } from "@/contexts/TempestContext";
import { toast } from "sonner";

const CohortUploader = () => {
  const { saveCohort, refreshCohorts } = useTempest();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "tsv") {
      toast.error("Please upload a CSV or TSV file.");
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      const sep = ext === "tsv" ? "\t" : ",";
      const lines = text.trim().split("\n");
      const headers = lines[0].split(sep).map((h) => h.trim());
      const sampleCount = lines.length - 1;
      const name = file.name.replace(/\.(csv|tsv)$/i, "");

      // Upload file to storage
      const path = `${Date.now()}_${file.name}`;
      await supabase.storage.from("cohort-uploads").upload(path, file);

      // Save cohort metadata
      await saveCohort({
        name,
        samples: sampleCount,
        timepoints: headers.filter((h) => /^[dD]\d+/.test(h)),
        modalities: headers.filter((h) => !/^[dD]\d+/.test(h) && h.toLowerCase() !== "sample"),
        tensor_shape: `T ∈ ℝ^(${sampleCount} × ${headers.length})`,
        latent_factors: null,
        variance_explained: null,
      });

      await refreshCohorts();
      toast.success(`Cohort "${name}" uploaded (${sampleCount} samples, ${headers.length} columns)`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload cohort.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <button
      onClick={() => fileRef.current?.click()}
      disabled={uploading}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors font-mono disabled:opacity-50"
    >
      {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
      {uploading ? "Uploading..." : "Upload Cohort"}
      <input ref={fileRef} type="file" accept=".csv,.tsv" className="hidden" onChange={handleFile} />
    </button>
  );
};

export default CohortUploader;
