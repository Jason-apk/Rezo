// src/theme/tokens.ts

export const colors = {
  background: "#EAF6F3", // fond général, remplace le crème
  backgroundCard: "#FFFFFF",
  backgroundChip: "#EEF2FF",

  primary: "#5C7CE0", // bleu périwinkle — CTA, bus en approche, éléments actifs
  primaryText: "#FFFFFF",

  textPrimary: "#1B1F3B", // navy foncé, remplace #2C3E50
  textSecondary: "#5A6072",
  textMuted: "#9AA0B4",

  statusGreen: "#4CAF7D", // bon signal / normal — plus saturé, lisible au soleil
  statusAmber: "#E8A93D", // info passive — orange gardé UNIQUEMENT ici
  statusRose: "#E85D75", // alerte / panne — plus vif que l'ancien rose poussiéreux

  border: "#E0E6F0",
  statusGray: "#A0A6B8",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 42,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 24,
};

export const fontSize = {
  sm: 12,
  base: 14,
  md: 16,
  lg: 20,
  xl: 32,
  huge: 48, // pour l'ETA en minutes sur Screen 3
  hugeX: 70,
};

export function getLineColor(lineId: string): string {
  // pour l'instant une seule ligne (L12) au pilote — fonction prête pour l'extension multi-lignes plus tard
  const lineColors: Record<string, string> = {
    L12: colors.primary,
  };
  return lineColors[lineId] ?? colors.primary;
}
