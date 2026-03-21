import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Public API endpoints (no keys required)
const SOURCES: Record<string, { baseUrl: string; name: string }> = {
  tcga: { baseUrl: "https://api.gdc.cancer.gov", name: "TCGA / GDC" },
  cbioportal: { baseUrl: "https://www.cbioportal.org/api", name: "cBioPortal" },
  uniprot: { baseUrl: "https://rest.uniprot.org", name: "UniProt" },
  ensembl: { baseUrl: "https://rest.ensembl.org", name: "Ensembl" },
};

async function fetchTCGA(query: string, category: string) {
  const endpoints: Record<string, { path: string; params: any }> = {
    projects: {
      path: "/projects",
      params: {
        filters: JSON.stringify({
          op: "in",
          content: { field: "project.program.name", value: ["TCGA"] },
        }),
        fields: "project_id,name,primary_site,disease_type,summary.case_count,summary.file_count",
        size: "50",
      },
    },
    mutations: {
      path: "/ssm_occurrences",
      params: {
        filters: JSON.stringify({
          op: "and",
          content: [
            { op: "in", content: { field: "case.project.program.name", value: ["TCGA"] } },
            ...(query ? [{ op: "in", content: { field: "case.project.project_id", value: [query] } }] : []),
          ],
        }),
        fields: "ssm.consequence.transcript.gene.symbol,ssm.consequence.transcript.annotation.vep_impact,ssm.genomic_dna_change,case.project.project_id",
        size: "100",
      },
    },
    genes: {
      path: "/genes",
      params: {
        filters: query
          ? JSON.stringify({ op: "in", content: { field: "gene_id", value: query.split(",").map((g: string) => g.trim()) } })
          : JSON.stringify({ op: "=", content: { field: "is_cancer_gene_census", value: true } }),
        fields: "gene_id,symbol,name,biotype,is_cancer_gene_census",
        size: "100",
      },
    },
    cases: {
      path: "/cases",
      params: {
        filters: query
          ? JSON.stringify({ op: "in", content: { field: "project.project_id", value: [query] } })
          : JSON.stringify({ op: "in", content: { field: "project.program.name", value: ["TCGA"] } }),
        fields: "case_id,submitter_id,project.project_id,demographic.gender,demographic.race,diagnoses.primary_diagnosis,diagnoses.tumor_stage",
        size: "100",
      },
    },
  };

  const ep = endpoints[category] || endpoints.projects;
  const params = new URLSearchParams(ep.params);
  const url = `${SOURCES.tcga.baseUrl}${ep.path}?${params}`;

  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error(`GDC API error: ${res.status}`);
  const data = await res.json();
  return { hits: data.data?.hits || [], pagination: data.data?.pagination, total: data.data?.pagination?.total || 0 };
}

async function fetchCBioPortal(query: string, category: string) {
  const base = SOURCES.cbioportal.baseUrl;

  try {
    // Default to studies list — most reliable endpoint
    if (category === "genes" && query) {
      const url = `${base}/genes/fetch`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ geneIds: query.split(",").map((g: string) => g.trim()) }),
      });
      if (!res.ok) {
        // Fallback: try keyword search via studies
        console.warn(`cBioPortal genes fetch failed (${res.status}), falling back to studies search`);
        return await fetchCBioPortalStudies(base, query);
      }
      const data = await res.json();
      return { hits: Array.isArray(data) ? data.slice(0, 100) : [data], total: Array.isArray(data) ? data.length : 1 };
    }

    if (category === "mutations" && query) {
      // Validate study exists first, then fetch mutations
      const profileId = query.includes("_mutations") ? query : `${query}_mutations`;
      const sampleListId = query.includes("_all") ? query : `${query}_all`;
      const url = `${base}/molecular-profiles/${encodeURIComponent(profileId)}/mutations?sampleListId=${encodeURIComponent(sampleListId)}&entrezGeneId=672`;
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!res.ok) {
        console.warn(`cBioPortal mutations fetch failed (${res.status}), falling back to studies search`);
        return await fetchCBioPortalStudies(base, query);
      }
      const data = await res.json();
      return { hits: Array.isArray(data) ? data.slice(0, 100) : [data], total: Array.isArray(data) ? data.length : 1 };
    }

    // Default: search studies
    return await fetchCBioPortalStudies(base, query);
  } catch (e) {
    console.warn("cBioPortal request failed, returning empty:", e);
    return { hits: [], total: 0 };
  }
}

async function fetchCBioPortalStudies(base: string, query: string) {
  const url = `${base}/studies`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) return { hits: [], total: 0 };
  const data = await res.json();
  const studies = Array.isArray(data) ? data : [];
  // Filter by query keyword if provided
  const filtered = query
    ? studies.filter((s: any) =>
        (s.name || "").toLowerCase().includes(query.toLowerCase()) ||
        (s.description || "").toLowerCase().includes(query.toLowerCase()) ||
        (s.studyId || "").toLowerCase().includes(query.toLowerCase())
      )
    : studies;
  return { hits: filtered.slice(0, 100), total: filtered.length };
}

async function fetchUniProt(query: string, category: string) {
  const searchQuery = query || "TP53 AND organism_id:9606";
  const url = `${SOURCES.uniprot.baseUrl}/uniprotkb/search?query=${encodeURIComponent(searchQuery)}&format=json&size=50&fields=accession,id,gene_names,organism_name,protein_name,length,cc_function`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`UniProt API error: ${res.status}`);
  const data = await res.json();
  return { hits: data.results || [], total: data.results?.length || 0 };
}

async function fetchEnsembl(query: string, category: string) {
  const gene = query || "BRCA1";
  const url = `${SOURCES.ensembl.baseUrl}/lookup/symbol/homo_sapiens/${gene}?expand=1`;

  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error(`Ensembl API error: ${res.status}`);
  const data = await res.json();
  return { hits: [data], total: 1 };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { source, query, category, save, is_training, name } = await req.json();

    if (!source || !SOURCES[source]) {
      return new Response(
        JSON.stringify({ error: `Invalid source. Available: ${Object.keys(SOURCES).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;
    switch (source) {
      case "tcga": result = await fetchTCGA(query || "", category || "projects"); break;
      case "cbioportal": result = await fetchCBioPortal(query || "", category || "studies"); break;
      case "uniprot": result = await fetchUniProt(query || "", category || "search"); break;
      case "ensembl": result = await fetchEnsembl(query || "", category || "lookup"); break;
      default: throw new Error("Unsupported source");
    }

    // Optionally save to database
    if (save) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const datasetName = name || `${SOURCES[source].name} — ${category || "query"} — ${new Date().toISOString().slice(0, 10)}`;

      await supabase.from("datasets").insert({
        name: datasetName,
        source,
        source_id: query || null,
        category: category || "genomic",
        description: `Fetched from ${SOURCES[source].name}: ${category || "general"} query="${query || "default"}"`,
        data: result.hits,
        record_count: result.total,
        metadata: { query, category, fetched_at: new Date().toISOString(), api: SOURCES[source].baseUrl },
        is_training: is_training || false,
      });
    }

    return new Response(
      JSON.stringify({ success: true, source: SOURCES[source].name, record_count: result.total, data: result.hits }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("fetch-public-data error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
