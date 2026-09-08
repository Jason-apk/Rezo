// utils/statusLabels.ts
export function getStatusLabel(status: string): string {
  switch (status) {
    case "pause":
      return "en pause";
    case "panne":
      return "en panne";
    case "plein":
      return "complet";
    default:
      return "";
  }
}
