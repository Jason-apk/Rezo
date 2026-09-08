// src/hooks/useNearestStop.ts
import { L12_stops_aller, L12_stops_retour } from "@/data/stops";
import { Direction, useRiderStore } from "@/store/useRiderStore";
import { L12StopPoint } from "@/types";
import { haversineDistance } from "@/utils/geo";
import * as Location from "expo-location";
import { useEffect } from "react";

function findNearestStop(
  lat: number,
  lon: number,
  direction: Direction,
): L12StopPoint {
  const stops = direction === "aller" ? L12_stops_aller : L12_stops_retour;
  let nearest = stops[0];
  let minDistance = Infinity;

  for (const stop of stops) {
    const distance = haversineDistance(lat, lon, stop.lat, stop.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = stop;
    }
  }
  return nearest;
}

export function useNearestStopDetection(direction: Direction) {
  const selectedStopId = useRiderStore((s) => s.selectedStopId);
  const setSelectedStopId = useRiderStore((s) => s.setSelectedStopId);

  useEffect(() => {
    if (selectedStopId) return; // déjà un arrêt choisi, pas besoin de détecter

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const position = await Location.getCurrentPositionAsync({});
      const nearest = findNearestStop(
        position.coords.latitude,
        position.coords.longitude,
        direction,
      );
      setSelectedStopId(nearest.id);
    })();
  }, [direction, selectedStopId]);
}
