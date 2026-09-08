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
): ScreenVariant {
  if (isOffline) return "offline";
  if (rankedBuses.length === 0) return "no_tracking";

  const allStaleOrPaused = rankedBuses.every(
    (b) => b.isStale || b.status === "pause",
  );
  if (allStaleOrPaused) return "no_tracking"; // signal mort partout = comme si rien n'était tracké

  const allPaused = rankedBuses.every((b) => b.status === "pause");
  if (allPaused) return "pause";

  const topBus = rankedBuses[0];
  if (topBus.etaMinutes <= 0) return "arrived";
  if (topBus.status === "panne") return "panne";
  if (topBus.status === "plein") return "plein";
  if (topBus.status === "embouteillage") return "embouteillage";

  return "normal";
}
