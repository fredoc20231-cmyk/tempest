

# Plan: Rewrite Article Panel as Publication-Ready Manuscript

## Problem
The current Article panel mixes journal manuscript sections (1-8) with grant-framework sections (9-13), creating a structurally incoherent document. Several critical results sections are missing (spatial transcriptomics, mutational dynamics, clonal architecture, NAD+ experimental evidence). The references list is sparse (11 entries). For full rigor, the article needs standard journal structure, expanded results grounded in the validated data already embedded in the system prompt, and proper end matter.

## Restructured Outline

The article will follow standard computational biology journal format (e.g., *Nature Methods* / *Genome Biology*):

| Section | Content | Status |
|---------|---------|--------|
| Abstract | Existing — minor polish | Keep |
| 1. Introduction | Existing — expand with epidemiology + gap statement | Edit |
| 2. Platform Architecture | Existing pipeline diagram + module descriptions | Keep |
| 3. Methods | **NEW** — GEM model details, sequencing, bioinformatics pipeline, statistical framework | Add |
| 4. Algorithmic Framework | Existing accordion (MOTF through TTI) — keep as-is | Keep |
| 5. Results | Restructure into 7 subsections (see below) | Major edit |
| 6. Discussion | Existing + absorb Innovation content + comparative analysis | Edit |
| 7. Conclusions | Existing — minor polish | Keep |
| 8. Data Availability | **NEW** | Add |
| 9. Author Contributions | **NEW** | Add |
| 10. Acknowledgments | **NEW** | Add |
| 11. References | Expand from 11 to ~30 entries | Edit |
| Supplementary: Grant Framework | Move existing grant sections (Aims, Timeline, Rigor) into a collapsible accordion at the bottom | Reorganize |

### New/Expanded Results Subsections (Section 5)

- **5.1** GEM Model Longitudinal Staging (existing table — keep)
- **5.2** Mutational Dynamics Across Progression (**NEW** — variant counts, M:S ratios per timepoint, recurrently disrupted genes table)
- **5.3** Clonal Architecture Evolution (**NEW** — PyClone cluster descriptions, Shannon diversity trajectory, Cluster 0 vs Cluster 2 functional annotations)
- **5.4** Spatial Transcriptomics (**NEW** — 10x Visium D22-D116, FT-STIC boundary markers, D116 STIC=tumor finding)
- **5.5** TTI Cross-Model Validation (existing table — keep)
- **5.6** Neoantigen Master Catalog (existing 3 tables — keep)
- **5.7** NAD+ Immune Suppression Evidence (**NEW** — experimental findings table from Khaled et al., PRPS1 mechanism, clinical OC context)

### New Section 3: Methods

- **3.1** GEM Model and Tissue Collection (Trp53/Rb1/KrasG12D, Pax8-Cre, tamoxifen protocol, timepoints)
- **3.2** Sequencing and Data Processing (WES: GATK4 Mutect2, RNA-seq: STAR + limma-voom + TMM, Fusion: STAR-Fusion ∩ Arriba 2.5.1, Spatial: 10x Visium)
- **3.3** Neoantigen Prediction Pipeline (NetMHCpan 4.1b, H-2-Db/Kb, %Rank thresholds, TPS formula)
- **3.4** Statistical Framework (bootstrap n=1000, LOTO CV, permutation tests for TTI, MCMC 10K iterations for PyClone)

## Files Modified

| File | Change |
|------|--------|
| `src/components/tempest/ArticlePanel.tsx` | Full rewrite — restructure sections, add Methods, expand Results with 4 new subsections, expand References, add end matter, move grant sections to collapsible supplementary |

## Technical Notes

- Single file change (~1400 lines total, up from ~1037)
- No new dependencies — uses existing components (Accordion, Table, Equation, SectionHeading, ModuleLink)
- All data sourced from validated content already in the chat system prompt (neoantigen catalog, temporal framework, spatial transcriptomics findings, NAD+ mechanism, clonal architecture)
- No database or edge function changes required
- Grant sections preserved but reorganized as "Supplementary: Grant Framework" in a collapsible accordion at the end, maintaining the content for grant use while keeping the article structure clean

