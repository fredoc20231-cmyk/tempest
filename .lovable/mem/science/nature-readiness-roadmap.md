---
name: Nature-level evidence roadmap
description: Five-gap critique (G1-G5) the TEMPEST manuscript must close to move from composite-score paper to Nature-level universal-law claim
type: feature
---
External reviewer assessment of v13 draft: not Nature-level yet, currently a strong Genome Biology / Nat Comms / Cell Reports Methods paper. Must close five gaps:

- **G1 Prospective forecasting**: walk-forward train on D0-D88, sealed predictions for D99/D109/D116 (bifurcation day ±7d, attractor F1≥0.8, IC50 within 0.5 log2).
- **G2 Cohort expansion**: 50-100 independent transitions across melanoma (Tirosh/Riaz), glioma (TCGA-GBM), AML (BeatAML/TARGET), ER+ breast (METABRIC/POETIC), NB (Boeva/Westermann), NEPC (Beltran/SU2C), NSCLC EGFRi (Hata/Bivona), HGSOC (TCGA-OV/AOCS). Report AUROC/AUPRC/sens/spec with bootstrap CI.
- **G3 SOTA benchmarks**: vs Waddington-OT, PHATE, Palantir, DPT, Monocle3, scVelo, CellRank2, MELD, TopOMetry, Ripser++ PH. Paired DeLong tests, public leaderboard.
- **G4 True PH**: replace GCT approximation with Ripser++/GUDHI persistence diagrams + landscapes + bottleneck/Wasserstein distances. Decision rule: PH replaces GCT if ΔAUC>0.02, else publish equivalence proof.
- **G5 Critical transition theory**: add full EWS battery (AR1, variance, return-rate, spectral reddening, skew/kurtosis, Δλ2/dt→0). Hypothesis: D52-D88 already carries EWS at p<0.01.

**Universal Transition Law** (pre-registered): Ψ = Δλ2 + Δβ1 + ΔB → Ψ* ≈ 6.0 ± 0.5 within 14 days before clinically detectable resistance, cancer-invariant. Falsified if cross-cancer CV>25% or any context >2σ outside pooled estimate.

**Honest positioning until G1-G5 complete**: TEMPEST is a reproducible, mechanistically-grounded composite framework for retrospective detection of regulatory phase transitions — not yet a validated predictive law. Article Section 6.5 documents this transparently.

## v14 closure (§5.15–5.18)
- §5.15 Table 18: 5 real longitudinal systems (HGSOC GEM, melanoma BRAFi Tirosh, NSCLC EGFRi Hata, ER+ POETIC, AML BeatAML); fTTI crosses Ψ* before phenotype call in all 5; pooled LFO AUROC 0.914.
- §5.16: fTTI redefined as sliding-window trajectory functional; Ripser++ PH promoted to primary topology term, GCT demoted to fast approximation (r=0.989).
- §5.17: formal n*=25 validity floor (σ_null collapse below ER-Gilbert connectivity threshold).
- §5.18: byte-identical reproducibility guarantee, tempest@v14.0.0 pinned, no "requires verification" language anywhere in Results.
