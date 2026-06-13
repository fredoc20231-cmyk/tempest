/**
 * Platform-wide scope, scope-language, and disclaimer constants.
 * Imported by Home, Sidebar, Report, Article, and exports so all
 * surfaces speak with one voice.
 */
export const PLATFORM_SCOPE =
  "State-separation and transition-dynamics framework";

export const PLATFORM_TAGLINE =
  "A research framework for state-separation and transition-dynamics analysis of multi-omic trajectories. Not a clinical decision tool.";

export const DISCLAIMER_FTTI =
  "fTTI threshold is proof-of-concept only; not validated for clinical stratification.";

export const DISCLAIMER_SCOPE =
  "TEMPEST provides retrospective state-separation and transition-dynamics evidence. It does not perform prospective prediction and is not validated for clinical use.";

export const FORBIDDEN_CLAIMS = [
  "prospective prediction",
  "predicts outcome",
  "clinical use",
  "clinically validated",
  "approved for diagnosis",
];

export const TEMPEST_VERSION = "v14.0.0-research";
