// src/utils/busVisuals.ts
import { colors } from "@/theme/tokens";
import { RankedBus } from "@/utils/busRanking";

export function getBusColor(bus: RankedBus): string {
  if (bus.isStale || bus.status === "pause") return colors.statusGray;
  if (bus.status === "panne" || bus.status === "plein")
    return colors.statusRose;
  if (bus.status === "embouteillage") return colors.statusAmber;
  return colors.statusGreen;
}

export function getBusStatusLabel(bus: RankedBus): string {
  if (bus.isStale) return "Signal perdu";
  switch (bus.status) {
    case "pause":
      return "En pause";
    case "panne":
      return "En panne";
    case "plein":
      return "Complet";
    case "embouteillage":
      return "Embouteillage";
    default:
      return "En circulation";
  }
}
