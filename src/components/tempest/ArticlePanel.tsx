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
              The CNIS module implements a database-validated neoantigen discovery pipeline integrating whole-exome
              sequencing (GATK4 Mutect2), RNA-seq differential expression (limma-voom with TMM normalisation), fusion
              detection (STAR-Fusion ∩ Arriba), and MHC binding prediction (NetMHCpan 4.1b for H-2-Db/Kb). The
              pipeline yielded <strong>4,499 neoantigen candidates</strong> (11 mutation-derived + 4,488 fusion-derived)
              across the longitudinal D0–D122 series.
            </p>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              Multi-modal filtering applies: WES∩RNA co-detection, &gt;10 CPM expression, absence from D0 controls,
              VEP high-impact annotation, and dbSNP/MGI exclusion. Candidates are ranked by a composite priority score:
            </p>
            <Equation label="Eq. CNIS">
              Score = 3·(−log₁₀(%Rank)) + 1.5·log₂(peak_expr + 0.5) + log₂(stages + 1) + 1.5·DE_up
            </Equation>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              Cross-species validation proceeds through four tiers:
            </p>
            <div className="bg-secondary/30 border border-border rounded-md p-4 mb-3 text-sm font-mono">
              <p className="text-foreground mb-1"><strong>Tier 1:</strong> GEM-specific + COSMIC validated — binding &lt; 500 nM, expressed, gene confirmed in human cancer databases (e.g., MEIS1: 19% immunogenicity, CD8⁺ recruitment)</p>
              <p className="text-foreground mb-1"><strong>Tier 2:</strong> Ortholog-mapped — human ortholog exists with functional relevance (e.g., SLFN8 → SLFN11 platinum sensitivity biomarker)</p>
              <p className="text-foreground mb-1"><strong>Tier 3:</strong> Cross-validated — binding confirmed in both mouse MHC and human HLA contexts, gene has COSMIC-3D structural data</p>
              <p className="text-foreground"><strong>Tier 4:</strong> Clinically prioritised — Tier 3 + clonal (φ &gt; 0.3) + rising trajectory + validated expression (FDR &lt; 0.05)</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              <strong>Key validated targets:</strong> MEIS1 F378X (Tier 1, trunk mutation D20→D122, 19% human immunogenicity,
              CD8⁺ T-cell infiltration via CCL18/CCL4/CXCL7); ARID1A fusion partner (COSMIC: 46-70% clear cell OC);
              KAT6A (overexpressed in OC, β-catenin regulation); NSD3 (25 COSMIC-3D structures, drug resistance).
              The strongest MHC-I binder is the Mfhas1::Tns3 fusion junction peptide HAFPGDDPI (%Rank 0.133, strong binder),
              representing a late-stage immunotherapy target for dominant post-bifurcation clones.
            </p>
            <p className="text-sm text-foreground leading-relaxed mb-2">
              RNA/WES integration confirms 993 predicted H-2-Db binders with expression validation: 823 upregulated
              and 763 downregulated genes (Pre+Early vs Peak, FDR &lt; 0.05). PyClone clonality analysis identified
              17 clonal clusters mapping neoantigen emergence to clonal dynamics across the longitudinal series.
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

      <h3 className="text-sm font-semibold text-foreground mt-6 mb-2">5.1 GEM Model Longitudinal Staging Framework</h3>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        The platform was applied to a genetically engineered mouse (GEM) model of HGSOC (C57BL/6, conditional
        Trp53/Rb1 deletion + LSL-KrasG12D in Pax8-expressing FT secretory epithelium), sampled at nine timepoints
        post-tamoxifen induction. D0 represents the <strong>control/baseline</strong> (normal fallopian tube epithelium,
        pre-oncogenic activation) and serves as the reference for all differential expression, mutation, and
        trajectory analyses. The following staging framework was derived from integrated multi-omic profiling:
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Day</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Phase</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Biological State</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Key Molecular Events</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Neoantigen Landscape</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Clinical Analog</th>
            </tr>
          </thead>
          <tbody>
            {[
              { day: "D0", phase: "0 — Baseline", state: "Normal FT epithelium", events: "Pre-tamoxifen. No oncogenic activation. Reference for all comparisons.", neo: "None — reference", clinical: "Healthy tissue" },
              { day: "D20", phase: "I — Initiation", state: "STIC precursor", events: "Steroidogenic reprogramming (Hsd3b1, Cyp11a1). 588↑/668↓ DEGs. First trunk mutations: Meis1 F378X, Zkscan7 K404N.", neo: "11 fusions (1 HC). Trunk mutations emerge.", clinical: "STIC/p53 signature" },
              { day: "D21", phase: "I — Initiation", state: "STIC precursor", events: "Tight PCA clustering with D20. Rbm26 S990FX first detected (persists to D109).", neo: "Low diversity.", clinical: "Early STIC" },
              { day: "D52", phase: "II — Expansion", state: "Active proliferation", events: "3,164 variants. M:S=2.18. 4-6 subclones. Chromatin remodeling. ECM (Col1a1, Pdpn).", neo: "57 fusions (16 HC). Ubtd2, Camk1d::Arid1a emerge.", clinical: "Stage I-II OC" },
              { day: "D88", phase: "III — Bifurcation", state: "Critical window OPENS", events: "3,772 variants (PEAK). M:S=2.65. EWS: variance ↑2.4×. S(t) rising.", neo: "104 fusions (52 HC) — PEAK. Nsd3::Kat6a.", clinical: "Chemo-naïve advanced" },
              { day: "D99", phase: "III — Bifurcation", state: "Critical window CLOSES", events: "S(t) PEAKS. Glycam1+Marco (M2 polarisation). 62↑/61↓ stage markers.", neo: "96→28 fusions. Fxr1::Zfp704, Stxbp3.", clinical: "Platinum-sensitive relapse" },
              { day: "D109", phase: "IV — Consolidation", state: "Post-bifurcation", events: "1-2 dominant clones. NAD+ → T cell PRPS1 inhibition → immune arrest.", neo: "27 fusions (10 HC). Mfhas1::Tns3 appears.", clinical: "Platinum-resistant" },
              { day: "D122", phase: "IV — Consolidation", state: "Terminal/resistant", events: "M:S=1.16 (sweep complete). Insulin/IGF + PI3K-AKT + MKI67. Trp53::Sat2.", neo: "32 fusions (6 HC). Persistent targets only.", clinical: "Refractory disease" },
            ].map((d, i) => (
              <tr key={d.day} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                <td className="px-3 py-2 border border-border text-accent font-bold">{d.day}</td>
                <td className="px-3 py-2 border border-border text-foreground font-semibold text-xs">{d.phase}</td>
                <td className="px-3 py-2 border border-border text-foreground">{d.state}</td>
                <td className="px-3 py-2 border border-border text-muted-foreground text-xs">{d.events}</td>
                <td className="px-3 py-2 border border-border text-muted-foreground text-xs">{d.neo}</td>
                <td className="px-3 py-2 border border-border text-xs italic">{d.clinical}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        This framework establishes that cancer progression in this model is not continuous but proceeds through
        discrete phase transitions. The D88–D99 bifurcation window represents a critical state where the regulatory
        landscape becomes bistable — interventions before this window (Phase I–II) target a plastic, reversible state,
        while post-bifurcation (Phase IV) requires fundamentally different therapeutic strategies due to immune
        evasion consolidation via the NAD⁺/PRPS1 axis.
      </p>

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

      <h3 className="text-sm font-semibold text-foreground mt-6 mb-2">5.3 Database-Validated Neoantigen Landscape</h3>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Comprehensive analysis identified <strong>4,499 neoantigen candidates</strong> (11 mutation-derived + 4,488
        fusion-derived) across the D0–D122 longitudinal series. COSMIC v98 cross-validation confirmed 4 of 6
        target genes as established cancer drivers. Eight candidates were validated for immediate experimental testing.
      </p>

      <h4 className="text-xs font-semibold text-foreground mt-4 mb-2 font-mono">Table 1 — Mutation-Derived Neoantigens: Master Catalog (All Frameshift Sequences Resolved, March 2026)</h4>
      <p className="text-sm text-muted-foreground mb-2">
        ★ = frameshift sequence resolved via codon-frame analysis. XX→ST (Ser-Thr) for most frameshift readthrough;
        GLP2R XX→NS (Asn-Ser). All ★ sequences require RT-PCR + Sanger confirmation before synthesis.
      </p>
      <div className="overflow-x-auto mb-3">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Gene</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Mutation</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Synthesis-Ready Peptide</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">H-2-Db %Rank</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Temporal</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Clonality</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">TPS</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Tier</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Action</th>
            </tr>
          </thead>
          <tbody>
            {[
              { gene: "Meis1", mut: "F378→X ★", peptide: "TFFFSTMVLF", db: "23.1%", temp: "D20, D122", clon: "Clonal >80%", tps: "65", tier: "TIER 1", action: "Ready after RT-PCR" },
              { gene: "Zkscan7", mut: "K404→N", peptide: "HTQENPYECC", db: "10.4%", temp: "D20, D122", clon: "Clonal >80%", tps: "70", tier: "TIER 1", action: "Ready to synthesise" },
              { gene: "Ubtd2", mut: "E107→D", peptide: "GALTDCYDEL", db: "0.743% WB", temp: "D52", clon: "Subclonal ~35%", tps: "65", tier: "TIER 1", action: "Ready to synthesise" },
              { gene: "Rbm26", mut: "S990→FX ★", peptide: "FFFFFSTVFP", db: "56.4%", temp: "D21/52/99/109", clon: "Clonal >80%", tps: "65", tier: "TIER 1", action: "Ready after RT-PCR" },
              { gene: "Slfn8", mut: "I791→N", peptide: "EDMVNYVADK", db: "60.6%", temp: "D52, D99×2", clon: "Subclonal ~45%", tps: "55", tier: "TIER 2", action: "Ready to synthesise" },
              { gene: "Tm2d2", mut: "I135→X ★", peptide: "QTDLSTFFFF", db: "8.3%", temp: "D52", clon: "Subclonal ~30%", tps: "55", tier: "TIER 2", action: "Ready after RT-PCR" },
              { gene: "Novel (Unann.)", mut: "N22→D", peptide: "YMKVDIAYAI", db: "3.451% ⚠↑", temp: "D52, D99", clon: "Subclonal ~40%", tps: "60", tier: "TIER 2", action: "Verify binding first" },
              { gene: "Stxbp3", mut: "del→X ★", peptide: "LFFFSTPYVH", db: "58.9%", temp: "D99", clon: "Subclonal ~25%", tps: "50", tier: "TIER 2", action: "Ready after RT-PCR" },
              { gene: "Kcnk7", mut: "P335→PX ★", peptide: "RVGGPSTREA", db: "35.4%", temp: "D20", clon: "Subclonal ~20%", tps: "40", tier: "TIER 3", action: "Deprioritise" },
              { gene: "Glp2r", mut: "G459→AX ★", peptide: "LQSSANSSSH", db: "43.9% ⚠↑", temp: "D52", clon: "Subclonal ~15%", tps: "35", tier: "TIER 3", action: "Deprioritise" },
              { gene: "Neb", mut: "F36→FX ★", peptide: "CFFFFSTHNF", db: "46.0%", temp: "D52", clon: "Subclonal ~20%", tps: "35", tier: "TIER 3", action: "Deprioritise" },
            ].map((d, i) => (
              <tr key={d.gene + d.mut} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                <td className="px-3 py-2 border border-border text-foreground font-semibold">{d.gene}</td>
                <td className="px-3 py-2 border border-border text-muted-foreground text-xs">{d.mut}</td>
                <td className="px-3 py-2 border border-border text-accent"><code>{d.peptide}</code></td>
                <td className="px-3 py-2 border border-border">{d.db}</td>
                <td className="px-3 py-2 border border-border text-muted-foreground">{d.temp}</td>
                <td className="px-3 py-2 border border-border text-xs">{d.clon}</td>
                <td className="px-3 py-2 border border-border font-bold">{d.tps}</td>
                <td className="px-3 py-2 border border-border"><span className={`text-xs px-1.5 py-0.5 rounded ${d.tier === "TIER 1" ? "bg-chart-emerald/10 text-chart-emerald" : d.tier === "TIER 2" ? "bg-chart-amber/10 text-chart-amber" : "bg-muted text-muted-foreground"}`}>{d.tier}</span></td>
                <td className="px-3 py-2 border border-border text-xs text-muted-foreground">{d.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="text-xs font-semibold text-foreground mt-4 mb-2 font-mono">Table 2 — Fusion-Derived Neoantigens (Junction Sequences from Arriba 2.5.1 Breakpoint Analysis)</h4>
      <p className="text-sm text-muted-foreground mb-2">
        All junction peptides computationally derived. Mandatory pre-synthesis: RT-PCR → Sanger → H-2-Db IP + LC-MS/MS.
        Adgrf1::Adgrf5 = CONSTITUTIONAL EXCLUDE (present in 423_D0 matched normal). Trp53::Sat2 = DRIVER EXCLUDE.
      </p>
      <div className="overflow-x-auto mb-3">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Fusion</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Type</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Junction Peptide</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">H-2-Db</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">H-2-Kb</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Stage</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Split Reads</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">TPS</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Tier</th>
            </tr>
          </thead>
          <tbody>
            {[
              { fusion: "Mfhas1::Tns3", type: "Intrachrom del", junc: "HAFPgDDPI", db: "0.133% SB", kb: "0.21%", stage: "D109–D122", reads: "~18", tps: "95", tier: "TIER 1" },
              { fusion: "Camk1d::Arid1a", type: "Translocation", junc: "AVLRnhpvqwi", db: "0.519% WB", kb: "0.87%", stage: "D52", reads: "~32", tps: "80", tier: "TIER 1" },
              { fusion: "Fxr1::Zfp704", type: "Translocation (IF)", junc: "AFYKNSMKV", db: "1.329% WB", kb: "1.385% WB", stage: "D99–D122", reads: "~28", tps: "65", tier: "TIER 1" },
              { fusion: "Nsd3::Kat6a", type: "Translocation", junc: "GKSLAQYLL", db: "2.870%", kb: "ND", stage: "D88–D99", reads: "~15", tps: "60", tier: "TIER 2" },
              { fusion: "Ly6c1::Ly6a", type: "Read-through", junc: "TCYSQAAGTF", db: "4.210%", kb: "ND", stage: "D52–D122", reads: ">59", tps: "45", tier: "TIER 2" },
              { fusion: "Meox2::Itsn1", type: "Translocation", junc: "dKSEVNSKPRK", db: "5.120%", kb: "ND", stage: "D99", reads: "~12", tps: "50", tier: "TIER 2" },
            ].map((d, i) => (
              <tr key={d.fusion} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                <td className="px-3 py-2 border border-border text-foreground font-semibold">{d.fusion}</td>
                <td className="px-3 py-2 border border-border text-xs text-muted-foreground">{d.type}</td>
                <td className="px-3 py-2 border border-border text-accent"><code>{d.junc}</code></td>
                <td className="px-3 py-2 border border-border">{d.db}</td>
                <td className="px-3 py-2 border border-border">{d.kb}</td>
                <td className="px-3 py-2 border border-border text-muted-foreground">{d.stage}</td>
                <td className="px-3 py-2 border border-border text-xs">{d.reads}</td>
                <td className="px-3 py-2 border border-border font-bold">{d.tps}</td>
                <td className="px-3 py-2 border border-border"><span className={`text-xs px-1.5 py-0.5 rounded ${d.tier === "TIER 1" ? "bg-chart-emerald/10 text-chart-emerald" : "bg-chart-amber/10 text-chart-amber"}`}>{d.tier}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="text-xs font-semibold text-foreground mt-4 mb-2 font-mono">Table 3 — Peptide Synthesis Order Tracker (Validation-Gated)</h4>
      <div className="overflow-x-auto mb-3">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">#</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Gene</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Peptide</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Source</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">%Rank</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Pre-Synthesis Gate</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { n: "1", gene: "Ubtd2", pep: "GALTDCYDEL", src: "Missense", rank: "0.743 WB", gate: "BAM VAF ≥0.05 only", status: "PENDING" },
              { n: "2", gene: "Zkscan7", pep: "HTQENPYECC", src: "Missense", rank: "10.4%", gate: "BAM VAF ≥0.05 only", status: "PENDING" },
              { n: "3", gene: "Slfn8", pep: "EDMVNYVADK", src: "Missense", rank: "60.6%", gate: "BAM VAF ≥0.05 (×3)", status: "PENDING" },
              { n: "4", gene: "Meis1 ★", pep: "TFFFSTMVLF", src: "Frameshift", rank: "23.1%", gate: "RT-PCR + Sanger frame", status: "NOT STARTED" },
              { n: "5", gene: "Rbm26 ★", pep: "FFFFFSTVFP", src: "Frameshift", rank: "56.4%", gate: "RT-PCR + Sanger ST frame", status: "NOT STARTED" },
              { n: "6", gene: "Mfhas1::Tns3", pep: "HAFPgDDPI", src: "Fusion", rank: "0.133 SB", gate: "RT-PCR → Sanger → H-2-Db MS", status: "NOT STARTED" },
              { n: "7", gene: "Camk1d::Arid1a", pep: "AVLRnhpvqwi", src: "Fusion", rank: "0.519 WB", gate: "RT-PCR → Sanger → MS (MHC-I/II)", status: "NOT STARTED" },
              { n: "8", gene: "Fxr1::Zfp704", pep: "AFYKNSMKV", src: "Fusion (IF)", rank: "1.329 WB", gate: "RT-PCR → Sanger → H-2-Kb MS", status: "NOT STARTED" },
            ].map((d, i) => (
              <tr key={d.gene} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                <td className="px-3 py-2 border border-border font-bold">{d.n}</td>
                <td className="px-3 py-2 border border-border text-foreground font-semibold">{d.gene}</td>
                <td className="px-3 py-2 border border-border text-accent"><code>{d.pep}</code></td>
                <td className="px-3 py-2 border border-border text-xs text-muted-foreground">{d.src}</td>
                <td className="px-3 py-2 border border-border">{d.rank}</td>
                <td className="px-3 py-2 border border-border text-xs text-muted-foreground">{d.gate}</td>
                <td className="px-3 py-2 border border-border"><span className={`text-xs px-1.5 py-0.5 rounded ${d.status === "PENDING" ? "bg-chart-amber/10 text-chart-amber" : "bg-destructive/10 text-destructive"}`}>{d.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground mb-3 italic">
        Gate colour key: GREEN = BAM confirmation only (fastest path). YELLOW = RT-PCR + Sanger required. RED = full RT-PCR + MS validation.
        All peptides: ≥95% HPLC purity, TFA-free, lyophilised, 1 mg minimum.
      </p>

      <p className="text-sm text-foreground leading-relaxed mb-3">
        Fusion neoantigen diversity peaks at D88 (104 events, 52 high-confidence) coinciding with the bifurcation
        window, then consolidates to 32 events (6 high-confidence) by D122 — consistent with BCTN clonal sweep
        dynamics. The master catalog identifies <strong>17 unique neoantigen candidates</strong> ranked by Therapeutic
        Priority Score (TPS): 7 Tier 1 (TPS 65–95), 7 Tier 2 (TPS 45–60), and 3 Tier 3 (TPS 35–40, deprioritised).
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Critical exclusions:</strong> Adgrf1::Adgrf5 (present in 423_D0 matched normal — constitutional/germline
        structural variant, not somatic) and Trp53::Sat2 (p53 disruption — driver event, not a vaccine target). The
        Novel (Unannotated) N22→D mutation (YMKVDIAYAI) is flagged as the mutant peptide binds <em>worse</em> than
        wildtype (3.451% vs 0.481% SB), requiring verification of differential presentation before proceeding.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        Mfhas1::Tns3 (HAFPgDDPI) achieves the strongest MHC-I binding in the entire dataset (%Rank 0.133, strong
        binder, TPS 95/100) and represents the top fusion candidate for late-stage immunotherapy. Rbm26 S990→FX
        (FFFFFSTVFP) is the most temporally recurrent mutation-derived neoantigen, detected across 4 of 7 samples
        (D21/D52/D99/D109), suggesting it as a clonal trunk target. The dual MHC-I/II binding capacity of
        Camk1d::Arid1a (H-2-Db WB + IE-d 2.4% MHC-II) makes it the sole candidate suitable for combined CD4+/CD8+
        vaccine design, leveraging the ARID1A driver status (46–70% clear cell OC per COSMIC).
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

      {/* ── 9. Grant Framework: Specific Aims ── */}
      <SectionHeading id="specific-aims" number="9" title="Grant Framework — Specific Aims" />
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <p className="text-sm text-foreground leading-relaxed mb-4">
          The following Specific Aims are structured for an NIH R01 or DOD CDMRP Ovarian Cancer Research Program
          application. Each aim maps directly to validated TEMPEST modules with quantitative success criteria derived
          from existing preliminary data.
        </p>

        <div className="space-y-6">
          <div className="border-l-2 border-primary pl-4">
            <h4 className="text-sm font-bold text-foreground mb-1">Aim 1: Develop and validate the TEMPEST multi-omic integration and survival prediction pipeline</h4>
            <p className="text-xs text-muted-foreground mb-2 font-mono">Modules: MOTF → GBSC → BCTN | Timeline: Months 1–18</p>
            <p className="text-sm text-foreground leading-relaxed mb-2">
              <strong>Aim 1a.</strong> Optimise the weighted non-negative Tucker decomposition (wNTD) for joint factorisation
              of RNA-seq, ATAC-seq, WES, and proteomic tensors across the D0–D122 longitudinal series. <strong>Success
              criterion:</strong> ≥90% variance explained with ≤8 latent factors (current: 92.3% with 8 factors).
            </p>
            <p className="text-sm text-foreground leading-relaxed mb-2">
              <strong>Aim 1b.</strong> Implement gradient-boosted survival classification (GBSC) with Leave-One-Timepoint-Out
              (LOTO) cross-validation to predict progression-free survival from MOTF-derived latent factors.
              <strong> Success criterion:</strong> C-index ≥ 0.78; time-dependent AUC ≥ 0.82 at 12-month prediction horizon.
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              <strong>Aim 1c.</strong> Deploy Bayesian Clonal Tracking (BCTN) via PyClone DPMM to map clonal architecture
              dynamics across all timepoints, quantifying Shannon diversity (H), Simpson's dominance, and clonal turnover
              rates. <strong>Success criterion:</strong> Identify the clonal sweep event (H drop ≥40%) and map it to the
              bifurcation window with ±1 timepoint precision.
            </p>
          </div>

          <div className="border-l-2 border-accent pl-4">
            <h4 className="text-sm font-bold text-foreground mb-1">Aim 2: Build and experimentally validate the Cross-species Neoantigen Intelligence System (CNIS)</h4>
            <p className="text-xs text-muted-foreground mb-2 font-mono">Module: CNIS | Timeline: Months 6–36</p>
            <p className="text-sm text-foreground leading-relaxed mb-2">
              <strong>Aim 2a.</strong> Complete the computational neoantigen discovery pipeline (GATK4 Mutect2 → limma-voom →
              STAR-Fusion ∩ Arriba → NetMHCpan 4.1b) and validate the Therapeutic Priority Score (TPS) ranking against
              experimental immunogenicity data. The current pipeline has identified 4,499 candidates (11 mutation-derived,
              4,488 fusion-derived) reduced to 17 unique targets via multi-gate filtering.
            </p>
            <p className="text-sm text-foreground leading-relaxed mb-2">
              <strong>Aim 2b.</strong> Experimentally validate the top 8 synthesis-ready peptides through a staged protocol:
              (i) BAM VAF confirmation (≥0.05) for missense candidates (Ubtd2 GALTDCYDEL, Zkscan7 HTQENPYECC, Slfn8 EDMVNYVADK);
              (ii) RT-PCR + Sanger sequencing for frameshift candidates (Meis1 TFFFSTMVLF, Rbm26 FFFFFSTVFP);
              (iii) RT-PCR → Sanger → H-2-Db immunoprecipitation + LC-MS/MS for fusion junction peptides
              (Mfhas1::Tns3 HAFPgDDPI, Camk1d::Arid1a AVLRnhpvqwi, Fxr1::Zfp704 AFYKNSMKV).
              <strong> Success criterion:</strong> ≥5 of 8 candidates confirmed as surface-presented MHC-I ligands.
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              <strong>Aim 2c.</strong> Conduct ELISpot immunogenicity assays (IFN-γ, TNF-α) in immunised C57BL/6 mice
              to quantify CD8⁺ T-cell responses against validated peptides. Test the dual MHC-I/II binding capacity of
              Camk1d::Arid1a for combined CD4⁺/CD8⁺ vaccine design leveraging ARID1A's driver status (46–70% clear cell OC, COSMIC).
              <strong> Success criterion:</strong> ≥3 peptides elicit IFN-γ responses ≥2× background in ≥60% of immunised animals.
            </p>
          </div>

          <div className="border-l-2 border-destructive pl-4">
            <h4 className="text-sm font-bold text-foreground mb-1">Aim 3: Establish TTI-based early warning detection for clinical translation</h4>
            <p className="text-xs text-muted-foreground mb-2 font-mono">Modules: MSRS → Trajectory → TTI | Timeline: Months 12–48</p>
            <p className="text-sm text-foreground leading-relaxed mb-2">
              <strong>Aim 3a.</strong> Validate the Topological Transition Index (TTI = z(L) + z(B) + z(N)) as a generalised
              phase-transition detector across ≥5 independent cisplatin-resistance models. Current cross-validation shows
              convergent TTI &gt; 6.0 across OVCAR3-R (7.74), SKOV3-R (8.14), OVCAR8-R (7.42), GEM HGS1 (7.21), and GEM HGS3
              (7.02), with graph conductance φ &lt; 0.02 in all cases.
              <strong> Success criterion:</strong> TTI ≥ 6.0 in ≥80% of tested resistance models; false-positive rate &lt; 5%
              on null-topology controls.
            </p>
            <p className="text-sm text-foreground leading-relaxed mb-2">
              <strong>Aim 3b.</strong> Develop an Early Warning Signal (EWS) biomarker panel derived from the Trajectory
              module's critical slowing down metrics (rising variance, lag-1 autocorrelation, Kendall's τ trend) that can
              be measured from liquid biopsy ctDNA methylation profiles. <strong>Success criterion:</strong> EWS detection
              ≥2 timepoints before clinical resistance diagnosis (p &lt; 0.05 for both variance and autocorrelation trends).
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              <strong>Aim 3c.</strong> Integrate TTI with MSRS composite risk scoring (R = w₁·S_surv + w₂·S_clonal + w₃·S_neo
              + w₄·S_topo + w₅·S_traj) to generate a single clinician-facing decision metric with bootstrap-optimised
              confidence intervals. Prospectively validate in a cohort of ≥30 HGSOC patients with longitudinal samples.
              <strong> Success criterion:</strong> MSRS composite achieves concordance index ≥ 0.80 for 6-month progression prediction.
            </p>
          </div>
        </div>
      </div>

      {/* ── 10. Significance ── */}
      <SectionHeading id="significance" number="10" title="Significance" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        High-grade serous ovarian carcinoma (HGSOC) is the most lethal gynaecologic malignancy, with an estimated
        19,710 new cases and 13,270 deaths annually in the United States (ACS 2025). Despite initial platinum-taxane
        response rates exceeding 75%, the median progression-free survival for advanced-stage disease is 12–18 months,
        and five-year survival remains below 30%. The fundamental barrier to improved outcomes is acquired
        chemoresistance, which develops inevitably and is currently unpredictable at the molecular level.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Existing computational approaches to studying resistance rely on endpoint comparisons (pre-treatment vs.
        post-relapse), missing the <em>temporal dynamics</em> of the transition. No existing platform integrates
        longitudinal multi-omic data with topological data analysis and dynamical systems theory to detect the
        <em> approach</em> to resistance — the critical window where intervention might alter the trajectory.
        TEMPEST fills this gap by treating resistance as a phase transition with detectable early warning signals.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        The clinical impact is direct: if the D88–D99 bifurcation window identified in our GEM model translates
        to human disease, clinicians could introduce second-line therapies or immunotherapeutic interventions during
        the plastic pre-commitment phase rather than after irreversible consolidation of the resistant phenotype.
        The neoantigen intelligence system (CNIS) further enables personalised vaccine design targeting clonal trunk
        mutations that persist through the bifurcation, maximising therapeutic coverage.
      </p>

      {/* ── 11. Innovation ── */}
      <SectionHeading id="innovation" number="11" title="Innovation" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        TEMPEST introduces three methodological innovations that collectively distinguish it from existing
        computational oncology platforms:
      </p>
      <div className="space-y-4 mb-4">
        <div className="bg-secondary/30 border border-border rounded-md p-4">
          <h4 className="text-sm font-bold text-foreground mb-1">Innovation 1: Weighted Non-Negative Tucker Decomposition (wNTD) for Heterogeneous Multi-Omic Tensors</h4>
          <p className="text-sm text-foreground leading-relaxed">
            Unlike matrix-based methods (PCA, NMF) that require modality-specific factorisation, wNTD constructs a
            single fourth-order tensor 𝒳 ∈ ℝ<sup>S×G×M×T</sup> that jointly decomposes samples, features, modalities,
            and timepoints. A binary weight tensor W handles missing modality–timepoint combinations without imputation,
            and Tikhonov regularisation (λ = 10⁻⁴) prevents overfitting. This produces interpretable latent temporal
            programs that encode the evolution of regulatory states across treatment, achieving 92.3% variance explained
            with 8 latent factors in the GEM HGSOC model.
          </p>
        </div>
        <div className="bg-secondary/30 border border-border rounded-md p-4">
          <h4 className="text-sm font-bold text-foreground mb-1">Innovation 2: Topological Transition Index (TTI) — Persistent Homology for Phase-Transition Detection</h4>
          <p className="text-sm text-foreground leading-relaxed">
            The TTI decomposes regulatory phase transitions into three orthogonal topological components: H1 persistent
            homology loop mass (compensatory feedback loops), H0 branching fragmentation + directional dispersion
            (bifurcating programs), and graph conductance bottleneck (basin separation). Each component is standardised
            against a local-jitter null model, yielding a composite z-score with a rigorous statistical threshold
            (TTI ≥ 6.0, permutation p &lt; 0.001). No existing platform applies persistent homology to longitudinal
            multi-omic cancer data for phase-transition detection.
          </p>
        </div>
        <div className="bg-secondary/30 border border-border rounded-md p-4">
          <h4 className="text-sm font-bold text-foreground mb-1">Innovation 3: Cross-Species Neoantigen Intelligence with Temporal Clonal Tracking</h4>
          <p className="text-sm text-foreground leading-relaxed">
            CNIS uniquely integrates neoantigen discovery (WES + RNA-seq + fusion detection + MHC binding prediction)
            with PyClone clonal tracking and COSMIC/dbSNP cross-species validation in a single pipeline. The
            Therapeutic Priority Score (TPS) ranks candidates by binding affinity, clonal prevalence, temporal persistence,
            expression level, and cross-species conservation — enabling rational vaccine design that accounts for clonal
            evolution dynamics. The four-tier validation framework (GEM-specific → ortholog-mapped → cross-validated →
            clinically prioritised) provides a systematic path from computational prediction to experimental validation.
          </p>
        </div>
      </div>

      {/* ── 12. Proposed Timeline & Milestones ── */}
      <SectionHeading id="timeline" number="12" title="Proposed Timeline & Milestones" />
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Period</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Aim</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Milestone</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Deliverable</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Go/No-Go</th>
            </tr>
          </thead>
          <tbody>
            {[
              { period: "M1–6", aim: "1a", milestone: "wNTD pipeline validated on GEM D0–D122", deliverable: "Reproducible tensor decomposition with ≥90% VE", go: "VE ≥ 90%" },
              { period: "M3–12", aim: "1b–c", milestone: "GBSC + BCTN cross-validated", deliverable: "C-index report; clonal architecture maps", go: "C-index ≥ 0.78" },
              { period: "M6–12", aim: "2a", milestone: "CNIS computational pipeline complete", deliverable: "17-candidate master catalog with TPS rankings", go: "≥15 candidates pass filters" },
              { period: "M12–24", aim: "2b", milestone: "Peptide synthesis + validation (Gates 1–3)", deliverable: "MS-confirmed MHC-I presentation for ≥5 peptides", go: "≥5/8 confirmed" },
              { period: "M18–30", aim: "2c", milestone: "ELISpot immunogenicity assays", deliverable: "CD8⁺ IFN-γ response data for validated peptides", go: "≥3 immunogenic" },
              { period: "M12–24", aim: "3a", milestone: "TTI cross-model validation (≥5 models)", deliverable: "TTI convergence report with CI", go: "≥80% models TTI ≥ 6.0" },
              { period: "M24–36", aim: "3b", milestone: "EWS biomarker panel from ctDNA methylation", deliverable: "Validated EWS signature panel", go: "Detection ≥2 TP before Dx" },
              { period: "M30–48", aim: "3c", milestone: "Prospective MSRS validation (n ≥ 30)", deliverable: "Concordance index report", go: "C-index ≥ 0.80" },
            ].map((d, i) => (
              <tr key={d.period + d.aim} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                <td className="px-3 py-2 border border-border text-accent font-bold">{d.period}</td>
                <td className="px-3 py-2 border border-border text-foreground font-semibold">{d.aim}</td>
                <td className="px-3 py-2 border border-border text-foreground text-xs">{d.milestone}</td>
                <td className="px-3 py-2 border border-border text-muted-foreground text-xs">{d.deliverable}</td>
                <td className="px-3 py-2 border border-border text-xs font-mono">{d.go}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 13. Rigor, Reproducibility & Falsifiability ── */}
      <SectionHeading id="rigor" number="13" title="Rigor, Reproducibility & Falsifiability" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        TEMPEST is designed around explicit falsifiability criteria — each module generates predictions that can be
        empirically refuted:
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Module</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Prediction</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Falsification Test</th>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { mod: "TTI", pred: "TTI ≈ 0 for isogenic populations with no regulatory divergence", test: "In-silico: Null Gaussian topology class → TTI < 2.0", status: "VALIDATED" },
              { mod: "TTI", pred: "TTI ≥ 6.0 for confirmed resistant transitions", test: "Cross-model: 5/5 cisplatin-resistance models exceed threshold", status: "VALIDATED" },
              { mod: "Trajectory", pred: "EWS (rising variance, autocorrelation) absent in stable systems", test: "In-silico: stationary time series → no significant Kendall's τ", status: "VALIDATED" },
              { mod: "Trajectory", pred: "Bifurcation window at D88–D99 is reproducible", test: "Prospective: biological replicates with longitudinal sampling", status: "PENDING" },
              { mod: "MOTF", pred: "≥90% variance explained with ≤8 latent factors", test: "HOSVD reconstruction error on held-out timepoints", status: "VALIDATED (92.3%)" },
              { mod: "CNIS", pred: "TPS-ranked peptides are surface-presented MHC-I ligands", test: "H-2-Db IP + LC-MS/MS for top 8 candidates", status: "PENDING" },
              { mod: "CNIS", pred: "≥3 peptides elicit CD8⁺ IFN-γ responses", test: "ELISpot in immunised C57BL/6 mice", status: "PENDING" },
              { mod: "BCTN", pred: "Clonal sweep (H drop ≥40%) maps to bifurcation window", test: "PyClone posterior on D88–D109 interval", status: "VALIDATED" },
              { mod: "MSRS", pred: "Composite risk score predicts 6-month progression (C-index ≥ 0.80)", test: "Prospective cohort (n ≥ 30)", status: "PENDING" },
            ].map((d, i) => (
              <tr key={d.pred} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                <td className="px-3 py-2 border border-border text-foreground font-semibold">{d.mod}</td>
                <td className="px-3 py-2 border border-border text-foreground text-xs">{d.pred}</td>
                <td className="px-3 py-2 border border-border text-muted-foreground text-xs">{d.test}</td>
                <td className="px-3 py-2 border border-border">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                    d.status.startsWith("VALIDATED") ? "bg-chart-emerald/10 text-chart-emerald" : "bg-chart-amber/10 text-chart-amber"
                  }`}>{d.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Reproducibility measures:</strong> All analyses use containerised environments (Docker) with pinned
        dependency versions. Random seeds are fixed for MCMC sampling (PyClone), bootstrap resampling (MSRS), and
        null-model permutations (TTI). Raw data, processed tensors, and configuration files are version-controlled.
        The TEMPEST platform itself serves as the reproducibility vehicle — all modules can be re-executed with
        identical parameters via the pipeline interface.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        <strong>Biological sex as a variable:</strong> The GEM model uses female C57BL/6 mice exclusively (ovarian
        cancer model). Cross-validation datasets (OVCAR3, SKOV3, OVCAR8) are derived from female patients. Sex-specific
        molecular differences are not a confound in this study design, but prospective human validation (Aim 3c) will
        record biological sex and assess it as a covariate in the MSRS composite model.
      </p>

      {/* ── 14. References ── */}
      <SectionHeading id="references" number="14" title="References" />
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
