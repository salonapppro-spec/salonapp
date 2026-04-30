import { z } from "zod";

export const ALLOWED_FONT_FAMILIES = [
  "Inter, sans-serif",
  "'Playfair Display', serif",
  "Montserrat, sans-serif",
  "'Cormorant Garamond', serif",
  "Lato, sans-serif",
  "Raleway, sans-serif",
  "Poppins, sans-serif",
  "'DM Sans', sans-serif",
  "Outfit, sans-serif",
  "Nunito, sans-serif",
  "'Josefin Sans', sans-serif",
  "'Bebas Neue', sans-serif",
  "Cinzel, serif",
  "'Dancing Script', cursive",
  "Italiana, serif",
  "'Libre Baskerville', serif",
] as const;

export const ALLOWED_BORDER_RADIUS = [
  "0",
  "0.375rem",
  "0.75rem",
  "1.5rem",
  "9999px",
] as const;

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Невалиден hex цвят (напр. #F2A58E)");
const cssLength = z
  .string()
  .regex(/^(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em))$/, "Невалидна CSS дължина");
const cssLengthPair = z
  .string()
  .regex(/^(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em))(?:\s+(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em)))?$/, "Невалиден CSS padding");
const fontFamily = z.enum(ALLOWED_FONT_FAMILIES);
const borderRadius = z.enum(ALLOWED_BORDER_RADIUS);

export const DesignTokensSchema = z.object({
  primaryColor:    hexColor,
  backgroundColor: hexColor,
  textColor:       hexColor,
  accentColor:     hexColor,
  fontFamily,
  headingFont:     fontFamily,
  bodyFont:        fontFamily,
  navFont:         fontFamily,
  buttonFont:      fontFamily,
  headingSize:     cssLength,
  bodySize:        cssLength,
  borderRadius,
  buttonPadding:   cssLengthPair,
  sectionPadding:  cssLength,
}).strict();

