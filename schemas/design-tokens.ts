import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Невалиден hex цвят (напр. #F2A58E)");
const cssValue = z.string().min(1).max(100);

export const DesignTokensSchema = z.object({
  primaryColor:    hexColor,
  backgroundColor: hexColor,
  textColor:       hexColor,
  accentColor:     hexColor,
  fontFamily:      cssValue,
  headingSize:     cssValue,
  bodySize:        cssValue,
  borderRadius:    cssValue,
  buttonPadding:   cssValue,
  sectionPadding:  cssValue,
});

export const SaveDesignTokensSchema = z.object({
  salon_slug:    z.string().min(1),
  design_tokens: DesignTokensSchema,
});

export type SaveDesignTokensInput = z.infer<typeof SaveDesignTokensSchema>;
