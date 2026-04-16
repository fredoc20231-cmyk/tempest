// Centralized summary definitions for each module's footer

export const moduleSummaries: Record<string, {
  title: string;
  objective: string;
  accomplishments: string[];
  significance?: string;
  nextModule?: string;
  nextLabel?: string;
}> = {
  datasources: {
    title: "Data Sources",
    objective: "Ingest genomic, transcriptomic, and clinical datasets from public repositories (TCGA, cBioPortal, UniProt, Ensembl) and user uploads to build the analytical foundation for downstream modules.",
    accomplishments: [
      "Fetched and validated datasets from public genomic databases with automated schema detection",
      "Catalogued datasets with source provenance, record counts, and metadata for audit trails",
      "Flagged training-eligible datasets to educate the AI agent on cancer-specific molecular patterns",
      "Provided persistent storage and retrieval of all ingested data for reproducible analyses",
    ],
    significance: "High-quality, curated input data is the prerequisite for all downstream tensor decomposition, survival analysis, and neoantigen discovery. Training-flagged datasets continuously improve AI agent accuracy.",
    nextModule: "overview",
    nextLabel: "Proceed to Overview Dashboard to inspect pipeline status and data summaries",
  },
  overview: {
    title: "Overview Dashboard",
    objective: "Provide a centralized view of cohort status, pipeline health, and cross-module results to guide analytical prioritization and identify modules requiring attention.",
    accomplishments: [
      "Aggregated real-time pipeline status across all analysis modules (MOTF → MSRS)",
      "Rendered cross-module visualizations (Survival Curves, Clonal Dynamics, Risk Radar) from stored results",
      "Highlighted neuroblastoma ADRN↔MES lineage dynamics alongside HGSOC temporal data",
      "Displayed module-level completion, failure states, and retry/reset controls",
    ],
    significance: "The dashboard ensures no analytical step is overlooked and provides the investigator with a unified lens on multi-omic integration before drilling into individual modules.",
    nextModule: "motf",
    nextLabel: "Proceed to MOTF for multi-omic tensor decomposition",
  },
  motf: {
    title: "MOTF — Multi-Omic Tensor Factorization",
    objective: "Decompose the multi-modal data tensor T ∈ ℝ^(S×G×M) using weighted non-negative Tucker decomposition (wNTD) to extract latent factors that capture coordinated molecular programs across RNA-seq, WES, spatial, and neoantigen modalities.",
    accomplishments: [
      "Constructed and decomposed the three-way tensor with Tikhonov regularization (λ₁–λ₃ tuned via 5-fold CV)",
      "Identified 12 latent factors explaining 92.3% of cross-modal variance (elbow criterion at 90%)",
      "Demonstrated strong latent factor ↔ disease stage correlation (LF1, r = 0.94, p < 10⁻⁶)",
      "Annotated latent factors via PROGENy pathway correlation for biological interpretability",
    ],
    significance: "MOTF latent factors serve as the feature basis for GBSC stage classification, BCTN clonal tracking, and MSRS risk scoring — making this the foundational decomposition for the entire pipeline.",
    nextModule: "gbsc",
    nextLabel: "Proceed to GBSC for survival analysis using MOTF latent factors",
  },
  gbsc: {
    title: "GBSC — Gradient-Boosted Stage Classifier",
    objective: "Train an ensemble gradient-boosted decision tree (XGBoost) on MOTF latent factors + 47 curated features to classify disease stage with leave-one-timepoint-out (LOTO) cross-validation and SHAP explainability.",
    accomplishments: [
      "Achieved 94.7% accuracy and macro-F1 = 0.93 across 4 disease stages (8-fold LOTO CV)",
      "Generated Kaplan–Meier survival curves stratified by predicted stage with log-rank significance",
      "Produced per-sample SHAP attribution maps identifying top discriminative features",
      "Validated that MOTF latent factors are the dominant predictors, confirming tensor decomposition quality",
    ],
    significance: "Accurate stage classification is essential for temporal indexing of clonal dynamics (BCTN) and neoantigen emergence (CNIS), enabling stage-aware therapeutic targeting.",
    nextModule: "bctn",
    nextLabel: "Proceed to BCTN for Bayesian clonal trajectory analysis",
  },
  bctn: {
    title: "BCTN — Bayesian Clonal Trajectory Networks",
    objective: "Model subclonal architecture from somatic variant allele frequencies (VAFs) using Dirichlet Process Mixture models (PyClone) to track clonal consolidation from early branched diversity to late dominant lineages.",
    accomplishments: [
      "Resolved 5 early-stage clonal clusters at D52 converging to 1–2 dominant lineages by D122",
      "Mapped subclonal trajectories across the D0–D122 temporal framework with MCMC convergence (R̂ < 1.1)",
      "Identified truncal vs. branch-specific mutations for neoantigen prioritization",
      "Quantified clonal selection pressure across treatment phases (I–IV)",
    ],
    significance: "Understanding clonal evolution dynamics is critical for identifying truncal neoantigens (stable targets) vs. branch-specific neoantigens (emerging targets), directly informing CNIS prioritization.",
    nextModule: "cnis",
    nextLabel: "Proceed to CNIS for neoantigen discovery and prioritization",
  },
  cnis: {
    title: "CNIS — Comprehensive Neoantigen Intelligence System",
    objective: "Identify, validate, and prioritize neoantigens from WES mutations and gene fusions using NetMHCpan 4.1b binding prediction, COSMIC v98 cross-validation, and multi-modal filtering (WES∩RNA co-detection, expression ≥10 CPM, clonality tracking).",
    accomplishments: [
      "Catalogued 17 unique neoantigen candidates (11 mutation + 6 fusion) across D0–D122",
      "Classified 7 Tier-1 targets with TPS 65–95, including synthesis-ready peptides",
      "Validated 4/6 genes against COSMIC v98 (MEIS1, ARID1A, KAT6A, NSD3)",
      "Established a 10-peptide synthesis queue stratified by validation readiness (3 ready, 4 after RT-PCR, 3 after MS)",
    ],
    significance: "The neoantigen catalog provides the molecular targets for personalized immunotherapy. CNIS integration with BCTN clonality data ensures targets are both immunogenic and clonally stable.",
    nextModule: "msrs",
    nextLabel: "Proceed to MSRS for integrated multi-scale risk scoring",
  },
  msrs: {
    title: "MSRS — Multi-Scale Risk Stratification",
    objective: "Integrate outputs from all upstream modules (MOTF latent factors, GBSC stage probabilities, BCTN clonal trajectories, CNIS immunogenicity scores) into a unified risk profile with bootstrap confidence intervals.",
    accomplishments: [
      "Computed composite risk scores integrating 6 key metrics: TMB, MSI, CNV, Clonal, Immune, and Neoantigen",
      "Generated risk radar visualization with ±15% significance thresholds for clinical decision-making",
      "Quantified uncertainty via bootstrap resampling (n = 1,000) with Brier score calibration",
      "Identified patients exceeding significance thresholds for escalated monitoring or intervention",
    ],
    significance: "MSRS provides the clinical decision layer — translating molecular complexity into actionable risk categories that guide treatment selection and monitoring intensity.",
    nextModule: "trajectory",
    nextLabel: "Proceed to Trajectory Prediction for bifurcation analysis",
  },
  trajectory: {
    title: "Trajectory — Bifurcation Prediction",
    objective: "Model tumor evolution as a dynamical system on an epigenetic landscape using pitchfork bifurcation theory, identifying critical transition points where disease trajectories diverge.",
    accomplishments: [
      "Mapped the D0–D122 temporal framework onto a 4-phase dynamical model (Constrained → Transition → Bifurcation → Advanced)",
      "Identified Day 88–99 as the critical bifurcation window (μ crosses zero, entropy peak S = 0.70)",
      "Modeled NAD⁺-mediated T-cell suppression kinetics and PRPS1 inhibition in post-bifurcation states",
      "Defined actionable intervention windows: ECM remodeling (D52–88), neoantigen vaccination (pre-branch), PRPS1-GOF CAR-T (post-branch)",
    ],
    significance: "Bifurcation analysis reveals the irreversible transition points in tumor evolution, providing the theoretical basis for timing-dependent therapeutic strategies — the 'when to treat' that complements CNIS's 'what to target.'",
    nextModule: "tti",
    nextLabel: "Proceed to TTI Platform for topological quantification",
  },
  tti: {
    title: "TTI Platform — Topological Transition Index",
    objective: "Quantify tumor state transitions using the Feature-space Topological Transition Index (fTTI), combining persistent homology (H₀/H₁ via Union-Find), spectral graph conductance, and kNN graph construction on real or simulated data.",
    accomplishments: [
      "Computed fTTI scores on uploaded, public database, and reference datasets with full statistical rigor",
      "Validated methodology: pitchfork bifurcation ≥ 6.0, Jmax = 0.906, AUC-ROC = 0.983",
      "Generated PCA projections, persistence landscapes, and early warning signals (EWS) from real data",
      "Enabled cross-dataset comparison (HGSOC, Neuroblastoma ADRN↔MES, STIC GEM, Parent vs Resistant)",
    ],
    significance: "The fTTI provides a single, interpretable metric for state transition severity — enabling quantitative comparison across cancer types and treatment conditions, and serving as the mathematical foundation for early warning signal detection.",
    nextModule: "chat",
    nextLabel: "Use AI Agent for natural language exploration of results",
  },
};
