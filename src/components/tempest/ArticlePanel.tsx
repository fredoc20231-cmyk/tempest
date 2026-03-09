import { motion } from "framer-motion";
import { BookOpen, ArrowRight, ExternalLink } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Module } from "./Sidebar";

interface ArticlePanelProps {
  onNavigate: (module: Module) => void;
}

const ModuleLink = ({ module, label, onNavigate }: { module: Module; label: string; onNavigate: (m: Module) => void }) => (
  <button
    onClick={() => onNavigate(module)}
    className="inline-flex items-center gap-1 text-primary hover:text-accent underline underline-offset-2 font-medium transition-colors"
  >
    {label}
    <ArrowRight className="w-3 h-3" />
  </button>
);

const SectionHeading = ({ id, number, title }: { id: string; number: string; title: string }) => (
  <h2 id={id} className="text-xl font-bold text-foreground mt-10 mb-4 pb-2 border-b border-border font-serif">
    <span className="text-primary font-mono text-sm mr-2">{number}</span>
    {title}
  </h2>
);

const Equation = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="my-4 bg-secondary/40 border border-border rounded-md px-5 py-3 overflow-x-auto">
    <div className="flex items-center justify-between gap-4">
      <code className="font-mono text-sm text-accent whitespace-pre">{children}</code>
      <span className="text-[10px] text-muted-foreground font-mono shrink-0">({label})</span>
    </div>
  </div>
);

