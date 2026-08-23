import { useEffect, useState } from "react";
import { RoutePolylinePoint, RouteStop } from "../gtfs/queries";

interface BusPosition {
  latitude: number;
  longitude: number;
  nextStopName: string | null;
  etaSeconds: number | null; // temps estimé avant le prochain arrêt
}

/**
 * Convertit "HH:MM:SS" en secondes depuis minuit (même logique que le pipeline).
 * Gère les heures GTFS > 24h (ex: "25:10:00").
 */
function timeToSeconds(time: string): number {
  const [h, m, s] = time.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

function getCurrentSecondsOfDay(): number {
  const now = new Date();
  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
}

/**
 * Simule la position d'un bus le long d'un tracé, calée sur les horaires
 * réels de stop_times — pas une vitesse arbitraire.
 *
 * Principe :
 * 1. On regarde l'heure actuelle du téléphone
 * 2. On trouve entre quels DEUX arrêts consécutifs le bus devrait se trouver
 * 3. On calcule le ratio de temps écoulé dans ce segment (0 = vient de partir, 1 = arrive)
 * 4. On interpole la position géographique le long du `shape` correspondant à ce segment
 */
export function useSimulatedBusPosition(
  shape: RoutePolylinePoint[],
  stops: RouteStop[],
): BusPosition | null {
  const [position, setPosition] = useState<BusPosition | null>(null);

  useEffect(() => {
    if (shape.length === 0 || stops.length < 2) {
      setPosition(null);
      return;
    }

    function computePosition() {
      const nowSeconds = getCurrentSecondsOfDay();

      // Trouver le segment [stop[i], stop[i+1]] où on se trouve actuellement.
      // Si l'heure actuelle est avant le premier arrêt ou après le dernier,
      // on "boucle" symboliquement sur le premier segment (simulation continue,
      // pas un vrai service qui s'arrête la nuit).
      let segmentStart = stops[0];
      let segmentEnd = stops[1];

      for (let i = 0; i < stops.length - 1; i++) {
        const startSeconds = timeToSeconds(stops[i].arrival_time);
        const endSeconds = timeToSeconds(stops[i + 1].arrival_time);

        if (nowSeconds >= startSeconds && nowSeconds <= endSeconds) {
          segmentStart = stops[i];
          segmentEnd = stops[i + 1];
          break;
        }
      }

      const startSeconds = timeToSeconds(segmentStart.arrival_time);
      const endSeconds = timeToSeconds(segmentEnd.arrival_time);
      const segmentDuration = endSeconds - startSeconds;

      const ratio =
        segmentDuration > 0
          ? Math.min(
              1,
              Math.max(0, (nowSeconds - startSeconds) / segmentDuration),
            )
          : 0;

      // Interpolation simple entre les deux arrêts (ligne droite).
      // Suffisant pour le MVP — une interpolation le long du `shape` exact
      // serait plus précise mais ajoute de la complexité pour un gain
      // visuel minime à l'échelle d'un arrêt à l'autre.
      const latitude =
        segmentStart.stop_lat +
        (segmentEnd.stop_lat - segmentStart.stop_lat) * ratio;
      const longitude =
        segmentStart.stop_lon +
        (segmentEnd.stop_lon - segmentStart.stop_lon) * ratio;

      const etaSeconds = Math.max(0, endSeconds - nowSeconds);

      setPosition({
        latitude,
        longitude,
        nextStopName: segmentEnd.stop_name,
        etaSeconds,
      });
    }

    computePosition();
    const interval = setInterval(computePosition, 5000); // rafraîchi toutes les 5s

    return () => clearInterval(interval);
  }, [shape, stops]);

  return position;
}
