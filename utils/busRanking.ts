// utils/busRanking.ts
import { RANKING_CONFIG } from "@/config/config";
import { BusPosition } from "@/store/useRiderStore";
import { L12Stop, L12StopPoint } from "@/types";
import { haversineDistance } from "@/utils/geo";

export type RankedBus = BusPosition & {
  distanceKm: number;
  etaMinutes: number;
  isBlocked: boolean;
  isStale: boolean;
  hasPassedStop: boolean;
};

const BLOCKED_STATUSES = RANKING_CONFIG.BLOCKED_STATUSES;
const AVG_SPEED_KMH = RANKING_CONFIG.AVG_SPEED_KMH;
const STALE_THRESHOLD_MS = RANKING_CONFIG.STALE_THRESHOLD_MS;
const PASSED_TOLERANCE = RANKING_CONFIG.PASSED_TOLERANCE;

// Un bus une fois marqué "arrivé" pour un arrêt donné reste exclu
// même si le GPS oscille et fait redescendre son ordre sous le seuil.
// Réinitialisé côté appelant quand l'usager change d'arrêt (voir note plus bas).
const arrivedBusIds = new Set<string>();

export function resetArrivedBuses() {
  arrivedBusIds.clear();
}

function findClosestStopOrder(bus: BusPosition, routeStops: L12Stop): number {
  let closestOrder = routeStops[0]?.ordre ?? 0;
  let closestDistance = Infinity;
  for (const stop of routeStops) {
    const d = haversineDistance(bus.lat, bus.lng, stop.lat, stop.lon);
    if (d < closestDistance) {
      closestDistance = d;
      closestOrder = stop.ordre;
    }
  }
  return closestOrder;
}

export function rankBuses(
  buses: BusPosition[],
  userStop: L12StopPoint,
  routeStopsByDirection: Record<"aller" | "retour", L12Stop>,
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
    const routeStops = routeStopsByDirection[bus.direction];
    const busOrder = routeStops ? findClosestStopOrder(bus, routeStops) : -1;

    const passedNow =
      busOrder >= 0 && busOrder > userStop.ordre + PASSED_TOLERANCE;
    if (passedNow) arrivedBusIds.add(bus.bus_id);
    const hasPassedStop = arrivedBusIds.has(bus.bus_id);

    const isStale =
      now - new Date(bus.updated_at).getTime() > STALE_THRESHOLD_MS;
    const isBlocked =
      BLOCKED_STATUSES.includes(bus.status) || isStale || hasPassedStop;

    return {
      ...bus,
      distanceKm,
      etaMinutes,
      isBlocked,
      isStale,
      hasPassedStop,
    };
  });

  return ranked.sort((a, b) => {
    if (a.isBlocked && !b.isBlocked) return 1;
    if (!a.isBlocked && b.isBlocked) return -1;
    return a.distanceKm - b.distanceKm;
  });
}
