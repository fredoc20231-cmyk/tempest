

# Plan: Add a Full Scientific Article Page to TEMPEST

## What We Are Building

A new **"Article"** page accessible from the sidebar that presents a comprehensive, journal-style manuscript describing the TEMPEST platform, its algorithms, and its application to cancer research. This will be a richly formatted, scrollable document styled like a scientific publication — not a generic "About" page.

## Architecture

- **New file**: `src/components/tempest/ArticlePanel.tsx` — a single, self-contained component rendering the full article with proper scientific formatting (abstract, sections, equations, figures/references to platform modules, author block, etc.)
- **Sidebar update**: Add an "Article" entry to the sidebar module list with a `BookOpen` icon
- **Routing update**: Wire `Index.tsx` to render `ArticlePanel` when `active === "article"`
- **Type update**: Extend the `Module` type union in `Sidebar.tsx` to include `"article"`

## Article Structure (Content Outline)

1. **Title & Authors** — "TEMPEST: A Multi-Omic Computational Platform for Predictive Tumor Evolution Modeling" — Fadiel, Odunsi et al., University of Chicago
2. **Abstract** — Platform summary, seven modules, key results
3. **Introduction** — Problem statement: why longitudinal multi-omic integration matters for ovarian cancer
4. **Platform Architecture** — Overview of the seven-module pipeline (MOTF → GBSC → BCTN → CNIS → MSRS → Trajectory → TTI), data flow diagram (ASCII)
5. **Algorithmic Framework** — Per-module technical descriptions:
   - MOTF: weighted NTD, Tikhonov regularization
   - GBSC: XGBoost, LOTO CV, SHAP
   - BCTN: Dirichlet Process Mixture, PyClone, MCMC
   - CNIS: NetMHCpan 4.1b, multi-modal filtering, tiered validation
   - MSRS: composite risk scoring, bootstrap CIs
   - Trajectory: dynamical systems, pitchfork bifurcation, Shannon entropy, EWS
   - TTI: persistent homology, graph conductance, fTTI composite
6. **NAD+ Metabolic Immune Suppression** — T cell arrest via PRPS1 inhibition, rescue strategies
7. **Results** — Key findings from the GEM model (D0–D122 staging, bifurcation at D88–99, neoantigen tiers)
8. **Clinical Implications** — Biomarker timing, immunotherapy design, combination therapy rationale
9. **Discussion** — Falsifiability, limitations, future directions
10. **References** — Cited manuscripts and frameworks

## Styling

- Uses existing Tailwind design tokens and `module-card` classes for consistency
- Serif-like headers via `font-serif` for academic feel, monospace for equations/data
- Internal navigation links that call `onNavigate()` to jump to referenced modules
- Collapsible sections for lengthy algorithm details using existing Accordion components
- Print-friendly layout (max-width constrained, clean typography)

## Technical Details

- No new dependencies needed
- No database changes
- No edge function changes
- Approximately 600–800 lines for the article component
- Uses `framer-motion` for entrance animations consistent with other panels
- Interactive: clicking module names navigates to the actual module

