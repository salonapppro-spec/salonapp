/** Landing page color palette — local preview */
export const LP = {
  bg: "#F7F5F2",
  bgSecondary: "#FFFCF8",
  text: "#1A1A1A",
  textMuted: "#6E6A63",
  accent: "#C8A063",
  accentDark: "#A67C3D",
  border: "#E7DDD0",
  card: "#FDFBF8",
} as const;

export const LP_GRADIENT = `linear-gradient(135deg, ${LP.accent}, ${LP.accentDark})`;