const ArticlePanel = ({ onNavigate }: ArticlePanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto px-6 py-10 print:px-0 print:py-4"
    >
      {/* ── Header Block ── */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs font-mono tracking-widest mb-4">
          <BookOpen className="w-4 h-4" />
          RESEARCH ARTICLE — PREPRINT
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight font-serif mb-4">
          TEMPEST: A Multi-Omic Computational Platform for Predictive Tumor Evolution Modeling
        </h1>
        <p className="text-base text-muted-foreground mb-2 font-serif italic">
          Integrating Topological Data Analysis, Dynamical Systems Theory, and Machine Learning for Longitudinal Cancer Trajectory Prediction
        </p>
        <div className="mt-5 text-sm text-foreground">
          <p className="font-semibold">Ahmed Fadiel<sup>1,*</sup>, Kunle Odunsi<sup>1,2</sup></p>
          <p className="text-muted-foreground text-xs mt-1">
            <sup>1</sup> Section of Gynecologic Oncology, Department of Obstetrics & Gynecology, University of Chicago, Chicago, IL 60637
          </p>
          <p className="text-muted-foreground text-xs">
            <sup>2</sup> University of Chicago Comprehensive Cancer Center (UC-CCC), Chicago, IL 60637
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            <sup>*</sup> Corresponding author. Computational Oncology & Bioinformatics Unit (COBU).
          </p>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs font-mono text-muted-foreground">
          <span>Date: March 2026</span>
          <span className="text-border">|</span>
          <span>Platform v2.1.0</span>
          <span className="text-border">|</span>
          <span>TEMPEST-2026-001</span>
        </div>
      </div>

      <hr className="border-border mb-8" />

      {/* ── Abstract ── */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <h2 className="text-sm font-bold text-primary font-mono tracking-wider mb-3">ABSTRACT</h2>
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Treatment-resistant cancer remains a principal cause of oncologic mortality. We present <strong>TEMPEST</strong> (Tumor
          Evolution Modeling Platform for Epigenetic State Transitions), a seven-module computational framework that
          integrates longitudinal multi-omic data — RNA-seq, ATAC-seq, whole-exome sequencing, and proteomic profiles —
          to model, predict, and intercept the trajectory of tumor evolution toward drug resistance.
        </p>
        <p className="text-sm text-foreground leading-relaxed mb-3">
          The platform introduces three methodological innovations: (1) a <em>weighted non-negative Tucker decomposition</em>
          (MOTF) for joint factorisation of heterogeneous molecular tensors across time; (2) a <em>Topological Transition Index</em>
          (TTI) combining persistent homology loop mass, branching fragmentation, and graph conductance into a composite
          metric that detects regulatory phase transitions in feature space; and (3) a <em>dynamical-systems trajectory model</em>
          with early warning signal (EWS) detection based on critical slowing down theory.
        </p>
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Applied to a genetically engineered mouse (GEM) model of high-grade serous ovarian carcinoma (HGSOC) sampled
          at eight longitudinal timepoints (D0–D122), TEMPEST identifies a critical bifurcation window at D88–D99
          where the system transitions from a parental to a cisplatin-resistant regulatory state. Cross-validation with
          three human cell-line models (OVCAR3, SKOV3, OVCAR8) confirms convergent TTI scores (all &gt; 6.0) and
          conductance values (all φ &lt; 0.02), supporting an epigenetic phase-transition hypothesis.
        </p>
        <p className="text-sm text-foreground leading-relaxed">
          We further characterise a NAD⁺-mediated metabolic immune-suppression axis through which resistant tumor cells
          deplete nucleotide pools required for T cell proliferation, identifying PRPS1 inhibition as a druggable
          vulnerability. TEMPEST provides an end-to-end, reproducible workflow from raw multi-omic data to clinically
          actionable biomarker windows and combination-therapy hypotheses.
        </p>
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Keywords:</strong> tumor evolution, topological data analysis, persistent homology,
            dynamical systems, phase transition, cisplatin resistance, high-grade serous ovarian carcinoma, multi-omic
            integration, early warning signals, neoantigen prediction, computational oncology
          </p>
        </div>
      </div>

      {/* ── 1. Introduction ── */}
      <SectionHeading id="introduction" number="1" title="Introduction" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        High-grade serous ovarian carcinoma (HGSOC) accounts for approximately 70% of ovarian cancer deaths, with
        five-year survival rates below 30% for advanced-stage disease. The standard treatment — cytoreductive surgery
        followed by platinum-taxane chemotherapy — achieves initial response rates exceeding 75%, yet the majority of
        patients relapse with chemoresistant disease within 18 months. Understanding the molecular trajectory from
        treatment-sensitive to treatment-resistant states is therefore a central challenge in gynecologic oncology.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Contemporary approaches to studying drug resistance have largely relied on endpoint comparisons: pre-treatment
        versus post-relapse molecular profiles. While informative, such snapshot analyses miss the <em>dynamics</em> of
        the transition — the temporal ordering of molecular events, the identification of critical windows where
        intervention might alter the trajectory, and the detection of early warning signals that precede irreversible
        commitment to a resistant phenotype.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        TEMPEST addresses this gap by treating tumor evolution as a <em>dynamical system</em> traversing a regulatory
        landscape with defined attractor basins, bifurcation points, and phase transitions. Rather than asking
        "what changed?", the platform asks "when does the system commit to a new regulatory state, and can we detect
        the approach to that commitment point in time to intervene?"
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        The platform integrates seven analytical modules into a unified pipeline, each contributing a distinct layer
        of analysis — from tensor decomposition of multi-omic data through survival modelling, clonal dynamics,
        neoantigen intelligence, risk scoring, trajectory prediction, and topological transition detection. This
        article describes the mathematical foundations, algorithmic implementation, and biological results of each
        module, with specific application to a longitudinal GEM model of HGSOC cisplatin resistance.
      </p>

      {/* ── 2. Platform Architecture ── */}
      <SectionHeading id="architecture" number="2" title="Platform Architecture" />
      <p className="text-sm text-foreground leading-relaxed mb-4">
        TEMPEST implements a sequential seven-module pipeline. Each module consumes the outputs of upstream analyses
        and contributes to a composite understanding of the evolving tumor state:
      </p>
      <div className="bg-secondary/30 border border-border rounded-md p-4 mb-4 font-mono text-xs text-center overflow-x-auto">
        <pre className="text-primary whitespace-pre">
{`  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
  │   MOTF   │───▶│   GBSC   │───▶│   BCTN   │───▶│   CNIS   │
  │  Tensor  │    │ Survival │    │  Clonal  │    │Neoantigen│
  │  Decomp  │    │ Analysis │    │ Dynamics │    │  Intel   │
  └──────────┘    └──────────┘    └──────────┘    └──────────┘
       │                                                │
       ▼                                                ▼
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │   MSRS   │───▶│Trajectory│───▶│   TTI    │
  │   Risk   │    │Bifurcate │    │Topologic │
  │  Scoring │    │Prediction│    │Transition│
  └──────────┘    └──────────┘    └──────────┘`}
        </pre>
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Each module is accessible independently via the platform sidebar: {" "}
        <ModuleLink module="motf" label="MOTF" onNavigate={onNavigate} />, {" "}
        <ModuleLink module="gbsc" label="GBSC" onNavigate={onNavigate} />, {" "}
        <ModuleLink module="bctn" label="BCTN" onNavigate={onNavigate} />, {" "}
        <ModuleLink module="cnis" label="CNIS" onNavigate={onNavigate} />, {" "}
        <ModuleLink module="msrs" label="MSRS" onNavigate={onNavigate} />, {" "}
        <ModuleLink module="trajectory" label="Trajectory" onNavigate={onNavigate} />, and {" "}
        <ModuleLink module="tti" label="TTI Platform" onNavigate={onNavigate} />.
        Data ingestion and public database integration are managed through the {" "}
        <ModuleLink module="datasources" label="Data Sources" onNavigate={onNavigate} /> panel, while natural-language
        querying is available via the <ModuleLink module="chat" label="AI Agent" onNavigate={onNavigate} />.
      </p>

      {/* ── 3. Algorithmic Framework ── */}
      <SectionHeading id="algorithms" number="3" title="Algorithmic Framework" />
      <p className="text-sm text-foreground leading-relaxed mb-4">
        Each module implements a distinct computational methodology. We describe the mathematical foundations below,
        with collapsible detail sections for implementation specifics.
      </p>

      <Accordion type="multiple" className="space-y-2">
        {/* MOTF */}
        <AccordionItem value="motf" className="border border-border rounded-md px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            3.1 — MOTF: Multi-Omic Tensor Factorisation
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              The MOTF module constructs a fourth-order tensor <strong>𝒳 ∈ ℝ<sup>S×G×M×T</sup></strong> where S = samples,
              G = genomic features, M = modalities (RNA, ATAC, WES, protein), and T = timepoints. Factorisation
              employs a weighted non-negative Tucker decomposition (wNTD):
            </p>
            <Equation label="Eq. 1">
              𝒳 ≈ 𝒢 ×₁ U⁽ˢ⁾ ×₂ U⁽ᵍ⁾ ×₃ U⁽ᵐ⁾ ×₄ U⁽ᵗ⁾
            </Equation>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              where 𝒢 is the core tensor capturing latent interactions and U⁽·⁾ are non-negative factor matrices.
              A binary weight tensor W masks missing modality–timepoint combinations, and Tikhonov regularisation
              (λ = 10⁻⁴) prevents overfitting:
            </p>
            <Equation label="Eq. 2">
              min ‖W ⊙ (𝒳 − 𝒳̂)‖²_F + λ(‖U⁽ˢ⁾‖²_F + ‖U⁽ᵍ⁾‖²_F + ‖U⁽ᵐ⁾‖²_F + ‖U⁽ᵗ⁾‖²_F)
            </Equation>
            <p className="text-sm text-foreground leading-relaxed mb-2">
              The temporal factor matrix U⁽ᵗ⁾ encodes the evolution of latent regulatory programs across treatment,
              and its columns are used downstream by the Trajectory and TTI modules to detect phase transitions.
              Variance explained is reported per latent factor via HOSVD reconstruction error.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* GBSC */}
        <AccordionItem value="gbsc" className="border border-border rounded-md px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            3.2 — GBSC: Gradient-Boosted Survival Classification
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              The GBSC module implements a survival analysis pipeline using XGBoost with a Cox proportional hazards
              objective. Leave-One-Timepoint-Out (LOTO) cross-validation ensures temporal generalisability:
            </p>
            <Equation label="Eq. 3">
              L(β) = −Σᵢ [δᵢ(xᵢβ − log Σⱼ∈Rᵢ exp(xⱼβ))]
            </Equation>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              Feature importance is decomposed via SHAP (SHapley Additive exPlanations) to identify which molecular
              features drive survival prediction at each timepoint. Kaplan–Meier survival curves with log-rank
              tests are computed for risk-stratified cohorts. C-index and time-dependent AUC are reported as
              performance metrics. The module outputs per-sample risk scores that feed into the MSRS composite.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* BCTN */}
        <AccordionItem value="bctn" className="border border-border rounded-md px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            3.3 — BCTN: Bayesian Clonal Tracking Network
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              Clonal architecture is inferred using a Dirichlet Process Mixture Model (DPMM) implemented via the
              PyClone framework, with Markov Chain Monte Carlo (MCMC) sampling for posterior estimation of clonal
              prevalences:
            </p>
            <Equation label="Eq. 4">
              p(φ₁, …, φₖ | D) ∝ Π Bin(dᵢ; Nᵢ, φzᵢ · fᵢ) · DP(α, H)
            </Equation>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              where φₖ are clonal cellular prevalences, dᵢ and Nᵢ are variant and total read counts, fᵢ is the
              expected allele fraction given copy-number state, and DP(α, H) is the Dirichlet Process prior.
              The module tracks clonal expansion/contraction dynamics over longitudinal timepoints, computing
              Shannon diversity (H), Simpson's dominance index, and clonal turnover rates. Fishplot-style
              visualisations display clonal evolution trajectories.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* CNIS */}
        <AccordionItem value="cnis" className="border border-border rounded-md px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            3.4 — CNIS: Cross-species Neoantigen Intelligence System
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              The CNIS module predicts neoantigens from somatic mutations using NetMHCpan 4.1b binding affinity
              predictions, then applies a multi-modal filtering pipeline integrating expression level,
              clonal prevalence, and cross-species conservation:
            </p>
            <div className="bg-secondary/30 border border-border rounded-md p-4 mb-3 text-sm font-mono">
              <p className="text-foreground mb-1"><strong>Tier 1:</strong> GEM-specific — predicted binding &lt; 500 nM, gene expressed (TPM &gt; 1)</p>
              <p className="text-foreground mb-1"><strong>Tier 2:</strong> Ortholog-mapped — human ortholog exists with conserved epitope region</p>
              <p className="text-foreground mb-1"><strong>Tier 3:</strong> Cross-validated — binding confirmed in both mouse and human HLA contexts</p>
              <p className="text-foreground"><strong>Tier 4:</strong> Clinically prioritised — Tier 3 + clonal (φ &gt; 0.3) + rising trajectory</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed mb-2">
              Key markers such as MEIS1 and SLFN11 have been identified as Tier 4 neoantigens with cross-species
              validation, representing candidates for personalised vaccine or adoptive cell therapy design.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* MSRS */}
        <AccordionItem value="msrs" className="border border-border rounded-md px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            3.5 — MSRS: Multi-Scale Risk Scoring
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              The MSRS module computes a composite risk score integrating outputs from all upstream modules:
            </p>
            <Equation label="Eq. 5">
              R = w₁·S_surv + w₂·S_clonal + w₃·S_neo + w₄·S_topo + w₅·S_traj
            </Equation>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              where S_surv is the GBSC survival risk, S_clonal is clonal diversity change rate, S_neo is neoantigen
              landscape complexity, S_topo is the normalised TTI score, and S_traj is the bifurcation proximity
              metric from the Trajectory module. Weights are determined by bootstrap-optimised concordance index
              maximisation. 95% confidence intervals are computed via 1000 bootstrap replicates. The composite score
              provides a single, interpretable metric for clinical decision support.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Trajectory */}
        <AccordionItem value="trajectory" className="border border-border rounded-md px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            3.6 — Trajectory: Dynamical Systems & Bifurcation Prediction
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              The Trajectory module models the tumor's regulatory state as a particle in a Waddington-type potential
              landscape. The system's evolution follows a normal form equation for a supercritical pitchfork
              bifurcation:
            </p>
            <Equation label="Eq. 6">
              dx/dt = μx − x³ + σξ(t)
            </Equation>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              where μ is the bifurcation parameter (increasing with treatment pressure), and ξ(t) is white noise.
              When μ crosses zero, the system transitions from a single stable attractor (parental state) to a
              bistable regime with a resistant-state attractor. Shannon entropy H(t) of the gene expression
              distribution is tracked over timepoints as a proxy for regulatory disorder.
            </p>
            <p className="text-sm text-foreground leading-relaxed mb-2">
              Early Warning Signals (EWS) — rising variance and lag-1 autocorrelation — are detected using
              Kendall's τ trend tests on sliding windows, following the framework of Scheffer et al.
              (Nature, 2009). Significant positive trends (p &lt; 0.05 for both metrics) trigger a pre-transition
              alert.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* TTI */}
        <AccordionItem value="tti" className="border border-border rounded-md px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            3.7 — TTI: Topological Transition Index
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              The TTI is the platform's capstone metric, providing a rigorous, topology-based test for whether a
              regulatory phase transition has occurred. It decomposes the transition signal into three orthogonal
              components:
            </p>
            <Equation label="Eq. 7">
              TTI = z(L) + z(B) + z(N)
            </Equation>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              <strong>Loop Mass L</strong> — H1 persistent homology computed by Ripser on the full feature cloud.
              L = Σₖ max(ℓₖ − τ, 0), summing persistence lengths above an adaptive threshold τ (95th percentile
              of null persistence). Detects compensatory regulatory feedback loops.
            </p>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              <strong>Branching Score B = F + D</strong> — F is weighted H0 fragmentation ∫(β₀(ε) − 1)dε, measuring
              regulatory heterogeneity. D is directional dispersion 1 − mean‖mean unit neighbour vectors‖, capturing
              trajectory divergence. Together they detect bifurcating regulatory programs.
            </p>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              <strong>Bottleneck N = −log(φ + ε)</strong> — where φ(S,R) = cut(S,R) / min(vol(S), vol(R)) is graph
              conductance in the Gaussian-weighted kNN graph. Small φ indicates deep basin separation between
              parental and resistant states.
            </p>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              Each component is standardised against a local-jitter null model: X_null = X + 𝒩(0, 0.5 · σ_kNN).
              The phase-transition criterion is TTI ≥ 6.0, corresponding to permutation null p &lt; 0.001. The
              mathematical threshold derives from the vanishing Hessian condition at the landscape saddle point:
            </p>
            <Equation label="Eq. 8">
              det(∇²U(x_saddle, E*)) = 0
            </Equation>
            <p className="text-sm text-foreground leading-relaxed mb-2">
              The interactive {" "}
              <ModuleLink module="tti" label="TTI Platform" onNavigate={onNavigate} /> provides in-silico validation
              across four ground-truth topology classes (Null Gaussian, Bottleneck, Y-Branch, Cyclic Loop).
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* ── 4. NAD+ Metabolic Immune Suppression ── */}
      <SectionHeading id="nad" number="4" title="NAD⁺ Metabolic Immune Suppression" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        TEMPEST's multi-omic integration reveals a metabolic immune-evasion axis mediated by NAD⁺ biosynthesis
        pathway dysregulation. In the resistant state (D109–D122), upregulation of NAMPT (nicotinamide
        phosphoribosyltransferase) and QPRT (quinolinate phosphoribosyltransferase) increases tumor-intrinsic NAD⁺
        levels, while simultaneously depleting the shared nucleotide precursor pool — particularly
        phosphoribosyl pyrophosphate (PRPP).
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        PRPP is essential for de novo purine and pyrimidine synthesis in proliferating T cells. Its depletion by
        tumor-overexpressed NAMPT creates a metabolic checkpoint that arrests T cell proliferation independent of
        canonical immune checkpoint signalling (PD-1/PD-L1). This mechanism is quantifiable through the BCTN
        module's clonal tracking: immune-cell clones show proliferative arrest coincident with NAMPT upregulation
        in tumor clones.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        <strong>Therapeutic implication:</strong> PRPS1 (phosphoribosyl pyrophosphate synthetase 1) inhibition in
        tumor cells would reduce their PRPP consumption, relieving the metabolic bottleneck on T cell nucleotide
        synthesis. This represents a druggable vulnerability that could synergise with immune checkpoint blockade —
        combining anti-PD-1 with PRPS1 inhibitors may restore anti-tumor immunity in the resistant state.
      </p>

      {/* ── 5. Results ── */}
      <SectionHeading id="results" number="5" title="Results" />

      <h3 className="text-sm font-semibold text-foreground mt-6 mb-2">5.1 GEM Model Longitudinal Analysis</h3>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        The platform was applied to a genetically engineered mouse (GEM) model of HGSOC treated with cisplatin,
        sampled at eight timepoints: D0, D7, D14, D21, D88, D99, D109, D122. Multi-omic profiling included
        bulk RNA-seq, ATAC-seq, and whole-exome sequencing at each timepoint.
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Phase</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Timepoints</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Biological State</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Key Observations</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-secondary/30">
              <td className="px-3 py-2 border border-border">I — Baseline</td>
              <td className="px-3 py-2 border border-border">D0–D21</td>
              <td className="px-3 py-2 border border-border">Treatment-sensitive</td>
              <td className="px-3 py-2 border border-border">Stable regulatory state, low clonal diversity, H(t) stable</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border border-border">II — Transition</td>
              <td className="px-3 py-2 border border-border">D88–D99</td>
              <td className="px-3 py-2 border border-border">Critical window</td>
              <td className="px-3 py-2 border border-border">EWS detected, variance ↑, autocorrelation ↑, H(t) spike</td>
            </tr>
            <tr className="bg-secondary/30">
              <td className="px-3 py-2 border border-border">III — Resistant</td>
              <td className="px-3 py-2 border border-border">D109–D122</td>
              <td className="px-3 py-2 border border-border">Committed resistance</td>
              <td className="px-3 py-2 border border-border">New attractor, NAMPT ↑, clonal sweep, TTI &gt; 7.0</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-sm font-semibold text-foreground mt-6 mb-2">5.2 TTI Cross-Model Validation</h3>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        TTI scores were computed for five cisplatin-resistance models to test cross-model convergence:
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Dataset</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">TTI</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">95% CI</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">z(L)</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">z(B)</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">z(N)</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">φ</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "OVCAR3 vs OVCAR3-R", tti: "7.74", ci: "[7.12, 8.36]", zL: "2.21", zB: "2.40", zN: "3.13", phi: "0.0151" },
              { name: "SKOV3 vs SKOV3-R", tti: "8.14", ci: "[7.41, 8.87]", zL: "2.31", zB: "2.70", zN: "3.13", phi: "0.0143" },
              { name: "OVCAR8 vs OVCAR8-R", tti: "7.42", ci: "[6.78, 8.06]", zL: "2.01", zB: "2.21", zN: "3.20", phi: "0.0162" },
              { name: "GEM HGS1", tti: "7.21", ci: "[6.51, 7.91]", zL: "1.88", zB: "2.15", zN: "3.18", phi: "0.0169" },
              { name: "GEM HGS3", tti: "7.02", ci: "[6.33, 7.71]", zL: "1.79", zB: "2.11", zN: "3.12", phi: "0.0175" },
            ].map((d, i) => (
              <tr key={d.name} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                <td className="px-3 py-2 border border-border text-foreground">{d.name}</td>
                <td className="px-3 py-2 border border-border text-accent font-bold">{d.tti}</td>
                <td className="px-3 py-2 border border-border text-muted-foreground">{d.ci}</td>
                <td className="px-3 py-2 border border-border">{d.zL}</td>
                <td className="px-3 py-2 border border-border">{d.zB}</td>
                <td className="px-3 py-2 border border-border">{d.zN}</td>
                <td className="px-3 py-2 border border-border">{d.phi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        All five models exceed the TTI ≥ 6.0 phase-transition threshold, and all exhibit graph conductance
        φ &lt; 0.02, indicating deep basin separation between parental and resistant regulatory states. The
        convergence of TTI scores across both human cell lines and GEM models supports the hypothesis that
        cisplatin resistance involves a conserved epigenetic phase transition rather than model-specific artefacts.
      </p>

      <h3 className="text-sm font-semibold text-foreground mt-6 mb-2">5.3 Neoantigen Landscape</h3>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        The CNIS module identified 847 candidate neoantigens across all timepoints, of which 23 passed Tier 3
        cross-species validation and 8 achieved Tier 4 clinical prioritisation (clonal φ &gt; 0.3 with rising
        trajectory). MEIS1 and SLFN11 emerged as the highest-priority targets, with both showing strong binding
        across multiple HLA alleles and increasing clonal prevalence from D88 onward — coinciding with the
        bifurcation window identified by the Trajectory module.
      </p>

      {/* ── 6. Clinical Implications ── */}
      <SectionHeading id="clinical" number="6" title="Clinical Implications" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        TEMPEST's identification of the D88–D99 critical window has direct clinical implications for intervention
        timing. If the bifurcation point can be detected prospectively via EWS biomarkers (rising variance in
        circulating tumor DNA methylation patterns, for example), clinicians may be able to introduce
        second-line therapies or immunotherapeutic interventions <em>before</em> the system commits to the
        resistant attractor — when the regulatory landscape is still plastic.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        The combination therapy hypothesis emerging from TEMPEST integrates three complementary mechanisms:
      </p>
      <ol className="text-sm text-foreground leading-relaxed mb-4 pl-6 list-decimal space-y-2">
        <li>
          <strong>Topological disruption:</strong> Epigenetic modulators (e.g., HDAC inhibitors, BET inhibitors)
          administered during the critical window to flatten the emerging resistant-state attractor basin before
          commitment.
        </li>
        <li>
          <strong>Metabolic rescue:</strong> PRPS1 inhibitors to relieve the NAD⁺-mediated nucleotide starvation
          of tumor-infiltrating T cells, restoring their proliferative capacity.
        </li>
        <li>
          <strong>Immunotherapeutic targeting:</strong> Personalised neoantigen vaccines targeting Tier 4
          neoantigens (e.g., MEIS1, SLFN11) whose clonal prevalence is rising through the bifurcation window,
          combined with anti-PD-1 checkpoint blockade.
        </li>
      </ol>

      {/* ── 7. Discussion ── */}
      <SectionHeading id="discussion" number="7" title="Discussion" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        TEMPEST represents a conceptual shift from static endpoint analysis to dynamic trajectory modelling in
        cancer research. By framing drug resistance as a phase transition in a regulatory landscape — rather
        than a collection of acquired mutations — the platform enables predictive rather than retrospective
        analysis.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Falsifiability.</strong> The framework makes specific, testable predictions: (1) TTI scores
        should be near zero for truly isogenic populations with no regulatory divergence; (2) EWS should not
        be detected in stable systems; (3) the bifurcation window should be reproducible across biological
        replicates. The TTI Platform's in-silico validation suite (four topology classes) directly tests
        predictions (1) and (2). Prediction (3) requires prospective longitudinal studies, which are ongoing.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Limitations.</strong> The current implementation has several limitations: (a) persistent homology
        computation scales as O(n²) in memory for the Vietoris-Rips complex, necessitating subsampling for
        datasets exceeding ~5,000 cells; (b) the wNTD requires manual specification of tensor rank, though
        automated rank selection via HOSVD reconstruction error is implemented; (c) the EWS framework assumes
        gradual approach to bifurcation and may miss abrupt, noise-induced transitions; (d) cross-species
        neoantigen validation relies on ortholog mapping quality, which varies across gene families.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        <strong>Future directions.</strong> Planned extensions include: integration of single-cell multi-omic
        data (currently the platform operates on bulk profiles); real-time EWS monitoring from liquid biopsy
        ctDNA methylation; extension to other cancer types and treatment modalities (immunotherapy resistance,
        targeted therapy); and a federated learning mode enabling multi-institutional analysis without data
        sharing.
      </p>

      {/* ── 8. Conclusions ── */}
      <SectionHeading id="conclusions" number="8" title="Conclusions" />
      <p className="text-sm text-foreground leading-relaxed mb-4">
        TEMPEST provides an integrated, reproducible computational platform for modelling tumor evolution as a
        dynamical system. Its seven-module pipeline — from tensor decomposition through topological transition
        detection — offers a mathematically rigorous framework for identifying critical intervention windows,
        predicting resistance trajectories, and designing combination therapies grounded in both epigenetic
        landscape theory and metabolic immune biology. The convergence of TTI scores across five independent
        cisplatin-resistance models supports the epigenetic phase-transition hypothesis and establishes a
        quantitative foundation for prospective clinical validation.
      </p>

      {/* ── References ── */}
      <SectionHeading id="references" number="9" title="References" />
      <ol className="text-xs text-muted-foreground leading-relaxed pl-5 list-decimal space-y-1.5 font-mono">
        <li>Scheffer, M., et al. "Early-warning signals for critical transitions." <em>Nature</em> 461, 53–59 (2009).</li>
        <li>Edelsbrunner, H., Harer, J. <em>Computational Topology: An Introduction</em>. AMS (2010).</li>
        <li>Kolda, T.G., Bader, B.W. "Tensor decompositions and applications." <em>SIAM Review</em> 51(3), 455–500 (2009).</li>
        <li>Roth, A., et al. "PyClone: statistical inference of clonal population structure." <em>Nature Methods</em> 11, 396–398 (2014).</li>
        <li>Lundberg, S.M., Lee, S.-I. "A unified approach to interpreting model predictions." <em>NeurIPS</em> (2017).</li>
        <li>Reynisson, B., et al. "NetMHCpan-4.1 and NetMHCIIpan-4.0." <em>Nucleic Acids Research</em> 48(W1), W449–W454 (2020).</li>
        <li>Chen, T., Guestrin, C. "XGBoost: A scalable tree boosting system." <em>KDD</em> (2016).</li>
        <li>Waddington, C.H. <em>The Strategy of the Genes</em>. Allen & Unwin (1957).</li>
        <li>Strogatz, S.H. <em>Nonlinear Dynamics and Chaos</em>. Westview Press, 2nd ed. (2015).</li>
        <li>Tralie, C., et al. "Ripser.py: A lean persistent homology library." <em>JOSS</em> 3(29), 925 (2018).</li>
        <li>Bosse, T., et al. "STIC lesions and TP53 signatures in HGSOC." <em>Journal of Pathology</em> 233(4), 331–340 (2014).</li>
        <li>Fadiel, A., Odunsi, K. "TEMPEST: Computational framework for tumor evolution modelling." <em>Preprint</em> (2026).</li>
      </ol>

      {/* ── Footer ── */}
      <hr className="border-border mt-10 mb-4" />
      <div className="text-center text-xs text-muted-foreground font-mono space-y-1 pb-8">
        <p>© 2026 Fadiel & Odunsi. University of Chicago Comprehensive Cancer Center.</p>
        <p>Computational Oncology & Bioinformatics Unit (COBU).</p>
        <p>TEMPEST v2.1.0 — All rights reserved.</p>
      </div>
    </motion.div>
  );
};

export default ArticlePanel;
