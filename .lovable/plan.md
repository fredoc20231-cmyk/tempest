

# Plan: Generate Publication-Quality Figures and Tables

## What We're Building
A multi-page scientific PDF containing 6 figures and 4 tables for the TEMPEST manuscript, styled for journal submission (Nature Methods / Genome Biology quality). Output as a single downloadable PDF artifact.

## Design Philosophy: "Systematic Cartography"

A `.md` file will be generated capturing the visual language: clinical precision meets scientific illustration. Deep navy ink on clean white stock. Thin ruled lines, geometric nodes, directional arrows. IBM Plex Mono for labels, Instrument Sans for body, CrimsonPro for figure captions. Minimal palette: navy (#0b1826), gold (#c8973a), teal (#1da88a), rose (#b8364e), slate (#5a8099). Every element placed with diagrammatic rigor.

## Figures (Python/ReportLab + hand-drawn vector graphics)

| Figure | Approach |
|--------|----------|
| **Fig 1. Platform Architecture** | Box-and-arrow diagram: React → FastAPI → Celery/Redis → PostgreSQL/MinIO, with AI assistant and public-data connectors as side nodes. Drawn with ReportLab canvas primitives (rounded rects, arrows, labels). |
| **Fig 2. fTTI Workflow** | Linear pipeline schematic: Parental/Resistant matrices → kNN graph → Vietoris-Rips → H₀/H₁ computation → conductance → z-score → composite fTTI. Drawn as connected processing blocks with mathematical notation. |
| **Fig 3. Dashboard Panels** | Stylized schematic grid showing 6 module cards (MOTF, GBSC, BCTN, CNIS, MSRS, fTTI) with mini-chart icons and progress indicators. Abstract representation, not screenshot. |
| **Fig 4. MOTF Heatmap** | Synthetic heatmap grid (samples × factors) with color gradient showing early/transitional/advanced separation. Modality loading bars on the side. |
| **Fig 5. Clonal Dynamics** | Stacked area chart (6 timepoints, 4 clones) with Shannon entropy overlay line and uncertainty bands. Drawn with ReportLab path primitives. |
| **Fig 6. CNIS + fTTI** | Split panel: left = neoantigen ranking bar chart, right = topology signature comparison (parental vs resistant ATAC-seq). |

## Tables (ReportLab Table objects)

| Table | Content |
|-------|---------|
| **Table 1** | Platform stack: Frontend (React/Vite/Tailwind), Backend (FastAPI/Celery), Storage (PostgreSQL/MinIO/Redis), Visualization (Recharts/D3), Analytics (ttiEngine/PyClone/NetMHCpan) |
| **Table 2** | GBSC validation: 6 folds × (Macro-F1, Macro-AUC, Calibration) with mean±SD row |
| **Table 3** | Top 8 neoantigen candidates: Peptide, Gene, IC₅₀, Expression, Clonality, Stability, TPS |
| **Table 4** | fTTI scores: 5 models × (ΔF, ΔL, N, fTTI, p-value) |

## Technical Approach

1. Write a single Python script using **ReportLab** (canvas + platypus)
2. Use available fonts: IBM Plex Mono, Instrument Sans, CrimsonPro
3. All diagrams drawn programmatically with canvas primitives (no external images)
4. Output: single multi-page PDF to `/mnt/documents/tempest_figures_tables.pdf`
5. Design philosophy saved as `/mnt/documents/systematic_cartography.md`
6. QA: convert pages to JPEG, inspect each, fix issues

## Output Files
- `/mnt/documents/systematic_cartography.md` — design philosophy
- `/mnt/documents/tempest_figures_tables.pdf` — 10-page PDF (6 figures + 4 tables)

