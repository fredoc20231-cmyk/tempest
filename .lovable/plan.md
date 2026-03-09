

# Organize AI Responses and Data as Proper Tables

## Problem
AI chat responses render markdown tables without proper styling (no borders, alignment, or visual structure). The Report panel displays metrics as scattered grid cards instead of clean, scannable tables.

## Changes

### 1. Add Markdown Table Styles (src/index.css)
Add CSS rules targeting tables rendered inside the chat's `prose` container:
- Bordered cells with proper padding
- Header row with distinct background
- Alternating row shading for readability
- Mono font for numeric data cells

### 2. Enhance Chat System Prompt (supabase/functions/chat/index.ts)
Update the SYSTEM_PROMPT to instruct the AI to:
- Always present metrics, comparisons, and results as markdown tables (with `|` syntax)
- Use columns like Metric, Value, Interpretation
- Avoid mixing tabular data into paragraph text
- Keep narrative interpretation in a separate paragraph after the table

### 3. Refactor ReportPanel Tables (src/components/tempest/ReportPanel.tsx)
Replace the current div-grid layout for two sections with proper `<Table>` components (from `src/components/ui/table.tsx`):

- **Pipeline Execution Log**: Convert from stacked div rows to a Table with columns: Step, Module, Status, Completed At
- **Module Metrics**: Convert each module's metrics grid from `div.grid.grid-cols-3` cards into a Table with columns: Metric, Value, Trend

### 4. Improve ChatPanel Table Rendering (src/components/tempest/ChatPanel.tsx)
Configure `ReactMarkdown` with custom component overrides for `table`, `thead`, `tbody`, `tr`, `th`, `td` that map to the shadcn Table components for consistent styling.

## Files Modified
| File | Change |
|------|--------|
| `src/index.css` | Add `.prose table` styles for borders, padding, header bg |
| `supabase/functions/chat/index.ts` | Update SYSTEM_PROMPT to enforce table formatting |
| `src/components/tempest/ReportPanel.tsx` | Use Table components for execution log and metrics |
| `src/components/tempest/ChatPanel.tsx` | Add ReactMarkdown component overrides for table elements |

