

# Plan: Integrate Neuroblastoma Multi-Omic Reference Data into TEMPEST

## Overview
Embed two neuroblastoma datasets — ChIP-seq H3K27ac differential binding (Noradrenergic vs Mesenchymal) and RNA-seq expression with drug perturbations — into the TEMPEST platform as built-in reference knowledge and cross-cancer validation data.

## What This Achieves
- Expands TEMPEST beyond HGSOC-only to demonstrate cross-cancer applicability (neuroblastoma cell identity heterogeneity)
- Adds real epigenomic (H3K27ac) and transcriptomic (RNA-seq) data for the AI agent and analysis modules to reference
- Strengthens the platform's scientific credibility by grounding it in published data (Boeva et al., Noradrenergic vs NCC-like Mesenchymal lineages)

## Data Summary
1. **ChIP-seq** (17,763 genes): H3K27ac differential binding across 15 neuroblastoma cell lines — captures enhancer landscape differences between Noradrenergic (ADRN) and Mesenchymal (MES) cell states. Includes log2FoldChange and padj.
2. **RNA-seq** (19,399 genes): Expression across 29 conditions including drug perturbations (doxorubicin, cisplatin) and PHOX2B shRNA knockdown. Captures lineage-specific transcription and plasticity under therapy.

## Changes

### 1. Add Neuroblastoma Knowledge to Chat AI System Prompt
**File**: `supabase/functions/chat/index.ts`
- Add a new `NEUROBLASTOMA_REFERENCE` knowledge block covering:
  - ADRN vs MES cell identity framework (super-enhancers, core regulatory circuitries)
  - Key lineage markers from the ChIP-seq data: ADRN (PHOX2B, HAND2, GATA3, DBH, TH) vs MES (PRRX1, SNAI2, VIM, FN1, YAP1)
  - Drug response signatures: top differentially expressed genes under doxorubicin/cisplatin
  - PHOX2B knockdown → MES transition evidence from the shRNA time course (J0→J2→J5→J13)
  - Cross-cancer parallels to HGSOC: EMT-like transitions, therapy-induced plasticity, bifurcation biology
- Append to `SYSTEM_PROMPT` so the AI can answer neuroblastoma questions and draw HGSOC parallels

### 2. Add Neuroblastoma Context to Analysis Modules
**File**: `supabase/functions/run-analysis/index.ts`
- Add a `NEUROBLASTOMA_CONTEXT` block summarizing the key biological findings
- Update each `MODULE_PROMPTS` entry to include a cross-cancer validation instruction: "When generating results, note how this framework could be applied to neuroblastoma ADRN↔MES transitions as a validation case"
- This grounds module outputs in real multi-cancer data

### 3. Pre-load Datasets into Database
- Copy both uploaded files to a temp location
- Parse the top significant genes (padj < 0.05, |log2FC| > 1) from each dataset
- Insert summarized records into the `datasets` table with `is_training: true` so they automatically enrich AI context
- Two dataset entries: one for ChIP-seq, one for RNA-seq

### 4. Update Data Sources Panel with Neuroblastoma Reference
**File**: `src/components/tempest/DataSourcesPanel.tsx`
- No structural changes needed — the pre-loaded datasets will appear in the "Saved" tab automatically since they are inserted into the `datasets` table

## Technical Details
- ChIP-seq significant genes extracted using padj < 0.05 and |log2FC| > 1 filters
- RNA-seq significant genes extracted using same thresholds
- Top ~50 genes per dataset stored as structured JSON in the `data` column
- Knowledge blocks keep the system prompt under token limits by summarizing rather than embedding raw data
- All dataset inserts use the existing `datasets` table schema (source: "uploaded", category: "epigenomic"/"expression")

