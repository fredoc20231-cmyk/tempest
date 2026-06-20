/**
 * Clearly-badged DEMO trajectories for UI clarification only.
 * NOT real datasets. Every cohort is provenance="DEMO/SYNTHETIC" and shown
 * with a DEMO badge in the UI. Generated from a logistic Ψ-trajectory + noise
 * so reviewers can see the harness mechanics without being mislead.
 */
import type { CohortTrajectory } from "./multiCohort";
import { makePRNG, randn } from "@/lib/ttiEngine";

interface DemoSpec {
  label: string;
  bifurcation_t: number | null;     // null = non-transitioning control
  amplitude: number;
  noise: number;
  positive: boolean | null;
  seed: number;
}

const SPECS: DemoSpec[] = [
  { label: "DEMO-A (resistant)", bifurcation_t: 9, amplitude: 7.5, noise: 0.4, positive: true, seed: 11 },
  { label: "DEMO-B (resistant)", bifurcation_t: 11, amplitude: 7.0, noise: 0.5, positive: true, seed: 22 },
  { label: "DEMO-C (resistant)", bifurcation_t: 10, amplitude: 6.8, noise: 0.6, positive: true, seed: 33 },
  { label: "DEMO-D (responsive)", bifurcation_t: null, amplitude: 3.2, noise: 0.5, positive: false, seed: 44 },
  { label: "DEMO-E (responsive)", bifurcation_t: null, amplitude: 3.6, noise: 0.4, positive: false, seed: 55 },
  { label: "DEMO-F (responsive)", bifurcation_t: null, amplitude: 2.9, noise: 0.5, positive: false, seed: 66 },
];

function buildTrajectory(spec: DemoSpec): CohortTrajectory {
  const rand = makePRNG(spec.seed);
  const timepoints = Array.from({ length: 16 }, (_, i) => i);
  const fTTI = timepoints.map((t) => {
    const base =
      spec.bifurcation_t != null
        ? spec.amplitude / (1 + Math.exp(-(t - spec.bifurcation_t)))
        : spec.amplitude * (0.5 + 0.05 * Math.sin(t));
    return base + spec.noise * randn(rand);
  });
  return {
    label: spec.label,
    timepoints,
    fTTI,
    phenotype:
      spec.positive == null
        ? null
        : { t: spec.bifurcation_t != null ? spec.bifurcation_t + 2 : 14, positive: spec.positive },
    provenance: "DEMO/SYNTHETIC",
  };
}

export function buildDemoCohorts(): CohortTrajectory[] {
  return SPECS.map(buildTrajectory);
}
