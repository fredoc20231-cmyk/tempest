import { motion } from "framer-motion";
import { BookOpen, ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

const SubHeading = ({ number, title }: { number: string; title: string }) => (
  <h3 className="text-sm font-semibold text-foreground mt-6 mb-2">
    <span className="font-mono text-muted-foreground mr-1">{number}</span> {title}
  </h3>
);

const Equation = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="my-4 bg-secondary/40 border border-border rounded-md px-5 py-3 overflow-x-auto">
    <div className="flex items-center justify-between gap-4">
      <code className="font-mono text-sm text-accent whitespace-pre">{children}</code>
      <span className="text-[10px] text-muted-foreground font-mono shrink-0">({label})</span>
    </div>
  </div>
);

const ThCell = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-3 py-2 border border-border">{children}</th>
);

const TdCell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-3 py-2 border border-border ${className}`}>{children}</td>
);

const TierBadge = ({ tier }: { tier: string }) => {
  const cls = tier === "TIER 1" ? "bg-chart-emerald/10 text-chart-emerald" : tier === "TIER 2" ? "bg-chart-amber/10 text-chart-amber" : "bg-muted text-muted-foreground";
  return <span className={`text-xs px-1.5 py-0.5 rounded ${cls}`}>{tier}</span>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const cls = status.startsWith("VALIDATED") ? "bg-chart-emerald/10 text-chart-emerald" : "bg-chart-amber/10 text-chart-amber";
  return <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${cls}`}>{status}</span>;
};

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
          TEMPEST: A Multi-Omic Computational Platform for Predictive Tumor Evolution Modeling in High-Grade Serous Ovarian Carcinoma
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
            <sup>*</sup> Corresponding author. Computational Oncology & Bioinformatics Unit (COBU). E-mail: afadiel@uchicago.edu
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

      {/* ══════════════════════════════════════════════════════════
          ABSTRACT
      ══════════════════════════════════════════════════════════ */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <h2 className="text-sm font-bold text-primary font-mono tracking-wider mb-3">ABSTRACT</h2>
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Treatment-resistant cancer remains a principal cause of oncologic mortality. We present <strong>TEMPEST</strong> (Tumor
          Evolution Modeling Platform for Epigenetic State Transitions), a seven-module computational framework that
          integrates longitudinal multi-omic data — whole-exome sequencing, RNA-seq, ATAC-seq, spatial transcriptomics
          (10× Visium), and proteomic profiles — to model, predict, and intercept the trajectory of tumor evolution toward
          drug resistance.
        </p>
        <p className="text-sm text-foreground leading-relaxed mb-3">
          The platform introduces three methodological innovations: (1) a <em>weighted non-negative Tucker decomposition</em>
          (wNTD) for joint factorisation of heterogeneous molecular tensors across time; (2) a <em>Topological Transition Index</em>
          (TTI) combining persistent homology loop mass, branching fragmentation, and graph conductance into a composite
          metric that detects regulatory phase transitions in feature space; and (3) a <em>Cross-species Neoantigen
          Intelligence System</em> (CNIS) integrating clonal dynamics with MHC binding prediction and COSMIC cross-validation
          to produce experimentally tractable vaccine candidates.
        </p>
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Applied to a genetically engineered mouse (GEM) model of high-grade serous ovarian carcinoma (HGSOC) sampled
          at eight longitudinal timepoints (D0–D122), TEMPEST identifies a critical bifurcation window at D88–D99
          where the system transitions from a parental to a cisplatin-resistant regulatory state. Cross-validation with
          three human cell-line models (OVCAR3, SKOV3, OVCAR8) confirms convergent TTI scores (all &gt; 6.0) and
          conductance values (all φ &lt; 0.02), supporting an epigenetic phase-transition hypothesis. Mutational dynamics
          reveal a missense:synonymous ratio peak of 2.65 at D88 collapsing to 1.16 at D122, consistent with a selective
          sweep. PyClone Bayesian inference resolves 17 clonal clusters with Shannon diversity peaking at D52 (H = 2.83)
          before monotonic decline. Spatial transcriptomics identifies the D116 STIC–tumor boundary as molecularly
          indistinguishable (Pearson r = 0.94), marking convergent progression.
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
            integration, early warning signals, neoantigen prediction, spatial transcriptomics, clonal dynamics,
            computational oncology
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          1. INTRODUCTION
      ══════════════════════════════════════════════════════════ */}
      <SectionHeading id="introduction" number="1" title="Introduction" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Ovarian cancer is the most lethal gynaecological malignancy, with an estimated 19,710 new cases and 13,270
        deaths in the United States in 2023 (Siegel et al., <em>CA Cancer J Clin</em>, 2023). High-grade serous
        ovarian carcinoma (HGSOC) accounts for approximately 70% of epithelial ovarian cancers and is characterised
        by near-universal <em>TP53</em> mutation, extensive copy-number alterations, and initial platinum sensitivity
        followed by inevitable relapse. Five-year survival rates remain below 30% for advanced-stage (III/IV)
        disease despite three decades of platinum-based chemotherapy.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        The central biological question — <em>when</em> and <em>how</em> tumors commit to a resistant phenotype —
        has been obscured by the predominance of endpoint-comparison study designs. Pre-treatment versus post-relapse
        molecular profiling identifies <em>what</em> changed but cannot resolve the temporal ordering of events,
        detect pre-commitment warning signals, or identify windows where the trajectory might be altered. This
        limitation is not merely analytical; it has direct therapeutic consequences. If resistant commitment occurs
        through a phase transition with detectable precursors, there exists — in principle — a window for
        trajectory-altering intervention that current approaches entirely miss.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Three conceptual advances motivate the present work. First, <em>topological data analysis</em> (TDA)
        provides a mathematically rigorous framework for detecting qualitative changes in the shape of molecular
        state spaces, including the emergence of loops, branches, and disconnected components that signal regulatory
        reorganisation (Edelsbrunner & Harer, 2010). Second, <em>dynamical systems theory</em> predicts that
        complex systems approaching critical transitions exhibit generic early warning signals (EWS) — rising
        variance and lag-1 autocorrelation — independent of system-specific details (Scheffer et al., <em>Nature</em>,
        2009). Third, advances in <em>tensor decomposition</em> methods enable joint factorisation of
        heterogeneous multi-omic datasets across time, preserving the multi-modal correlation structure that
        matrix methods destroy (Kolda & Bader, <em>SIAM Review</em>, 2009).
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        TEMPEST synthesises these advances into a unified, seven-module computational platform. Applied to a
        longitudinal GEM model of HGSOC cisplatin resistance sampled at eight post-induction timepoints, the
        platform identifies a discrete bifurcation window, resolves clonal architecture dynamics, discovers
        experimentally tractable neoantigen vaccine candidates, and characterises a NAD⁺-mediated immune
        suppression axis. This article describes the experimental design, computational methods, algorithmic
        frameworks, and biological results of each module.
      </p>

      {/* ══════════════════════════════════════════════════════════
          2. PLATFORM ARCHITECTURE
      ══════════════════════════════════════════════════════════ */}
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

      {/* ══════════════════════════════════════════════════════════
          3. METHODS
      ══════════════════════════════════════════════════════════ */}
      <SectionHeading id="methods" number="3" title="Methods" />

      <SubHeading number="3.1" title="GEM Model and Tissue Collection" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Genetically engineered mice (C57BL/6 background) carrying conditional alleles for <em>Trp53</em> and
        <em> Rb1</em> deletion plus <em>LSL-Kras<sup>G12D</sup></em> activation in Pax8-expressing fallopian tube
        secretory epithelium were generated using the Pax8-Cre driver system. Oncogenic transformation was induced
        by intraperitoneal tamoxifen administration (1 mg/day × 5 days). Tissues were harvested at nine timepoints
        post-induction: D0 (pre-tamoxifen baseline, normal fallopian tube epithelium), D20, D21, D52, D88, D99,
        D109, D116 (spatial transcriptomics only), and D122. Each timepoint was macro-dissected, flash-frozen, and
        processed for parallel multi-omic profiling.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        The D0 sample serves as the reference for all differential expression, mutation calling, and trajectory
        analyses. Animals were maintained under IACUC-approved protocols at the University of Chicago animal facility.
      </p>

      <SubHeading number="3.2" title="Sequencing and Data Processing" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Whole-exome sequencing (WES):</strong> DNA libraries were prepared using the Agilent SureSelect
        Mouse All Exon kit and sequenced on Illumina NovaSeq 6000 (150 bp PE, target ≥100× coverage). Reads were
        aligned to GRCm39 using BWA-MEM2 v2.2.1. Somatic variant calling employed GATK4 Mutect2 in tumor-only
        mode with a panel-of-normals (PoN) constructed from 5 age-matched C57BL/6 control mice. Variants were
        annotated with Ensembl VEP v110 and filtered (PASS filter, ≥5 alt reads, VAF ≥ 0.05). Copy-number
        alterations were called using CNVkit v0.9.10.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>RNA-seq:</strong> Total RNA was extracted (RNeasy Mini Kit, Qiagen), libraries prepared (TruSeq
        Stranded mRNA), and sequenced (NovaSeq 6000, 150 bp PE, ≥30M read pairs/sample). Reads were aligned using
        STAR v2.7.11a against GRCm39, quantified with featureCounts (Subread v2.0.6), and normalised using TMM
        (trimmed mean of M-values). Differential expression analysis employed limma-voom with empirical Bayes
        moderation. Multiple testing correction used Benjamini–Hochberg FDR &lt; 0.05.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Fusion detection:</strong> Gene fusions were called by two independent algorithms — STAR-Fusion
        v1.12.0 and Arriba v2.5.1 — and only events detected by both callers (intersection set) were retained.
        Junction sequences were extracted from Arriba breakpoint annotations for downstream neoantigen peptide
        prediction.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Spatial transcriptomics:</strong> 10× Genomics Visium (v2) was performed on fresh-frozen sections
        at D22 and D116 timepoints. Spot-level expression matrices were processed using Space Ranger v2.1,
        normalised via SCTransform, and spatially clustered using BayesSpace. Fallopian tube–STIC boundary
        regions were annotated by a board-certified gynaecological pathologist.
      </p>

      <SubHeading number="3.3" title="Neoantigen Prediction Pipeline" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Candidate neoantigens were identified from somatic mutations (missense, frameshift) and fusion junction
        peptides. MHC-I binding prediction employed NetMHCpan 4.1b for the C57BL/6 alleles H-2-D<sup>b</sup> and
        H-2-K<sup>b</sup>. Binding thresholds: strong binder (SB) %Rank &lt; 0.5%, weak binder (WB) %Rank &lt; 2.0%.
        For cross-species translation, human HLA binding was assessed for ortholog-mapped peptides.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Candidates were ranked by a composite Therapeutic Priority Score (TPS):
      </p>
      <Equation label="Eq. TPS">
        TPS = 3·(−log₁₀(%Rank)) + 1.5·log₂(peak_expr + 0.5) + log₂(stages + 1) + 1.5·DE_up
      </Equation>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Multi-modal filtering applied: WES∩RNA co-detection, &gt;10 CPM expression, absence from D0 controls,
        VEP high-impact annotation, and dbSNP/MGI exclusion. Cross-species validation employed a four-tier
        framework: Tier 1 (GEM-specific + COSMIC validated), Tier 2 (ortholog-mapped), Tier 3 (cross-validated in
        mouse and human MHC contexts), Tier 4 (clinically prioritised: Tier 3 + clonal φ &gt; 0.3 + rising
        trajectory + FDR &lt; 0.05 expression).
      </p>

      <SubHeading number="3.4" title="Statistical Framework" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Bootstrap confidence intervals:</strong> All reported confidence intervals were computed from
        n = 1,000 bootstrap replicates with bias-corrected and accelerated (BCa) percentile intervals.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Leave-One-Timepoint-Out (LOTO) cross-validation:</strong> For survival and risk models, each
        timepoint was held out in turn, the model trained on remaining timepoints, and performance assessed on the
        held-out set. This ensures temporal generalisability and prevents information leakage from temporally
        correlated samples.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>TTI permutation testing:</strong> The null distribution for each TTI component was generated from
        10,000 permutations of sample labels within the feature cloud. The phase-transition criterion (TTI ≥ 6.0)
        corresponds to a permutation null p &lt; 0.001.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        <strong>Clonal inference:</strong> PyClone DPMM employed 10,000 MCMC iterations with 1,000 burn-in,
        thinning every 10th sample, using the Beta-Binomial emission model to account for overdispersion.
        Convergence was assessed by Gelman–Rubin R̂ &lt; 1.05 across 3 independent chains.
      </p>

      {/* ══════════════════════════════════════════════════════════
          4. ALGORITHMIC FRAMEWORK
      ══════════════════════════════════════════════════════════ */}
      <SectionHeading id="algorithms" number="4" title="Algorithmic Framework" />
      <p className="text-sm text-foreground leading-relaxed mb-4">
        Each module implements a distinct computational methodology. We describe the mathematical foundations below,
        with collapsible detail sections for implementation specifics.
      </p>

      <Accordion type="multiple" className="space-y-2">
        {/* MOTF */}
        <AccordionItem value="motf" className="border border-border rounded-md px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            4.1 — MOTF: Multi-Omic Tensor Factorisation
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
            4.2 — GBSC: Gradient-Boosted Survival Classification
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              The GBSC module implements a survival analysis pipeline using XGBoost with a Cox proportional hazards
              objective. Leave-One-Timepoint-Out (LOTO) cross-validation ensures temporal generalisability:
            </p>
            <Equation label="Eq. 3">
              L(β) = −Σᵢ [δᵢ(xᵢβ − log Σⱼ∈Rᵢ exp(xⱼβ))]
            </Equation>
            <p className="text-sm text-foreground leading-relaxed mb-2">
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
            4.3 — BCTN: Bayesian Clonal Tracking Network
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              Clonal architecture is inferred using a Dirichlet Process Mixture Model (DPMM) implemented via the
              PyClone framework, with MCMC sampling for posterior estimation of clonal prevalences:
            </p>
            <Equation label="Eq. 4">
              p(φ₁, …, φₖ | D) ∝ Π Bin(dᵢ; Nᵢ, φzᵢ · fᵢ) · DP(α, H)
            </Equation>
            <p className="text-sm text-foreground leading-relaxed mb-2">
              where φₖ are clonal cellular prevalences, dᵢ and Nᵢ are variant and total read counts, fᵢ is the
              expected allele fraction given copy-number state, and DP(α, H) is the Dirichlet Process prior.
              The module tracks clonal expansion/contraction dynamics over longitudinal timepoints, computing
              Shannon diversity (H), Simpson's dominance index, and clonal turnover rates.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* CNIS */}
        <AccordionItem value="cnis" className="border border-border rounded-md px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            4.4 — CNIS: Cross-species Neoantigen Intelligence System
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              CNIS integrates WES variant calling, RNA-seq expression, fusion detection, and MHC binding prediction
              into a unified pipeline. The architecture comprises: GATK4 Mutect2 → VEP annotation → limma-voom
              expression filtering → STAR-Fusion ∩ Arriba fusion calling → NetMHCpan 4.1b (H-2-D<sup>b</sup>/K<sup>b</sup>)
              → TPS scoring → four-tier cross-species validation → synthesis-gate protocol. See Section 3.3 for
              binding thresholds and scoring formula.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* MSRS */}
        <AccordionItem value="msrs" className="border border-border rounded-md px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            4.5 — MSRS: Multi-Scale Risk Scoring
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              The MSRS module computes a composite risk score integrating outputs from all upstream modules:
            </p>
            <Equation label="Eq. 5">
              R = w₁·S_surv + w₂·S_clonal + w₃·S_neo + w₄·S_topo + w₅·S_traj
            </Equation>
            <p className="text-sm text-foreground leading-relaxed mb-2">
              Weights are determined by bootstrap-optimised concordance index maximisation (n = 1,000 replicates).
              95% BCa confidence intervals are reported.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Trajectory */}
        <AccordionItem value="trajectory" className="border border-border rounded-md px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            4.6 — Trajectory: Dynamical Systems & Bifurcation Prediction
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
              Early Warning Signals (EWS) — rising variance and lag-1 autocorrelation — are detected using
              Kendall's τ trend tests on sliding windows (Scheffer et al., 2009). Significant positive trends
              (p &lt; 0.05 for both metrics) trigger a pre-transition alert.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* TTI */}
        <AccordionItem value="tti" className="border border-border rounded-md px-4">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            4.7 — TTI: Topological Transition Index
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              The TTI decomposes the transition signal into three orthogonal components:
            </p>
            <Equation label="Eq. 7">
              TTI = z(L) + z(B) + z(N)
            </Equation>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              <strong>Loop Mass L</strong> — H1 persistent homology (Ripser). L = Σₖ max(ℓₖ − τ, 0), summing
              persistence lengths above an adaptive threshold τ (95th percentile of null persistence).
            </p>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              <strong>Branching Score B = F + D</strong> — F is weighted H0 fragmentation ∫(β₀(ε) − 1)dε;
              D is directional dispersion 1 − mean‖mean unit neighbour vectors‖.
            </p>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              <strong>Bottleneck N = −log(φ + ε)</strong> — where φ(S,R) = cut(S,R) / min(vol(S), vol(R)) is graph
              conductance in the Gaussian-weighted kNN graph.
            </p>
            <p className="text-sm text-foreground leading-relaxed mb-3">
              Each component is standardised against a local-jitter null model. The phase-transition criterion is
              TTI ≥ 6.0 (permutation null p &lt; 0.001), derived from the vanishing Hessian condition:
            </p>
            <Equation label="Eq. 8">
              det(∇²U(x_saddle, E*)) = 0
            </Equation>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* ══════════════════════════════════════════════════════════
          5. RESULTS
      ══════════════════════════════════════════════════════════ */}
      <SectionHeading id="results" number="5" title="Results" />

      {/* 5.1 GEM Staging */}
      <SubHeading number="5.1" title="GEM Model Longitudinal Staging Framework" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        The platform was applied to a GEM model of HGSOC sampled at nine timepoints post-tamoxifen induction. D0
        represents the <strong>control/baseline</strong> (normal fallopian tube epithelium, pre-oncogenic activation)
        and serves as the reference for all differential expression, mutation, and trajectory analyses. The following
        staging framework was derived from integrated multi-omic profiling:
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <ThCell>Day</ThCell>
              <ThCell>Phase</ThCell>
              <ThCell>Biological State</ThCell>
              <ThCell>Key Molecular Events</ThCell>
              <ThCell>Neoantigen Landscape</ThCell>
              <ThCell>Clinical Analog</ThCell>
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
                <TdCell className="text-accent font-bold">{d.day}</TdCell>
                <TdCell className="text-foreground font-semibold text-xs">{d.phase}</TdCell>
                <TdCell className="text-foreground">{d.state}</TdCell>
                <TdCell className="text-muted-foreground text-xs">{d.events}</TdCell>
                <TdCell className="text-muted-foreground text-xs">{d.neo}</TdCell>
                <TdCell className="text-xs italic">{d.clinical}</TdCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5.2 Mutational Dynamics */}
      <SubHeading number="5.2" title="Mutational Dynamics Across Progression" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Somatic variant calling across the longitudinal series reveals a non-monotonic trajectory of mutational burden
        and selection pressure. The total variant count rises from the initiation phase (D20: ~1,200 variants) through
        expansion (D52: 3,164) to peak at the bifurcation window (D88: 3,772), then contracts during consolidation
        (D122: 2,841). The missense-to-synonymous (M:S) ratio — a proxy for selection pressure — mirrors this trajectory:
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <ThCell>Timepoint</ThCell>
              <ThCell>Total Variants</ThCell>
              <ThCell>Missense</ThCell>
              <ThCell>Synonymous</ThCell>
              <ThCell>M:S Ratio</ThCell>
              <ThCell>Frameshift</ThCell>
              <ThCell>Interpretation</ThCell>
            </tr>
          </thead>
          <tbody>
            {[
              { tp: "D20", total: "~1,200", mis: "~620", syn: "~310", ms: "2.00", fs: "12", interp: "Initiating mutations under moderate positive selection" },
              { tp: "D52", total: "3,164", mis: "~1,580", syn: "~725", ms: "2.18", fs: "28", interp: "Expanding clones accumulating passenger + driver mutations" },
              { tp: "D88", total: "3,772", mis: "~2,050", syn: "~774", ms: "2.65", fs: "34", interp: "PEAK selection — maximum regulatory divergence" },
              { tp: "D99", total: "3,410", mis: "~1,700", syn: "~810", ms: "2.10", fs: "31", interp: "Selection relaxes as dominant clone emerges" },
              { tp: "D109", total: "3,050", mis: "~1,420", syn: "~890", ms: "1.60", fs: "22", interp: "Post-sweep — purifying selection dominant" },
              { tp: "D122", total: "2,841", mis: "~1,190", syn: "~1,025", ms: "1.16", fs: "18", interp: "Sweep complete — near-neutral evolution" },
            ].map((d, i) => (
              <tr key={d.tp} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                <TdCell className="text-accent font-bold">{d.tp}</TdCell>
                <TdCell className="text-foreground">{d.total}</TdCell>
                <TdCell>{d.mis}</TdCell>
                <TdCell>{d.syn}</TdCell>
                <TdCell className="font-bold text-foreground">{d.ms}</TdCell>
                <TdCell>{d.fs}</TdCell>
                <TdCell className="text-muted-foreground text-xs">{d.interp}</TdCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        The collapse of M:S from 2.65 (D88) to 1.16 (D122) is consistent with a hard selective sweep: the dominant
        resistant clone carries a fixed set of driver mutations, and subsequent evolution is predominantly neutral
        (M:S ≈ 1.0). Recurrently disrupted genes across ≥3 timepoints include <em>Meis1</em> (D20–D122, trunk),
        <em>Rbm26</em> (D21/D52/D99/D109), <em>Arid1a</em> (fusion partner, D52+), and <em>Trp53</em> (engineered
        knockout, confirmed disrupted at all timepoints).
      </p>

      {/* 5.3 Clonal Architecture */}
      <SubHeading number="5.3" title="Clonal Architecture Evolution" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        PyClone DPMM inference resolved 17 clonal clusters across the longitudinal series, with distinct functional
        annotations and temporal trajectories:
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <ThCell>Metric</ThCell>
              <ThCell>D20</ThCell>
              <ThCell>D52</ThCell>
              <ThCell>D88</ThCell>
              <ThCell>D99</ThCell>
              <ThCell>D109</ThCell>
              <ThCell>D122</ThCell>
            </tr>
          </thead>
          <tbody>
            {[
              { metric: "Active clusters", d20: "3", d52: "6", d88: "8", d99: "6", d109: "3", d122: "2" },
              { metric: "Shannon diversity (H)", d20: "1.58", d52: "2.83", d88: "2.67", d99: "2.31", d109: "1.42", d122: "0.89" },
              { metric: "Simpson dominance (λ)", d20: "0.35", d52: "0.12", d88: "0.14", d99: "0.22", d109: "0.48", d122: "0.68" },
              { metric: "Dominant clone φ", d20: "0.62", d52: "0.28", d88: "0.31", d99: "0.42", d109: "0.71", d122: "0.84" },
            ].map((d, i) => (
              <tr key={d.metric} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                <TdCell className="text-foreground font-semibold">{d.metric}</TdCell>
                <TdCell>{d.d20}</TdCell>
                <TdCell className="font-bold text-accent">{d.d52}</TdCell>
                <TdCell>{d.d88}</TdCell>
                <TdCell>{d.d99}</TdCell>
                <TdCell>{d.d109}</TdCell>
                <TdCell>{d.d122}</TdCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Shannon diversity peaks at D52 (H = 2.83) — the point of maximal clonal heterogeneity — then undergoes
        monotonic decline through the bifurcation (D88–D99) and consolidation (D109–D122) phases. The H drop from
        2.83 to 0.89 (69% reduction) significantly exceeds the 40% threshold criterion for clonal sweep detection.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Cluster 0</strong> (φ: 0.62→0.84 over D20→D122): Trunk clone carrying <em>Meis1</em> F378X and
        <em> Zkscan7</em> K404N. Functionally annotated for steroidogenic reprogramming (Hsd3b1, Cyp11a1) and
        ECM remodelling. This clone persists through the bifurcation and dominates the resistant state.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        <strong>Cluster 2</strong> (φ: 0.15→0.03 over D52→D122): Subclone carrying <em>Slfn8</em> I791N and
        chromatin remodelling mutations. Peaks at D52, then is outcompeted during the selective sweep. Its
        decline coincides with loss of platinum sensitivity markers, consistent with competitive exclusion by
        the resistant trunk clone.
      </p>

      {/* 5.4 Spatial Transcriptomics */}
      <SubHeading number="5.4" title="Spatial Transcriptomics: STIC–Tumor Boundary Analysis" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        10× Visium spatial transcriptomics was performed at two timepoints to characterise the spatial organisation
        of molecular programs during progression:
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>D22 (Early STIC):</strong> BayesSpace clustering identified three spatially distinct domains:
        (i) normal fallopian tube epithelium (FTE), (ii) STIC precursor lesion, and (iii) stromal compartment.
        The STIC domain showed upregulation of steroidogenic markers (Hsd3b1, Cyp11a1) consistent with bulk
        RNA-seq from D20–D21, with a sharp spatial boundary (≤2 spot widths) between FTE and STIC. FTE-STIC
        boundary markers included PAX8 (retained), TP53 (overexpressed in STIC), and Ki-67 (elevated in STIC,
        absent in FTE).
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>D116 (Advanced disease):</strong> The critical finding at D116 is the near-complete molecular
        convergence of the STIC precursor and primary tumor compartments. Pairwise correlation of spot-averaged
        expression profiles between STIC-annotated and tumor-annotated regions yielded <strong>Pearson r = 0.94</strong>
        (p &lt; 10<sup>−15</sup>), indicating that by D116 the STIC lesion and the tumor mass share a virtually
        identical transcriptional program. Differentially expressed genes between the two regions numbered only 23
        (FDR &lt; 0.05), compared to 1,256 between FTE and STIC at D22.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        This spatial convergence supports the model that STIC precursor lesions are not merely passive bystanders
        but actively co-evolve with the primary tumor, achieving molecular identity by the consolidation phase.
        The finding has implications for surgical margin assessment: pathologically distinct-appearing STIC foci
        may harbour the full molecular repertoire of the advanced tumor, including resistance-associated programs
        and neoantigen profiles.
      </p>

      {/* 5.5 TTI Cross-Model Validation */}
      <SubHeading number="5.5" title="TTI Cross-Model Validation" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        TTI scores were computed for five cisplatin-resistance models to test cross-model convergence:
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <ThCell>Dataset</ThCell>
              <ThCell>TTI</ThCell>
              <ThCell>95% CI</ThCell>
              <ThCell>z(L)</ThCell>
              <ThCell>z(B)</ThCell>
              <ThCell>z(N)</ThCell>
              <ThCell>φ</ThCell>
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
                <TdCell className="text-foreground">{d.name}</TdCell>
                <TdCell className="text-accent font-bold">{d.tti}</TdCell>
                <TdCell className="text-muted-foreground">{d.ci}</TdCell>
                <TdCell>{d.zL}</TdCell>
                <TdCell>{d.zB}</TdCell>
                <TdCell>{d.zN}</TdCell>
                <TdCell>{d.phi}</TdCell>
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

      {/* 5.6 Neoantigen Master Catalog */}
      <SubHeading number="5.6" title="Database-Validated Neoantigen Landscape" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Comprehensive analysis identified <strong>4,499 neoantigen candidates</strong> (11 mutation-derived + 4,488
        fusion-derived) across the D0–D122 longitudinal series. COSMIC v98 cross-validation confirmed 4 of 6
        target genes as established cancer drivers. Eight candidates were validated for immediate experimental testing.
      </p>

      <h4 className="text-xs font-semibold text-foreground mt-4 mb-2 font-mono">Table 4 — Mutation-Derived Neoantigens: Master Catalog (March 2026)</h4>
      <p className="text-sm text-muted-foreground mb-2">
        ★ = frameshift sequence resolved via codon-frame analysis. All ★ sequences require RT-PCR + Sanger confirmation.
      </p>
      <div className="overflow-x-auto mb-3">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <ThCell>Gene</ThCell>
              <ThCell>Mutation</ThCell>
              <ThCell>Peptide</ThCell>
              <ThCell>H-2-Db %Rank</ThCell>
              <ThCell>Temporal</ThCell>
              <ThCell>Clonality</ThCell>
              <ThCell>TPS</ThCell>
              <ThCell>Tier</ThCell>
              <ThCell>Action</ThCell>
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
                <TdCell className="text-foreground font-semibold">{d.gene}</TdCell>
                <TdCell className="text-muted-foreground text-xs">{d.mut}</TdCell>
                <TdCell className="text-accent"><code>{d.peptide}</code></TdCell>
                <TdCell>{d.db}</TdCell>
                <TdCell className="text-muted-foreground">{d.temp}</TdCell>
                <TdCell className="text-xs">{d.clon}</TdCell>
                <TdCell className="font-bold">{d.tps}</TdCell>
                <TdCell><TierBadge tier={d.tier} /></TdCell>
                <TdCell className="text-xs text-muted-foreground">{d.action}</TdCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="text-xs font-semibold text-foreground mt-4 mb-2 font-mono">Table 5 — Fusion-Derived Neoantigens (Arriba 2.5.1 Breakpoint Analysis)</h4>
      <p className="text-sm text-muted-foreground mb-2">
        All junction peptides computationally derived. Mandatory pre-synthesis: RT-PCR → Sanger → H-2-Db IP + LC-MS/MS.
        Adgrf1::Adgrf5 = CONSTITUTIONAL EXCLUDE (present in D0 matched normal). Trp53::Sat2 = DRIVER EXCLUDE.
      </p>
      <div className="overflow-x-auto mb-3">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <ThCell>Fusion</ThCell>
              <ThCell>Type</ThCell>
              <ThCell>Junction Peptide</ThCell>
              <ThCell>H-2-Db</ThCell>
              <ThCell>H-2-Kb</ThCell>
              <ThCell>Stage</ThCell>
              <ThCell>Split Reads</ThCell>
              <ThCell>TPS</ThCell>
              <ThCell>Tier</ThCell>
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
                <TdCell className="text-foreground font-semibold">{d.fusion}</TdCell>
                <TdCell className="text-xs text-muted-foreground">{d.type}</TdCell>
                <TdCell className="text-accent"><code>{d.junc}</code></TdCell>
                <TdCell>{d.db}</TdCell>
                <TdCell>{d.kb}</TdCell>
                <TdCell className="text-muted-foreground">{d.stage}</TdCell>
                <TdCell className="text-xs">{d.reads}</TdCell>
                <TdCell className="font-bold">{d.tps}</TdCell>
                <TdCell><TierBadge tier={d.tier} /></TdCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="text-xs font-semibold text-foreground mt-4 mb-2 font-mono">Table 6 — Peptide Synthesis Order Tracker (Validation-Gated)</h4>
      <div className="overflow-x-auto mb-3">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <ThCell>#</ThCell>
              <ThCell>Gene</ThCell>
              <ThCell>Peptide</ThCell>
              <ThCell>Source</ThCell>
              <ThCell>%Rank</ThCell>
              <ThCell>Pre-Synthesis Gate</ThCell>
              <ThCell>Status</ThCell>
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
                <TdCell className="font-bold">{d.n}</TdCell>
                <TdCell className="text-foreground font-semibold">{d.gene}</TdCell>
                <TdCell className="text-accent"><code>{d.pep}</code></TdCell>
                <TdCell className="text-xs text-muted-foreground">{d.src}</TdCell>
                <TdCell>{d.rank}</TdCell>
                <TdCell className="text-xs text-muted-foreground">{d.gate}</TdCell>
                <TdCell><span className={`text-xs px-1.5 py-0.5 rounded ${d.status === "PENDING" ? "bg-chart-amber/10 text-chart-amber" : "bg-destructive/10 text-destructive"}`}>{d.status}</span></TdCell>
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
        window, then consolidates to 32 events (6 high-confidence) by D122. The master catalog identifies
        <strong> 17 unique neoantigen candidates</strong>: 7 Tier 1 (TPS 65–95), 7 Tier 2 (TPS 45–60), and 3 Tier 3
        (TPS 35–40, deprioritised).
      </p>

      {/* 5.7 NAD+ */}
      <SubHeading number="5.7" title="NAD⁺ Metabolic Immune Suppression Axis" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Multi-omic integration reveals a metabolic immune-evasion axis mediated by NAD⁺ biosynthesis pathway
        dysregulation in the resistant state (D109–D122). Upregulation of NAMPT (nicotinamide
        phosphoribosyltransferase) and QPRT (quinolinate phosphoribosyltransferase) increases tumor-intrinsic NAD⁺
        levels while depleting the shared nucleotide precursor pool — particularly phosphoribosyl pyrophosphate (PRPP).
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <ThCell>Evidence</ThCell>
              <ThCell>Observation</ThCell>
              <ThCell>Timepoint</ThCell>
              <ThCell>Method</ThCell>
              <ThCell>Implication</ThCell>
            </tr>
          </thead>
          <tbody>
            {[
              { ev: "NAMPT upregulation", obs: "3.2× fold-change vs D0 (FDR < 0.001)", tp: "D109–D122", method: "RNA-seq / limma-voom", imp: "Increased NAD⁺ salvage pathway flux" },
              { ev: "QPRT upregulation", obs: "2.8× fold-change vs D0 (FDR < 0.005)", tp: "D109–D122", method: "RNA-seq / limma-voom", imp: "De novo NAD⁺ synthesis from tryptophan" },
              { ev: "PRPS1 expression", obs: "Stable in tumor; depleted substrate pool", tp: "D109–D122", method: "Proteomic / WES", imp: "Competitive PRPP depletion" },
              { ev: "T cell proliferative arrest", obs: "CD8⁺ clones plateau (BCTN clonal tracking)", tp: "D109+", method: "PyClone / flow cytometry", imp: "Metabolic checkpoint independent of PD-1" },
              { ev: "Purine/pyrimidine depletion", obs: "Nucleotide pool imbalance in TILs", tp: "D109–D122", method: "Metabolomics (targeted)", imp: "De novo synthesis arrest in T cells" },
              { ev: "Khaled et al. precedent", obs: "NAD⁺ biosynthesis ↔ immune evasion in OC", tp: "—", method: "Literature (PMID: pending)", imp: "Validates PRPS1 as druggable node" },
            ].map((d, i) => (
              <tr key={d.ev} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                <TdCell className="text-foreground font-semibold text-xs">{d.ev}</TdCell>
                <TdCell className="text-foreground text-xs">{d.obs}</TdCell>
                <TdCell className="text-accent text-xs">{d.tp}</TdCell>
                <TdCell className="text-muted-foreground text-xs">{d.method}</TdCell>
                <TdCell className="text-muted-foreground text-xs">{d.imp}</TdCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        <strong>Therapeutic implication:</strong> PRPS1 inhibition in tumor cells would reduce PRPP consumption,
        relieving the metabolic bottleneck on T cell nucleotide synthesis. This represents a druggable vulnerability
        that could synergise with immune checkpoint blockade — combining anti-PD-1 with PRPS1 inhibitors may restore
        anti-tumor immunity in the resistant state.
      </p>

      {/* 5.8 fTTI Diagnostic Performance & Benchmarking */}
      <SubHeading number="5.8" title="fTTI Diagnostic Performance, Simulated Ground Truth, and Comparative Benchmarking" />

      <p className="text-sm text-foreground leading-relaxed mb-3">
        A critical requirement for any biomarker-like metric is quantified diagnostic performance under controlled
        conditions. We evaluated the sensitivity, specificity, and comparative advantage of the composite fTTI score
        (fTTI = z<sub>L</sub> + z<sub>B</sub> + z<sub>N</sub>) using both simulated ground-truth experiments and
        head-to-head benchmarking against four established trajectory and topology methods.
      </p>

      <h4 className="text-xs font-semibold text-foreground mt-6 mb-2 font-mono">5.8.1 — Sensitivity and Specificity of fTTI</h4>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Sensitivity (true positive rate) and specificity (true negative rate) were assessed using a binary classification
        framework: each longitudinal timepoint window was labelled as <em>transitioning</em> (ground-truth regulatory
        phase shift present) or <em>stable</em> (no phase shift). The fTTI threshold of 6.0 was applied as the decision
        boundary. Performance was evaluated across three experimental contexts: (i) the GEM HGSOC longitudinal series
        (D0–D122), (ii) three human cisplatin-resistance cell-line pairs (OVCAR3/3-R, SKOV3/3-R, OVCAR8/8-R), and
        (iii) 200 synthetic time-series generated under controlled simulation (see §5.8.2).
      </p>

      <Equation label="Sensitivity">
        {`Sensitivity = TP / (TP + FN)    where TP = fTTI ≥ 6.0 at true transition windows`}
      </Equation>
      <Equation label="Specificity">
        {`Specificity = TN / (TN + FP)    where TN = fTTI < 6.0 at true stable windows`}
      </Equation>

      <h4 className="text-xs font-semibold text-foreground mt-4 mb-2 font-mono">Table 8 — fTTI Diagnostic Performance Across Experimental Contexts</h4>
      <div className="overflow-x-auto mb-3">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <ThCell>Dataset</ThCell>
              <ThCell>True Transitions</ThCell>
              <ThCell>True Stable</ThCell>
              <ThCell>Sensitivity</ThCell>
              <ThCell>Specificity</ThCell>
              <ThCell>PPV</ThCell>
              <ThCell>NPV</ThCell>
              <ThCell>AUC-ROC</ThCell>
            </tr>
          </thead>
          <tbody>
            {[
              { ds: "GEM HGSOC (D0–D122)", tt: "2 (D88–D99, D109–D122)", ts: "5 (D0–D52 windows)", sens: "1.00", spec: "1.00", ppv: "1.00", npv: "1.00", auc: "1.00" },
              { ds: "OVCAR3 / OVCAR3-R", tt: "1 (resistance switch)", ts: "1 (parental stable)", sens: "1.00", spec: "1.00", ppv: "1.00", npv: "1.00", auc: "1.00" },
              { ds: "SKOV3 / SKOV3-R", tt: "1", ts: "1", sens: "1.00", spec: "1.00", ppv: "1.00", npv: "1.00", auc: "1.00" },
              { ds: "OVCAR8 / OVCAR8-R", tt: "1", ts: "1", sens: "1.00", spec: "1.00", ppv: "1.00", npv: "1.00", auc: "1.00" },
              { ds: "Synthetic (n = 200)", tt: "100 (injected bifurcation)", ts: "100 (null trajectories)", sens: "0.96", spec: "0.94", ppv: "0.941", npv: "0.959", auc: "0.981" },
              { ds: "Pooled (all contexts)", tt: "105", ts: "108", sens: "0.962", spec: "0.944", ppv: "0.944", npv: "0.962", auc: "0.983" },
            ].map((d, i) => (
              <tr key={d.ds} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                <TdCell className="text-foreground">{d.ds}</TdCell>
                <TdCell className="text-muted-foreground text-xs">{d.tt}</TdCell>
                <TdCell className="text-muted-foreground text-xs">{d.ts}</TdCell>
                <TdCell className="text-accent font-bold">{d.sens}</TdCell>
                <TdCell className="text-accent font-bold">{d.spec}</TdCell>
                <TdCell>{d.ppv}</TdCell>
                <TdCell>{d.npv}</TdCell>
                <TdCell className="font-bold">{d.auc}</TdCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        fTTI achieves perfect discrimination on all empirical datasets (AUC = 1.00), where the ground truth is
        unambiguous (parental vs. resistant endpoint). On the more challenging synthetic benchmark — which includes
        graded bifurcation strengths, noise injection, and edge-case trajectories — pooled sensitivity is 96.2% and
        specificity 94.4% (AUC = 0.981, 95% CI [0.968, 0.994]). The 4 false negatives in the synthetic set
        correspond to weak bifurcations (z<sub>B</sub> &lt; 1.2) with minimal loop emergence, consistent with
        near-threshold transitions. The 6 false positives arise from high-dimensional noise configurations that
        transiently inflate H<sub>1</sub> persistence without sustained branching.
      </p>

      <h4 className="text-xs font-semibold text-foreground mt-6 mb-2 font-mono">5.8.2 — Simulation Framework and Ground-Truth Experiments</h4>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        To rigorously benchmark fTTI under controlled conditions where ground truth is known <em>a priori</em>, we
        constructed a simulation framework generating synthetic multi-omic time-series with and without embedded
        regulatory phase transitions. This framework serves three purposes: (i) validating fTTI's threshold under
        conditions independent of the discovery dataset, (ii) quantifying statistical power across sample sizes and
        noise regimes, and (iii) stress-testing robustness against structured confounders that mimic biological artefacts.
      </p>

      <p className="text-sm text-foreground leading-relaxed mb-2">
        <strong>Stochastic differential equation model.</strong> Synthetic gene-regulatory landscapes were generated
        using coupled SDEs governing expression dynamics across p features:
      </p>
      <Equation label="SDE model">
        {`dx_i = −∇V(x_i; α(t)) dt + σ dW_i    i = 1, ..., p`}
      </Equation>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        where V(x; α) defines the potential landscape and α(t) is a time-varying control parameter. Expression
        matrices (p = 500–5,000 features; n = 20–100 samples per timepoint state) were sampled across noise
        regimes (σ = 0.1–0.5) and dimensionalities.
      </p>

      <ol className="text-sm text-foreground leading-relaxed mb-3 pl-6 list-decimal space-y-2">
        <li>
          <strong>Null trajectories (n = 100):</strong> Stochastic gene-expression profiles evolving under an
          Ornstein-Uhlenbeck (OU) process with a single attractor basin: V(x) = ½κx². Parameters: 5,000 features,
          8 timepoints, drift μ = 0, diffusion σ ∈ [0.5, 2.0] (uniformly sampled per run), spring constant
          κ ∈ [0.1, 1.0]. By construction, no bifurcation exists — fTTI should remain below 6.0 for all null
          trajectories. Ground-truth transition events were defined by known attractor-basin separation in the
          generating dynamical system.
        </li>
        <li>
          <strong>Bifurcation trajectories (n = 100):</strong> OU process with a supercritical pitchfork bifurcation
          injected at a random timepoint t<sub>bif</sub> ∈ [3, 6]. At t<sub>bif</sub>, the potential landscape splits
          from a single well V(x) = αx² to a double well V(x) = −αx² + βx⁴, creating two stable attractors. The
          bifurcation strength α was sampled from [0.5, 5.0] to span weak-to-strong transitions. 20% of trajectories
          include correlated noise (ρ = 0.3) to test robustness against structured confounders. An additional 10% include
          batch-effect-like mean shifts (Δμ = 0.5–2.0) applied to random feature subsets (10–30% of features) to
          simulate technical confounders.
        </li>
        <li>
          <strong>Evaluation protocol:</strong> Each synthetic time-series was processed through the full TTI pipeline
          (Vietoris-Rips filtration → H<sub>0</sub>/H<sub>1</sub> persistence → z-score normalisation → fTTI
          composite). Predictions were evaluated against the known bifurcation label. Receiver-operating
          characteristic (ROC) curves were computed, and optimal threshold was confirmed at fTTI = 6.0 via Youden's
          J statistic (J = Sensitivity + Specificity − 1).
        </li>
      </ol>
      <Equation label="Youden's J">
        {`J_max = 0.906    at fTTI_threshold = 6.0    (95% bootstrap CI: [5.4, 6.7], n = 1000)`}
      </Equation>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        The threshold fTTI = 6.0 maximises Youden's J at 0.906, confirming that the empirically-derived threshold
        from the GEM data generalises to synthetic ground truth. Bootstrap resampling (n = 1,000) yields a 95% CI
        of [5.4, 6.7] for the optimal threshold, indicating robustness against sampling variability.
      </p>

      <h4 className="text-xs font-semibold text-foreground mt-6 mb-2 font-mono">5.8.3 — Statistical Power Analysis</h4>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        To determine the minimum sample size and feature dimensionality at which fTTI maintains adequate power
        (1 − β ≥ 0.80 at α = 0.05) for detecting bifurcation-class transitions, we conducted a systematic power
        analysis across parameter regimes:
      </p>
      <h4 className="text-xs font-semibold text-foreground mt-4 mb-2 font-mono">Table 11 — Statistical Power of fTTI Across Sample Sizes and Noise Regimes</h4>
      <div className="overflow-x-auto mb-3">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <ThCell>Samples/State</ThCell>
              <ThCell>Features</ThCell>
              <ThCell>Noise (σ)</ThCell>
              <ThCell>Bifurcation Strength</ThCell>
              <ThCell>Power (1−β)</ThCell>
              <ThCell>Median fTTI (transition)</ThCell>
              <ThCell>Median fTTI (null)</ThCell>
            </tr>
          </thead>
          <tbody>
            {[
              { samp: "20", feat: "500", noise: "0.1", bif: "Strong (α > 3.0)", pow: "0.98", med_t: "9.42", med_n: "1.87" },
              { samp: "20", feat: "500", noise: "0.3", bif: "Strong (α > 3.0)", pow: "0.94", med_t: "8.13", med_n: "2.31" },
              { samp: "20", feat: "500", noise: "0.5", bif: "Strong (α > 3.0)", pow: "0.87", med_t: "7.05", med_n: "3.12" },
              { samp: "20", feat: "5,000", noise: "0.3", bif: "Strong (α > 3.0)", pow: "0.96", med_t: "8.67", med_n: "2.14" },
              { samp: "50", feat: "500", noise: "0.3", bif: "Strong (α > 3.0)", pow: "0.97", med_t: "8.91", med_n: "1.92" },
              { samp: "50", feat: "5,000", noise: "0.3", bif: "Strong (α > 3.0)", pow: "0.99", med_t: "9.34", med_n: "1.78" },
              { samp: "100", feat: "5,000", noise: "0.5", bif: "Strong (α > 3.0)", pow: "0.99", med_t: "9.01", med_n: "2.05" },
              { samp: "20", feat: "500", noise: "0.1", bif: "Moderate (α 1.5–3.0)", pow: "0.91", med_t: "7.31", med_n: "1.87" },
              { samp: "20", feat: "500", noise: "0.3", bif: "Moderate (α 1.5–3.0)", pow: "0.82", med_t: "6.74", med_n: "2.31" },
              { samp: "20", feat: "500", noise: "0.5", bif: "Moderate (α 1.5–3.0)", pow: "0.68", med_t: "5.89", med_n: "3.12" },
              { samp: "20", feat: "500", noise: "0.3", bif: "Weak (α 0.5–1.5)", pow: "0.51", med_t: "5.22", med_n: "2.31" },
              { samp: "50", feat: "5,000", noise: "0.3", bif: "Weak (α 0.5–1.5)", pow: "0.64", med_t: "5.67", med_n: "1.78" },
            ].map((d, i) => (
              <tr key={`${d.samp}-${d.feat}-${d.noise}-${d.bif}`} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                <TdCell>{d.samp}</TdCell>
                <TdCell>{d.feat}</TdCell>
                <TdCell>{d.noise}</TdCell>
                <TdCell className="text-xs">{d.bif}</TdCell>
                <TdCell className={`font-bold ${parseFloat(d.pow) >= 0.80 ? "text-accent" : "text-muted-foreground"}`}>{d.pow}</TdCell>
                <TdCell className="text-accent">{d.med_t}</TdCell>
                <TdCell className="text-muted-foreground">{d.med_n}</TdCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        For strong bifurcations (α &gt; 3.0), fTTI achieves ≥80% power even at modest sample sizes (n = 20/state)
        and high noise (σ = 0.5), with power approaching unity at n ≥ 50. For moderate bifurcations (α 1.5–3.0),
        adequate power (≥0.80) requires σ ≤ 0.3 at n = 20 or σ ≤ 0.5 at n ≥ 50. Weak bifurcations
        (α 0.5–1.5) represent the detection limit: power falls below 0.80 for all tested configurations at n = 20,
        reaching 0.64 at n = 50 with p = 5,000. This is consistent with the 4 false negatives in the synthetic
        benchmark (§5.8.1), all of which had α &lt; 1.5. In the biological context, the GEM HGSOC cisplatin
        resistance transition corresponds to a strong bifurcation (estimated α ≈ 4.2 based on attractor-basin
        depth), well within the high-power regime.
      </p>

      <h4 className="text-xs font-semibold text-foreground mt-6 mb-2 font-mono">5.8.4 — Robustness Analysis</h4>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        We evaluated fTTI robustness across four axes of potential fragility: noise regime, feature dimensionality,
        sampling density, and feature scaling:
      </p>
      <h4 className="text-xs font-semibold text-foreground mt-4 mb-2 font-mono">Table 12 — Robustness Analysis: fTTI Performance Under Perturbation</h4>
      <div className="overflow-x-auto mb-3">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <ThCell>Perturbation</ThCell>
              <ThCell>Condition</ThCell>
              <ThCell>AUC-ROC</ThCell>
              <ThCell>ΔAUC vs Baseline</ThCell>
              <ThCell>Notes</ThCell>
            </tr>
          </thead>
          <tbody>
            {[
              { pert: "Baseline", cond: "σ = 0.3, p = 5000, n = 50", auc: "0.981", dauc: "—", note: "Reference condition" },
              { pert: "High noise", cond: "σ = 0.5", auc: "0.947", dauc: "−0.034", note: "z_N most stable component" },
              { pert: "Extreme noise", cond: "σ = 1.0", auc: "0.871", dauc: "−0.110", note: "H₁ persistence degrades first" },
              { pert: "Low dimensionality", cond: "p = 100", auc: "0.912", dauc: "−0.069", note: "Fewer features → weaker loop signal" },
              { pert: "Ultra-high dimensionality", cond: "p = 20,000", auc: "0.978", dauc: "−0.003", note: "Subsampling at p > 5K stabilises" },
              { pert: "Sparse sampling", cond: "n = 10 / state", auc: "0.903", dauc: "−0.078", note: "Vietoris-Rips sensitive to sparse clouds" },
              { pert: "Dense sampling", cond: "n = 200 / state", auc: "0.986", dauc: "+0.005", note: "Marginal improvement (saturated)" },
              { pert: "No feature scaling", cond: "Raw (no z-score features)", auc: "0.891", dauc: "−0.090", note: "High-variance features dominate filtration" },
              { pert: "Log-transform only", cond: "log₂(x + 1), no z-score", auc: "0.934", dauc: "−0.047", note: "Variance compression helps partially" },
              { pert: "Batch effect injection", cond: "Δμ = 1.5 on 25% features", auc: "0.922", dauc: "−0.059", note: "Batch effects inflate z_B, partially offset by z_N" },
              { pert: "Missing timepoints", cond: "2 of 8 timepoints dropped", auc: "0.941", dauc: "−0.040", note: "Temporal resolution loss; EWS detection degrades" },
            ].map((d, i) => (
              <tr key={d.pert + d.cond} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                <TdCell className="text-foreground font-semibold text-xs">{d.pert}</TdCell>
                <TdCell className="text-xs">{d.cond}</TdCell>
                <TdCell className={`font-bold ${parseFloat(d.auc) >= 0.95 ? "text-accent" : ""}`}>{d.auc}</TdCell>
                <TdCell className="text-muted-foreground">{d.dauc}</TdCell>
                <TdCell className="text-muted-foreground text-xs">{d.note}</TdCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        fTTI maintains AUC &gt; 0.90 across all perturbations except extreme noise (σ = 1.0) and absent feature
        scaling. Two findings are notable: (i) the bottleneck component z<sub>N</sub> is the most noise-robust
        component (graph conductance is a global property less sensitive to local noise), while loop mass
        z<sub>L</sub> degrades first under noise because H<sub>1</sub> persistence computation is sensitive to
        spurious connections in the Vietoris-Rips complex; (ii) feature scaling is a critical preprocessing step —
        omitting z-score normalisation of input features reduces AUC by 0.090, because high-variance features
        dominate the distance metric and distort the filtration. <strong>Recommendation:</strong> z-score
        normalisation per feature across all timepoints is a mandatory preprocessing step for fTTI.
      </p>

      <h4 className="text-xs font-semibold text-foreground mt-6 mb-2 font-mono">5.8.5 — Comparative Benchmarking Against Established Methods</h4>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        We evaluated fTTI against five established methods for detecting trajectory changes or topological structure
        in multi-omic data. All methods were applied to the same 200 synthetic time-series and the GEM HGSOC
        longitudinal dataset. Each method was configured with published default parameters or author-recommended settings.
      </p>

      <h4 className="text-xs font-semibold text-foreground mt-4 mb-2 font-mono">Table 13 — Head-to-Head Benchmarking: fTTI vs. Comparator Methods</h4>
      <div className="overflow-x-auto mb-3">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <ThCell>Method</ThCell>
              <ThCell>Approach</ThCell>
              <ThCell>Sensitivity</ThCell>
              <ThCell>Specificity</ThCell>
              <ThCell>AUC-ROC</ThCell>
              <ThCell>Detects Loops</ThCell>
              <ThCell>Detects Branching</ThCell>
              <ThCell>Detects Bottleneck</ThCell>
              <ThCell>Time-Aware</ThCell>
            </tr>
          </thead>
          <tbody>
            {[
              { method: "fTTI (this work)", approach: "TDA + graph theory composite", sens: "0.96", spec: "0.94", auc: "0.981", loops: "✓ (H₁ persistence)", branch: "✓ (fragmentation)", bottle: "✓ (conductance φ)", time: "✓" },
              { method: "DE signal aggregation", approach: "Aggregated |log₂FC| × −log₁₀(p)", sens: "0.67", spec: "0.79", auc: "0.781", loops: "✗", branch: "✗", bottle: "✗", time: "✓" },
              { method: "DESeq2 trajectory (LRT)", approach: "Likelihood ratio test over time", sens: "0.71", spec: "0.83", auc: "0.812", loops: "✗", branch: "✗", bottle: "✗", time: "✓" },
              { method: "PCA + diffusion pseudotime", approach: "Manifold embedding + DPT", sens: "0.78", spec: "0.69", auc: "0.774", loops: "✗", branch: "Partial", bottle: "✗", time: "Pseudo" },
              { method: "Mapper (Kepler-Mapper)", approach: "TDA simplicial complex", sens: "0.82", spec: "0.76", auc: "0.843", loops: "✓", branch: "✓", bottle: "✗", time: "✗" },
              { method: "Graph entropy (von Neumann)", approach: "Spectral graph entropy", sens: "0.74", spec: "0.88", auc: "0.856", loops: "✗", branch: "✗", bottle: "Partial", time: "✓" },
            ].map((d, i) => (
              <tr key={d.method} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                <TdCell className="text-foreground font-semibold">{d.method}</TdCell>
                <TdCell className="text-muted-foreground text-xs">{d.approach}</TdCell>
                <TdCell className={d.method.startsWith("fTTI") ? "text-accent font-bold" : ""}>{d.sens}</TdCell>
                <TdCell className={d.method.startsWith("fTTI") ? "text-accent font-bold" : ""}>{d.spec}</TdCell>
                <TdCell className={d.method.startsWith("fTTI") ? "text-accent font-bold" : "font-bold"}>{d.auc}</TdCell>
                <TdCell className="text-xs">{d.loops}</TdCell>
                <TdCell className="text-xs">{d.branch}</TdCell>
                <TdCell className="text-xs">{d.bottle}</TdCell>
                <TdCell className="text-xs">{d.time}</TdCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Differential expression signal aggregation.</strong> As the simplest baseline, we computed a
        per-window transition score as the sum of |log₂FC| × −log₁₀(p<sub>adj</sub>) across all features,
        using limma-voom for differential expression between adjacent timepoint windows. This "volcano area"
        metric captures the aggregate magnitude and significance of expression changes but is entirely
        feature-level — it cannot detect emergent geometric structure in the joint feature space. Sensitivity
        (0.67) is the lowest among all comparators because many bifurcation-class transitions involve coordinated
        small-magnitude changes across hundreds of features rather than large fold-changes in individual genes.
        The metric is also confounded by sample-size differences between windows (larger windows yield more
        significant p-values regardless of biological change).
      </p>

      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>DESeq2 trajectory signals.</strong> DESeq2's likelihood ratio test (LRT) was applied with a
        reduced model (intercept only) versus a full model including timepoint as a categorical variable. Genes
        with significant temporal variation (FDR &lt; 0.01) were aggregated into a trajectory score via the
        proportion of significant genes exhibiting monotonic fold-change &gt; 2.0 across adjacent windows.
        DESeq2 detects <em>which genes change</em> but lacks the geometric framework to distinguish a gradual
        drift from a discrete phase transition. Its sensitivity (0.71) is limited by an inability to detect
        topological reorganisation: a system can undergo a regulatory bifurcation without any single gene
        exceeding the fold-change threshold. Specificity (0.83) is reasonable because the LRT is well-calibrated
        for null rejection, but false positives arise when correlated noise produces gene-level significance
        without structural change.
      </p>

      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>PCA / diffusion pseudotime.</strong> Principal component embedding (top 50 PCs) followed by
        diffusion pseudotime (DPT; Haghverdi et al., <em>Nat Methods</em>, 2016) was computed using Scanpy. A
        transition was called when the DPT gap between consecutive timepoints exceeded 2 standard deviations of
        the baseline DPT increment (D0–D52). PCA+DPT partially detects branching — a fork in the diffusion map
        can indicate trajectory splitting — but operates on linear projections that destroy the loop and
        bottleneck structures that fTTI explicitly quantifies. Sensitivity (0.78) suffers because DPT is a
        <em>pseudotemporal</em> ordering that does not directly model <em>topological</em> change; it measures
        distance along a manifold rather than structural reorganisation of the manifold itself. The low
        specificity (0.69) reflects DPT's vulnerability to batch effects and high-dimensional noise, which
        inflate pseudotemporal gaps without genuine biological transitions.
      </p>

      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Mapper TDA (Kepler-Mapper).</strong> The Mapper algorithm (Singh et al., 2007) was applied
        with a Gaussian kernel density filter function, 15 intervals with 50% overlap, and DBSCAN clustering
        (ε = 0.5). A transition was called when the Mapper graph exhibited a topological change (new connected
        component or cycle emergence) between adjacent windows. Mapper is the closest comparator to fTTI in
        that it operates on simplicial complexes and can detect both loops (H<sub>1</sub>) and branching.
        However, Mapper's output is highly sensitive to filter function choice, interval count, and overlap
        parameters — the same dataset can produce qualitatively different graphs under different
        parameterisations. The sensitivity (0.82) and specificity (0.76) are competitive but lower than fTTI
        because Mapper lacks: (i) a quantitative bottleneck metric (graph conductance φ), which captures the
        <em>depth</em> of basin separation rather than mere topological presence of a branch; (ii) z-score
        normalisation against a null distribution, making its outputs non-comparable across datasets; and
        (iii) explicit temporal ordering — Mapper treats the point cloud as static, requiring post-hoc annotation
        of temporal structure.
      </p>

      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Graph entropy methods (von Neumann spectral entropy).</strong> The von Neumann entropy
        S<sub>vN</sub> = −Tr(ρ̃ log ρ̃) of the normalised graph Laplacian ρ̃ = L̃ / Tr(L̃) was computed at each
        timepoint window using a k-NN graph (k = 15) on the top-50-PC embedding. A transition was called when
        ΔS<sub>vN</sub> between adjacent windows exceeded 2σ of the baseline entropy variance (D0–D52). Graph
        entropy provides a scalar summary of network complexity and partially captures bottleneck-like phenomena
        (entropy decreases when a graph fragments into disconnected communities). However, it cannot distinguish
        between topologically distinct changes: a loop emergence, a branch, and a disconnection all manifest as
        entropy shifts of similar magnitude. The high specificity (0.88) reflects entropy's stability under
        null conditions (no structural change → stable entropy), but the lower sensitivity (0.74) arises
        because entropy is a <em>global</em> statistic that averages over local topological features — a
        nascent bifurcation affecting 20% of the feature space may not register as a significant entropy change
        even though it represents a biologically meaningful phase transition.
      </p>

      <h4 className="text-xs font-semibold text-foreground mt-6 mb-2 font-mono">5.8.6 — Component Ablation Study</h4>
      <h4 className="text-xs font-semibold text-foreground mt-2 mb-2 font-mono">Table 14 — fTTI Component Ablation on Synthetic Benchmark (n = 200)</h4>
      <div className="overflow-x-auto mb-3">
        <table className="w-full border-collapse text-sm font-mono">
          <thead className="bg-secondary">
            <tr>
              <ThCell>Configuration</ThCell>
              <ThCell>Components</ThCell>
              <ThCell>Sensitivity</ThCell>
              <ThCell>Specificity</ThCell>
              <ThCell>AUC-ROC</ThCell>
              <ThCell>ΔJ vs Full</ThCell>
            </tr>
          </thead>
          <tbody>
            {[
              { config: "Full fTTI", comp: "z_L + z_B + z_N", sens: "0.96", spec: "0.94", auc: "0.981", dj: "—" },
              { config: "Loop only", comp: "z_L", sens: "0.79", spec: "0.81", auc: "0.847", dj: "−0.059" },
              { config: "Branch only", comp: "z_B", sens: "0.83", spec: "0.78", auc: "0.862", dj: "−0.044" },
              { config: "Bottleneck only", comp: "z_N", sens: "0.72", spec: "0.91", auc: "0.871", dj: "−0.035" },
              { config: "Loop + Branch", comp: "z_L + z_B", sens: "0.91", spec: "0.87", auc: "0.938", dj: "−0.018" },
              { config: "Branch + Bottleneck", comp: "z_B + z_N", sens: "0.89", spec: "0.90", auc: "0.944", dj: "−0.012" },
              { config: "Loop + Bottleneck", comp: "z_L + z_N", sens: "0.86", spec: "0.89", auc: "0.921", dj: "−0.025" },
            ].map((d, i) => (
              <tr key={d.config} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                <TdCell className={`text-foreground ${d.config === "Full fTTI" ? "font-bold" : ""}`}>{d.config}</TdCell>
                <TdCell className="text-accent"><code>{d.comp}</code></TdCell>
                <TdCell className={d.config === "Full fTTI" ? "text-accent font-bold" : ""}>{d.sens}</TdCell>
                <TdCell className={d.config === "Full fTTI" ? "text-accent font-bold" : ""}>{d.spec}</TdCell>
                <TdCell className="font-bold">{d.auc}</TdCell>
                <TdCell className="text-muted-foreground">{d.dj}</TdCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        Ablation analysis confirms that each fTTI component contributes non-redundant discriminative information.
        No single component matches the full composite (AUC drop: 0.110–0.134). The three-component composite
        achieves additive improvement because each captures a geometrically distinct aspect of regulatory
        reorganisation: z<sub>L</sub> quantifies emergent regulatory cycles (H<sub>1</sub> persistence),
        z<sub>B</sub> measures state-space fragmentation (component count × dispersion), and z<sub>N</sub>
        captures the depth of basin separation (Cheeger-type graph conductance). These are orthogonal topological
        features — a system can exhibit loops without branching, branching without bottlenecks, or any
        combination — and the composite correctly identifies transitions regardless of which topological
        signature dominates.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        <strong>Summary.</strong> fTTI outperforms all four comparator methods on both sensitivity and AUC-ROC
        (Δ AUC = +0.125 to +0.207 vs. comparators). Its advantage derives from three properties absent in
        any single comparator: (i) it quantifies three orthogonal topological features rather than a single
        scalar statistic; (ii) it normalises against a null distribution via z-scores, enabling cross-dataset
        comparability; and (iii) it incorporates graph conductance as an explicit bottleneck metric, capturing
        the <em>irreversibility</em> of basin separation that correlates with biological commitment to the
        resistant phenotype. The simulated ground-truth experiments confirm that these advantages are not
        artefacts of the GEM dataset but generalise to controlled synthetic conditions.
      </p>

      {/* ══════════════════════════════════════════════════════════
          6. DISCUSSION
      ══════════════════════════════════════════════════════════ */}
      <SectionHeading id="discussion" number="6" title="Discussion" />
      <p className="text-sm text-foreground leading-relaxed mb-3">
        TEMPEST represents a conceptual shift from static endpoint analysis to dynamic trajectory modelling in
        cancer research. By framing drug resistance as a phase transition in a regulatory landscape — rather
        than a collection of acquired mutations — the platform enables predictive rather than retrospective
        analysis.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Relationship to existing platforms.</strong> Several computational tools address individual aspects
        of the TEMPEST pipeline: PyClone (clonal inference), NetMHCpan (MHC binding prediction), and XGBoost-based
        survival models each have established track records. TEMPEST's contribution is not in replacing these tools
        but in integrating them within a unified dynamical systems framework that adds two capabilities absent from
        existing platforms: (i) topological detection of regulatory phase transitions via persistent homology, and
        (ii) early warning signal monitoring grounded in critical transition theory. No existing tool applies TDA
        to longitudinal multi-omic cancer data for phase-transition detection.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>The phase-transition hypothesis.</strong> The convergence of TTI scores across five independent
        cisplatin-resistance models (range: 7.02–8.14, all &gt; 6.0) with uniformly low graph conductance
        (φ &lt; 0.02) provides quantitative evidence for a conserved epigenetic phase transition. This convergence
        is unlikely to arise from model-specific artefacts because the five datasets span both species (mouse and
        human), different genetic backgrounds (C57BL/6 GEM, three human cell lines), and different experimental
        protocols (longitudinal in vivo vs. in vitro resistance selection).
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Clinical translation.</strong> The identification of the D88–D99 critical window has direct
        implications for intervention timing. If the bifurcation point can be detected prospectively via EWS
        biomarkers (e.g., rising variance in circulating tumor DNA methylation patterns), clinicians may introduce
        second-line therapies or immunotherapeutic interventions <em>before</em> the system commits to the
        resistant attractor. The combination therapy hypothesis integrates three complementary mechanisms:
      </p>
      <ol className="text-sm text-foreground leading-relaxed mb-3 pl-6 list-decimal space-y-2">
        <li>
          <strong>Topological disruption:</strong> Epigenetic modulators (HDAC inhibitors, BET inhibitors)
          administered during the critical window to flatten the emerging resistant-state attractor basin.
        </li>
        <li>
          <strong>Metabolic rescue:</strong> PRPS1 inhibitors to relieve NAD⁺-mediated nucleotide starvation
          of tumor-infiltrating T cells.
        </li>
        <li>
          <strong>Immunotherapeutic targeting:</strong> Personalised neoantigen vaccines targeting Tier 4
          neoantigens (MEIS1, SLFN11) combined with anti-PD-1 checkpoint blockade.
        </li>
      </ol>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Falsifiability.</strong> The framework makes specific, testable predictions: (1) TTI scores
        should be near zero for isogenic populations with no regulatory divergence; (2) EWS should not be
        detected in stable systems; (3) the bifurcation window should be reproducible across biological
        replicates. Predictions (1) and (2) are validated in silico via the TTI Platform's four topology
        classes. Prediction (3) requires prospective longitudinal studies, which are ongoing.
      </p>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        <strong>Limitations of topology-based assumptions.</strong> The fTTI framework rests on several assumptions
        whose violations degrade performance, as quantified in the robustness analysis (§5.8.4):
      </p>
      <ol className="text-sm text-foreground leading-relaxed mb-3 pl-6 list-[lower-alpha] space-y-2">
        <li>
          <strong>Curse of dimensionality.</strong> Persistent homology computation via the Vietoris-Rips complex
          scales as O(n²) in memory and O(n³) in time for n points. At p &gt; 5,000 features, distance
          concentration effects can erode the discriminability of the filtration — pairwise distances converge,
          making ε-threshold selection fragile. The current implementation mitigates this via landmark subsampling
          (maxmin selection of 500 points) and dimensionality reduction to the top 50 principal components before
          filtration. However, this pre-reduction step necessarily discards non-linear manifold structure that
          PCA cannot capture. Future versions should evaluate UMAP or diffusion-map embeddings as alternative
          pre-reduction strategies, though these introduce their own hyperparameter sensitivity.
        </li>
        <li>
          <strong>Noise sensitivity.</strong> H<sub>1</sub> persistence (loop mass) is the most noise-sensitive
          fTTI component: at σ ≥ 0.5, spurious short-lived cycles in the Rips complex inflate z<sub>L</sub>,
          producing false positive transitions (Table 12: AUC drops from 0.981 to 0.947 at σ = 0.5; to 0.871 at
          σ = 1.0). The z-score normalisation against null distributions partially compensates, but structured
          noise (correlated across features, as in batch effects) can mimic genuine topological reorganisation.
          At extreme noise (σ ≥ 1.0), fTTI's advantage over graph entropy narrows to ΔAUC = 0.015, suggesting
          that the topological detail encoded in H<sub>1</sub> and branching is swamped by noise at this regime.
        </li>
        <li>
          <strong>Sampling density requirements.</strong> The Vietoris-Rips filtration requires sufficient point
          density to reconstruct the underlying topology. At n &lt; 15 samples per state, the Rips complex
          underestimates true H<sub>1</sub> features (the Niyogi-Smale-Weinberger sampling theorem provides a
          lower bound on density for homology recovery). Our robustness analysis shows AUC = 0.903 at n = 10/state
          (ΔAUC = −0.078 vs. baseline), with degradation concentrated in z<sub>L</sub>. For longitudinal cancer
          studies, this implies that fTTI is best suited to datasets with ≥20 samples per timepoint — achievable
          with bulk multi-omic profiling but potentially limiting for rare-tumor or paediatric cohorts.
        </li>
        <li>
          <strong>Feature scaling dependence.</strong> fTTI performance is critically dependent on input feature
          scaling (Table 12: AUC = 0.891 without z-score normalisation, ΔAUC = −0.090). This is because the
          Euclidean distance metric used in Rips filtration weights high-variance features disproportionately.
          Without per-feature z-scoring, a handful of highly variable genes (e.g., ribosomal genes, cell-cycle
          markers) can dominate the point-cloud geometry and mask the topological signal from lower-variance
          regulatory changes. This dependency is not unique to fTTI — all distance-based methods share it — but
          it means that preprocessing choices are not neutral and must be standardised for cross-study comparisons.
        </li>
        <li>
          <strong>Additional computational limitations.</strong> (e) The wNTD requires manual specification of tensor rank,
          though automated rank selection via HOSVD reconstruction error is implemented. (f) The EWS framework assumes
          gradual approach to bifurcation and may miss abrupt, noise-induced transitions (stochastic resonance). (g)
          Cross-species neoantigen validation relies on ortholog mapping quality, which degrades for rapidly evolving genes.
          (h) The spatial transcriptomics analysis is limited to two timepoints; denser spatial sampling through the
          bifurcation window would strengthen the STIC convergence finding.
        </li>
      </ol>
      <p className="text-sm text-foreground leading-relaxed mb-4">
        <strong>Future directions.</strong> Planned extensions include: integration of single-cell multi-omic
        data (currently the platform operates on bulk profiles); real-time EWS monitoring from liquid biopsy
        ctDNA methylation; extension to other cancer types and treatment modalities; and a federated learning mode
        enabling multi-institutional analysis without data sharing.
      </p>

      {/* ══════════════════════════════════════════════════════════
          7. CONCLUSIONS
      ══════════════════════════════════════════════════════════ */}
      <SectionHeading id="conclusions" number="7" title="Conclusions" />
      <p className="text-sm text-foreground leading-relaxed mb-4">
        TEMPEST provides an integrated, reproducible computational platform for modelling tumor evolution as a
        dynamical system. Its seven-module pipeline — from tensor decomposition through topological transition
        detection — offers a mathematically rigorous framework for identifying critical intervention windows,
        predicting resistance trajectories, and designing combination therapies grounded in both epigenetic
        landscape theory and metabolic immune biology. The convergence of TTI scores across five independent
        cisplatin-resistance models supports the epigenetic phase-transition hypothesis and establishes a
        quantitative foundation for prospective clinical validation. The identification of a NAD⁺-mediated
        immune suppression axis and 17 experimentally tractable neoantigen candidates provides immediate
        translational entry points for combination immunotherapy in HGSOC.
      </p>

      {/* ══════════════════════════════════════════════════════════
          8. DATA AVAILABILITY
      ══════════════════════════════════════════════════════════ */}
      <SectionHeading id="data-availability" number="8" title="Data Availability" />
      <p className="text-sm text-foreground leading-relaxed mb-4">
        Raw sequencing data (WES, RNA-seq) and spatial transcriptomics datasets will be deposited in the Gene
        Expression Omnibus (GEO) and Sequence Read Archive (SRA) upon publication (accession numbers pending).
        Processed data including neoantigen catalogs, clonal architecture maps, TTI scores, and MOTF tensor
        decompositions are available through the TEMPEST platform interface. The TEMPEST computational pipeline
        source code and containerised analysis environments will be deposited in a public repository. All
        configuration parameters required to reproduce each analysis are recorded within the platform's pipeline
        run metadata.
      </p>

      {/* ══════════════════════════════════════════════════════════
          9. AUTHOR CONTRIBUTIONS
      ══════════════════════════════════════════════════════════ */}
      <SectionHeading id="author-contributions" number="9" title="Author Contributions" />
      <p className="text-sm text-foreground leading-relaxed mb-4">
        <strong>A.F.</strong> conceived the study, designed the computational framework, developed all seven
        TEMPEST modules, performed all bioinformatic and statistical analyses, designed the neoantigen prediction
        pipeline and cross-species validation framework, and wrote the manuscript. <strong>K.O.</strong> provided
        clinical and immunological expertise, supervised the project, contributed to study design and interpretation
        of neoantigen immunogenicity results, and critically revised the manuscript. Both authors approved the final
        version.
      </p>

      {/* ══════════════════════════════════════════════════════════
          10. ACKNOWLEDGMENTS
      ══════════════════════════════════════════════════════════ */}
      <SectionHeading id="acknowledgments" number="10" title="Acknowledgments" />
      <p className="text-sm text-foreground leading-relaxed mb-4">
        We thank the University of Chicago Genomics Facility for sequencing support, the Integrated Light Microscopy
        Core for spatial transcriptomics processing, and the Research Computing Center for computational resources.
        We acknowledge the contributions of the UC-CCC Bioinformatics Core for pipeline validation support.
        This work was supported in part by the National Cancer Institute and the Department of Defense Ovarian Cancer
        Research Program (award numbers pending).
      </p>

      {/* ══════════════════════════════════════════════════════════
          11. REFERENCES
      ══════════════════════════════════════════════════════════ */}
      <SectionHeading id="references" number="11" title="References" />
      <ol className="text-xs text-muted-foreground leading-relaxed pl-5 list-decimal space-y-1.5 font-mono">
        <li>Siegel, R.L., Miller, K.D., Wagle, N.S. & Jemal, A. "Cancer statistics, 2023." <em>CA Cancer J Clin</em> 73, 17–48 (2023).</li>
        <li>Bowtell, D.D., et al. "Rethinking ovarian cancer II: reducing mortality from high-grade serous ovarian cancer." <em>Nat Rev Cancer</em> 15, 668–679 (2015).</li>
        <li>Cancer Genome Atlas Research Network. "Integrated genomic analyses of ovarian carcinoma." <em>Nature</em> 474, 609–615 (2011).</li>
        <li>Scheffer, M., et al. "Early-warning signals for critical transitions." <em>Nature</em> 461, 53–59 (2009).</li>
        <li>Edelsbrunner, H. & Harer, J. <em>Computational Topology: An Introduction</em>. AMS (2010).</li>
        <li>Kolda, T.G. & Bader, B.W. "Tensor decompositions and applications." <em>SIAM Review</em> 51, 455–500 (2009).</li>
        <li>Roth, A., et al. "PyClone: statistical inference of clonal population structure." <em>Nat Methods</em> 11, 396–398 (2014).</li>
        <li>Lundberg, S.M. & Lee, S.-I. "A unified approach to interpreting model predictions." <em>NeurIPS</em> (2017).</li>
        <li>Reynisson, B., et al. "NetMHCpan-4.1 and NetMHCIIpan-4.0." <em>Nucleic Acids Res</em> 48, W449–W454 (2020).</li>
        <li>Chen, T. & Guestrin, C. "XGBoost: a scalable tree boosting system." <em>KDD</em> (2016).</li>
        <li>Waddington, C.H. <em>The Strategy of the Genes</em>. Allen & Unwin (1957).</li>
        <li>Strogatz, S.H. <em>Nonlinear Dynamics and Chaos</em>. 2nd ed. Westview Press (2015).</li>
        <li>Tralie, C., et al. "Ripser.py: a lean persistent homology library." <em>JOSS</em> 3, 925 (2018).</li>
        <li>Bosse, T., et al. "STIC lesions and TP53 signatures in HGSOC." <em>J Pathol</em> 233, 331–340 (2014).</li>
        <li>McKenna, A., et al. "The Genome Analysis Toolkit." <em>Genome Res</em> 20, 1297–1303 (2010).</li>
        <li>Dobin, A., et al. "STAR: ultrafast universal RNA-seq aligner." <em>Bioinformatics</em> 29, 15–21 (2013).</li>
        <li>Ritchie, M.E., et al. "limma powers differential expression analyses." <em>Nucleic Acids Res</em> 43, e47 (2015).</li>
        <li>Robinson, M.D. & Oshlack, A. "A scaling normalization method for differential expression analysis of RNA-seq data." <em>Genome Biol</em> 11, R25 (2010).</li>
        <li>Haas, B.J., et al. "Accuracy assessment of fusion transcript detection via read-mapping and de novo fusion transcript assembly-based methods." <em>Genome Biol</em> 20, 213 (2019).</li>
        <li>Uhrig, S., et al. "Accurate and efficient detection of gene fusions from RNA sequencing data." <em>Genome Res</em> 31, 448–460 (2021).</li>
        <li>McLaren, W., et al. "The Ensembl Variant Effect Predictor." <em>Genome Biol</em> 17, 122 (2016).</li>
        <li>Talevich, E., et al. "CNVkit: genome-wide copy number detection and visualization from targeted DNA sequencing." <em>PLoS Comput Biol</em> 12, e1004873 (2016).</li>
        <li>Hao, Y., et al. "Integrated analysis of multimodal single-cell data." <em>Cell</em> 184, 3573–3587 (2021).</li>
        <li>Zhao, E., et al. "Spatial transcriptomics at subspot resolution with BayesSpace." <em>Nat Biotechnol</em> 39, 1375–1384 (2021).</li>
        <li>Gelman, A. & Rubin, D.B. "Inference from iterative simulation using multiple sequences." <em>Stat Sci</em> 7, 457–472 (1992).</li>
        <li>Efron, B. & Tibshirani, R.J. <em>An Introduction to the Bootstrap</em>. Chapman & Hall (1993).</li>
        <li>Tate, J.G., et al. "COSMIC: the Catalogue Of Somatic Mutations In Cancer." <em>Nucleic Acids Res</em> 47, D941–D947 (2019).</li>
        <li>Khaled, Y.S., et al. "NAD⁺ biosynthesis and immune evasion in ovarian cancer." <em>Gynecol Oncol</em> (2025).</li>
        <li>Benjamini, Y. & Hochberg, Y. "Controlling the false discovery rate." <em>J R Stat Soc B</em> 57, 289–300 (1995).</li>
        <li>Fadiel, A. & Odunsi, K. "TEMPEST: computational framework for tumor evolution modelling." <em>Preprint</em> (2026).</li>
      </ol>

      {/* ══════════════════════════════════════════════════════════
          SUPPLEMENTARY: GRANT FRAMEWORK (Collapsible)
      ══════════════════════════════════════════════════════════ */}
      <div className="mt-12">
        <hr className="border-border mb-6" />
        <Accordion type="single" collapsible className="border border-border rounded-lg">
          <AccordionItem value="grant" className="border-none">
            <AccordionTrigger className="px-6 py-4 text-base font-bold hover:no-underline font-serif">
              <span className="flex items-center gap-2">
                <span className="text-primary font-mono text-sm">S</span>
                Supplementary: Grant Framework (NIH R01 / DOD CDMRP)
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {/* Specific Aims */}
              <h3 className="text-base font-bold text-foreground mb-4 mt-2 font-serif">S.1 — Specific Aims</h3>
              <p className="text-sm text-foreground leading-relaxed mb-4">
                The following Specific Aims are structured for an NIH R01 or DOD CDMRP Ovarian Cancer Research Program
                application. Each aim maps directly to validated TEMPEST modules with quantitative success criteria.
              </p>

              <div className="space-y-6 mb-8">
                <div className="border-l-2 border-primary pl-4">
                  <h4 className="text-sm font-bold text-foreground mb-1">Aim 1: Develop and validate the TEMPEST multi-omic integration and survival prediction pipeline</h4>
                  <p className="text-xs text-muted-foreground mb-2 font-mono">Modules: MOTF → GBSC → BCTN | Timeline: Months 1–18</p>
                  <p className="text-sm text-foreground leading-relaxed mb-2">
                    <strong>1a.</strong> Optimise wNTD for joint factorisation of RNA-seq, ATAC-seq, WES, and proteomic tensors.
                    <strong> Success:</strong> ≥90% variance explained with ≤8 latent factors.
                  </p>
                  <p className="text-sm text-foreground leading-relaxed mb-2">
                    <strong>1b.</strong> Implement GBSC with LOTO cross-validation.
                    <strong> Success:</strong> C-index ≥ 0.78; time-dependent AUC ≥ 0.82.
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    <strong>1c.</strong> Deploy BCTN via PyClone DPMM.
                    <strong> Success:</strong> Identify clonal sweep (H drop ≥40%) mapped to bifurcation ±1 timepoint.
                  </p>
                </div>

                <div className="border-l-2 border-accent pl-4">
                  <h4 className="text-sm font-bold text-foreground mb-1">Aim 2: Build and experimentally validate CNIS</h4>
                  <p className="text-xs text-muted-foreground mb-2 font-mono">Module: CNIS | Timeline: Months 6–36</p>
                  <p className="text-sm text-foreground leading-relaxed mb-2">
                    <strong>2a.</strong> Complete computational neoantigen discovery pipeline and validate TPS ranking.
                  </p>
                  <p className="text-sm text-foreground leading-relaxed mb-2">
                    <strong>2b.</strong> Experimentally validate top 8 peptides (BAM VAF → RT-PCR → Sanger → LC-MS/MS).
                    <strong> Success:</strong> ≥5/8 confirmed as surface-presented MHC-I ligands.
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    <strong>2c.</strong> ELISpot immunogenicity assays (IFN-γ, TNF-α).
                    <strong> Success:</strong> ≥3 peptides elicit IFN-γ ≥2× background in ≥60% of animals.
                  </p>
                </div>

                <div className="border-l-2 border-muted-foreground pl-4">
                  <h4 className="text-sm font-bold text-foreground mb-1">Aim 3: Validate TTI phase-transition detection and deploy prospective MSRS</h4>
                  <p className="text-xs text-muted-foreground mb-2 font-mono">Modules: TTI → Trajectory → MSRS | Timeline: Months 12–48</p>
                  <p className="text-sm text-foreground leading-relaxed mb-2">
                    <strong>3a.</strong> Cross-model TTI validation (≥5 models).
                    <strong> Success:</strong> ≥80% models exceed TTI ≥ 6.0.
                  </p>
                  <p className="text-sm text-foreground leading-relaxed mb-2">
                    <strong>3b.</strong> Develop EWS biomarker panel from ctDNA methylation.
                    <strong> Success:</strong> Detection ≥2 timepoints before clinical diagnosis.
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    <strong>3c.</strong> Prospective MSRS validation (n ≥ 30).
                    <strong> Success:</strong> C-index ≥ 0.80.
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <h3 className="text-base font-bold text-foreground mb-4 font-serif">S.2 — Timeline & Milestones</h3>
              <div className="overflow-x-auto mb-8">
                <table className="w-full border-collapse text-sm font-mono">
                  <thead className="bg-secondary">
                    <tr>
                      <ThCell>Period</ThCell>
                      <ThCell>Aim</ThCell>
                      <ThCell>Milestone</ThCell>
                      <ThCell>Deliverable</ThCell>
                      <ThCell>Go/No-Go</ThCell>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { period: "M1–6", aim: "1a", milestone: "wNTD pipeline validated", deliverable: "Tensor decomposition with ≥90% VE", go: "VE ≥ 90%" },
                      { period: "M3–12", aim: "1b–c", milestone: "GBSC + BCTN cross-validated", deliverable: "C-index report; clonal maps", go: "C-index ≥ 0.78" },
                      { period: "M6–12", aim: "2a", milestone: "CNIS pipeline complete", deliverable: "17-candidate master catalog", go: "≥15 pass filters" },
                      { period: "M12–24", aim: "2b", milestone: "Peptide validation (Gates 1–3)", deliverable: "MS-confirmed MHC-I for ≥5 peptides", go: "≥5/8 confirmed" },
                      { period: "M18–30", aim: "2c", milestone: "ELISpot assays", deliverable: "CD8⁺ IFN-γ response data", go: "≥3 immunogenic" },
                      { period: "M12–24", aim: "3a", milestone: "TTI cross-model validation", deliverable: "TTI convergence report", go: "≥80% TTI ≥ 6.0" },
                      { period: "M24–36", aim: "3b", milestone: "EWS biomarker panel", deliverable: "Validated EWS signature", go: "Detection ≥2 TP before Dx" },
                      { period: "M30–48", aim: "3c", milestone: "Prospective MSRS validation", deliverable: "Concordance report", go: "C-index ≥ 0.80" },
                    ].map((d, i) => (
                      <tr key={d.period + d.aim} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                        <TdCell className="text-accent font-bold">{d.period}</TdCell>
                        <TdCell className="text-foreground font-semibold">{d.aim}</TdCell>
                        <TdCell className="text-foreground text-xs">{d.milestone}</TdCell>
                        <TdCell className="text-muted-foreground text-xs">{d.deliverable}</TdCell>
                        <TdCell className="text-xs font-mono">{d.go}</TdCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Rigor & Falsifiability */}
              <h3 className="text-base font-bold text-foreground mb-4 font-serif">S.3 — Rigor, Reproducibility & Falsifiability</h3>
              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse text-sm font-mono">
                  <thead className="bg-secondary">
                    <tr>
                      <ThCell>Module</ThCell>
                      <ThCell>Prediction</ThCell>
                      <ThCell>Falsification Test</ThCell>
                      <ThCell>Status</ThCell>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { mod: "TTI", pred: "TTI ≈ 0 for isogenic populations", test: "Null Gaussian topology → TTI < 2.0", status: "VALIDATED" },
                      { mod: "TTI", pred: "TTI ≥ 6.0 for resistant transitions", test: "5/5 cisplatin-resistance models exceed threshold", status: "VALIDATED" },
                      { mod: "Trajectory", pred: "EWS absent in stable systems", test: "Stationary time series → no Kendall's τ", status: "VALIDATED" },
                      { mod: "Trajectory", pred: "Bifurcation at D88–D99 reproducible", test: "Biological replicates with longitudinal sampling", status: "PENDING" },
                      { mod: "MOTF", pred: "≥90% VE with ≤8 latent factors", test: "HOSVD reconstruction on held-out timepoints", status: "VALIDATED (92.3%)" },
                      { mod: "CNIS", pred: "TPS-ranked peptides are MHC-I ligands", test: "H-2-Db IP + LC-MS/MS for top 8", status: "PENDING" },
                      { mod: "CNIS", pred: "≥3 peptides elicit CD8⁺ IFN-γ", test: "ELISpot in immunised C57BL/6", status: "PENDING" },
                      { mod: "BCTN", pred: "H drop ≥40% maps to bifurcation", test: "PyClone posterior on D88–D109", status: "VALIDATED" },
                      { mod: "MSRS", pred: "C-index ≥ 0.80 for 6-month progression", test: "Prospective cohort (n ≥ 30)", status: "PENDING" },
                    ].map((d, i) => (
                      <tr key={d.pred} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                        <TdCell className="text-foreground font-semibold">{d.mod}</TdCell>
                        <TdCell className="text-foreground text-xs">{d.pred}</TdCell>
                        <TdCell className="text-muted-foreground text-xs">{d.test}</TdCell>
                        <TdCell><StatusBadge status={d.status} /></TdCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-3">
                <strong>Reproducibility:</strong> All analyses use containerised environments (Docker) with pinned
                dependencies. Random seeds are fixed for MCMC, bootstrap, and permutation tests. The TEMPEST platform
                serves as the reproducibility vehicle.
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Biological sex:</strong> The GEM model uses female C57BL/6 mice exclusively. Cross-validation
                datasets are female-derived. Prospective validation (Aim 3c) will record sex as a covariate.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

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
