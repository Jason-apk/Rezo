// hooks/useRankedBusesForStop.ts
import { L12_stops_aller, L12_stops_retour } from "@/data/stops";
import { useBusSubscription } from "@/hooks/useBusSubscription";
import { useRiderStore } from "@/store/useRiderStore";
import { rankBuses } from "@/utils/busRanking";

// Centralise la logique partagée par tout écran qui affiche l'état des bus
// pour l'arrêt sélectionné (ETA, carte, futurs écrans). Un seul endroit à
// corriger si le calcul change — évite la divergence entre écrans.
export function useRankedBusesForStop() {
  useBusSubscription();

  const direction = useRiderStore((s) => s.direction);
  const selectedStopId = useRiderStore((s) => s.selectedStopId);
  const buses = useRiderStore((s) => s.buses);

  const stops = direction === "aller" ? L12_stops_aller : L12_stops_retour;
  const userStop = stops.find((s) => s.id === selectedStopId);

  const routeStopsByDirection = {
    aller: L12_stops_aller,
    retour: L12_stops_retour,
  };

  const rankedBuses = userStop
    ? rankBuses(buses, userStop, routeStopsByDirection)
    : [];

  const availableBuses = rankedBuses.filter((b) => !b.isBlocked);
  const topBus = availableBuses[0];

  return { direction, userStop, stops, rankedBuses, selectedStopId, topBus };
}
