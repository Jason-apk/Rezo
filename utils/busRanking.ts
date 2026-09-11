// utils/busRanking.ts
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

const BLOCKED_STATUSES = ["panne", "plein", "pause"];
const AVG_SPEED_KMH = 15; // vitesse moyenne bus en ville, à ajuster selon données réelles du pilote
const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes sans update = signal considéré perdu
const PASSED_TOLERANCE = 1; // absorbe le bruit de l'heuristique nearest-stop

// Trouve l'ordre du stop le plus proche de la position du bus,
// dans la séquence de SA direction déclarée.
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
    // Comparaison uniquement pertinente si le bus roule dans la même
    // direction que l'arrêt choisi par l'usager.
    const routeStops = routeStopsByDirection[bus.direction];
    const busOrder = routeStops ? findClosestStopOrder(bus, routeStops) : -1;

    const hasPassedStop =
      busOrder >= 0 && busOrder > userStop.ordre + PASSED_TOLERANCE;
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
    // les bus bloqués passent toujours après les bus disponibles
    if (a.isBlocked && !b.isBlocked) return 1;
    if (!a.isBlocked && b.isBlocked) return -1;
    // à égalité de blocage, tri par distance
    return a.distanceKm - b.distanceKm;
  });
}
