// utils/busRanking.ts
import { BusPosition } from "@/store/useRiderStore";
import { L12StopPoint } from "@/types";
import { haversineDistance } from "@/utils/geo";

export type RankedBus = BusPosition & {
  distanceKm: number;
  etaMinutes: number;
  isBlocked: boolean;
  isStale: boolean; // ← nouveau champ
};

const BLOCKED_STATUSES = ["panne", "plein", "pause"];
const AVG_SPEED_KMH = 15; // vitesse moyenne bus en ville, à ajuster selon données réelles du pilote
const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes sans update = signal considéré perdu

export function rankBuses(
  buses: BusPosition[],
  userStop: L12StopPoint,
): RankedBus[] {
  const now = Date.now();

  const ranked = buses.map((bus) => {
    const distanceKm = haversineDistance(
      bus.lat,
      bus.lng,
      userStop.lat,
      userStop.lon,
    );
    const etaMinutes = Math.round((distanceKm / AVG_SPEED_KMH) * 60);
    const isStale =
      now - new Date(bus.updated_at).getTime() > STALE_THRESHOLD_MS;
    const isBlocked = BLOCKED_STATUSES.includes(bus.status) || isStale;
    return { ...bus, distanceKm, etaMinutes, isBlocked, isStale };
  });

  return ranked.sort((a, b) => {
    // les bus bloqués passent toujours après les bus disponibles
    if (a.isBlocked && !b.isBlocked) return 1;
    if (!a.isBlocked && b.isBlocked) return -1;
    // à égalité de blocage, tri par distance
    return a.distanceKm - b.distanceKm;
  });
}
