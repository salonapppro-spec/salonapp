import type { DesignTokens } from "@/types/design-tokens";

export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  primaryColor:   "#F2A58E",
  backgroundColor: "#FFFFFF",
  textColor:       "#1A1A1A",
  accentColor:     "#E07A5F",
  fontFamily:      "Inter, sans-serif",
  headingSize:     "2.5rem",
  bodySize:        "1rem",
  borderRadius:    "0.75rem",
  buttonPadding:   "0.6rem 1.5rem",
  sectionPadding:  "4rem",
};

export function mergeTokens(saved: Partial<DesignTokens> | null | undefined): DesignTokens {
  return { ...DEFAULT_DESIGN_TOKENS, ...saved };
}

export function tokensToCssVars(tokens: DesignTokens): Record<string, string> {
  return {
    "--color-primary":    tokens.primaryColor,
    "--color-bg":         tokens.backgroundColor,
    "--color-text":       tokens.textColor,
    "--color-accent":     tokens.accentColor,
    "--font-family":      tokens.fontFamily,
    "--heading-size":     tokens.headingSize,
    "--body-size":        tokens.bodySize,
    "--border-radius":    tokens.borderRadius,
    "--button-padding":   tokens.buttonPadding,
    "--section-padding":  tokens.sectionPadding,
  };
}
