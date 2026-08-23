/**
 * Design tokens REZO — toutes les valeurs visuelles centralisées ici.
 * Un seul endroit à modifier si on change une couleur ou une taille.
 */

export const colors = {
  primary: "#1E2761", // bleu principal — actions, header, lignes actives
  primaryLight: "#4A5FC1", // états pressed/hover
  accent: "#F96167", // alertes, CTA secondaire, bus en approche
  background: "#FFFFFF",
  surface: "#F4F6FC", // fond de cartes, sections
  textPrimary: "#1C2333",
  textSecondary: "#55607A",
  textMuted: "#9AA3BD",
  success: "#2ECC71", // indicateur "en ligne"
  error: "#E74C3C", // indicateur "hors ligne"
  border: "#EEEEEE",
  white: "#FFFFFF",
};

export const typography = {
  screenTitle: { fontSize: 22, fontWeight: "700" as const },
  cardTitle: { fontSize: 17, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  caption: { fontSize: 12, fontWeight: "400" as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

/**
 * Couleurs assignées aux lignes de bus.
 * Utilisé partout où une ligne doit être visuellement identifiable
 * (carte, sélecteur, pictogrammes).
 */
export const lineColors: Record<string, string> = {
  L4: "#1E2761",
  L6: "#F96167",
  L12: "#2ECC71",
};

/**
 * Retourne la couleur d'une ligne, avec une couleur de repli
 * si la ligne n'est pas dans la liste (utile quand tu ajoutes
 * de nouvelles lignes sur le terrain sans avoir encore mis à jour ce fichier).
 */
export function getLineColor(routeShortName: string): string {
  return lineColors[routeShortName] ?? colors.textSecondary;
}
