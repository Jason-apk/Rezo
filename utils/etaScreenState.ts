// src/utils/etaScreenState.ts
import { RankedBus } from "@/utils/busRanking";

export type ScreenVariant =
  | "normal"
  | "embouteillage"
  | "panne"
  | "plein"
  | "pause"
  | "no_tracking"
  | "offline"
  | "arrived";

export function getScreenVariant(
  rankedBuses: RankedBus[],
  isOffline: boolean,
  topBus: RankedBus | undefined, // déjà filtré : premier bus NON bloqué, ou undefined
): ScreenVariant {
  if (isOffline) return "offline";
  if (rankedBuses.length === 0) return "no_tracking";

  // Un bus disponible existe : c'est lui qui pilote l'écran principal.
  // panne/plein/pause sont toujours "isBlocked", donc un topBus disponible
  // ne peut être que "normal" ou "embouteillage".
  if (topBus) {
    if (topBus.etaMinutes <= 0) return "arrived";
    if (topBus.status === "embouteillage") return "embouteillage";
    return "normal";
  }

  // Aucun bus disponible : déterminer la raison dominante pour informer l'usager.
  const allStale = rankedBuses.every((b) => b.isStale);
  if (allStale) return "no_tracking";

  const allPaused = rankedBuses.every((b) => b.status === "pause");
  if (allPaused) return "pause";

  const first = rankedBuses[0];
  if (first.status === "panne") return "panne";
  if (first.status === "plein") return "plein";

  // Reste : tous ont dépassé l'arrêt, ou mélange sans cause dominante claire.
  return "no_tracking";
}
