// hooks/useLineTracking.ts
import { getNextScheduledTrip, ScheduleTrip } from "@/data/horaires";
import { supabase } from "@/lib/supabase";
import { L12ShapePoint, L12StopPoint } from "@/types";
import { useEffect, useRef, useState } from "react";

type BusPosition = {
  bus_id: string;
  direction: "aller" | "retour";
  lat: number;
  lng: number;
  updated_at: string;
};

type TrackingResult =
  | {
      mode: "live";
      bus: BusPosition;
      busOrdre: number;
      speedKmh: number;
      etaToStop: (ordre: number) => number;
    }
  | { mode: "scheduled"; trip: ScheduleTrip }
  | { mode: "none" };

const STALE_THRESHOLD_MS = 90_000;
const LINE_BUS_IDS = ["L12-B1", "L12-B2", "L12-B3", "L12-B4"];

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceAlongShape(
  shape: L12ShapePoint[],
  fromOrdre: number,
  toOrdre: number,
) {
  const sorted = [...shape].sort((a, b) => a.ordre - b.ordre);
  let dist = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    if (cur.ordre >= fromOrdre && cur.ordre < toOrdre) {
      dist += haversine(cur.lat, cur.lon, next.lat, next.lon);
    }
  }
  return dist;
}

function nearestShapePoint(shape: L12ShapePoint[], lat: number, lng: number) {
  let best = shape[0];
  let bestDist = Infinity;
  for (const p of shape) {
    const d = haversine(lat, lng, p.lat, p.lon);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

export function useLineTracking(
  direction: "aller" | "retour",
  shape: L12ShapePoint[],
  stops: L12StopPoint[],
  userLat: number | null,
  userLng: number | null,
) {
  const [positions, setPositions] = useState<Record<string, BusPosition>>({});
  const speedHistory = useRef<Record<string, { t: number; dist: number }[]>>(
    {},
  );

  useEffect(() => {
    supabase
      .from("bus_positions")
      .select("*")
      .in("bus_id", LINE_BUS_IDS)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, BusPosition> = {};
          data.forEach((p) => (map[p.bus_id] = p as BusPosition));
          setPositions(map);
        }
      });

    const channel = supabase
      .channel("l12_positions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bus_positions",
          filter: `bus_id=in.(${LINE_BUS_IDS.join(",")})`,
        },
        (payload) => {
          const p = payload.new as BusPosition;
          setPositions((prev) => ({ ...prev, [p.bus_id]: p }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (userLat == null || userLng == null)
    return { mode: "none" } as TrackingResult;

  const userStop = stops.reduce((best, s) => {
    const d = haversine(userLat, userLng, s.lat, s.lon);
    const bestD = haversine(userLat, userLng, best.lat, best.lon);
    return d < bestD ? s : best;
  }, stops[0]);

  const now = Date.now();

  const candidates = Object.values(positions).filter((p) => {
    if (p.direction !== direction) return false;
    if (now - new Date(p.updated_at).getTime() > STALE_THRESHOLD_MS)
      return false;
    const busPoint = nearestShapePoint(shape, p.lat, p.lng);
    return busPoint.ordre <= userStop.ordre;
  });

  if (candidates.length === 0) {
    const trip = getNextScheduledTrip(direction);
    return trip
      ? ({ mode: "scheduled", trip } as TrackingResult)
      : ({ mode: "none" } as TrackingResult);
  }

  const chosen = candidates.reduce((best, p) => {
    const bestOrdre = nearestShapePoint(shape, best.lat, best.lng).ordre;
    const pOrdre = nearestShapePoint(shape, p.lat, p.lng).ordre;
    return pOrdre > bestOrdre ? p : best;
  });

  const busPoint = nearestShapePoint(shape, chosen.lat, chosen.lng);
  const hist = speedHistory.current[chosen.bus_id] ?? [];
  hist.push({ t: new Date(chosen.updated_at).getTime(), dist: busPoint.ordre });
  speedHistory.current[chosen.bus_id] = hist.slice(-4);

  let speedKmh = 15;
  const h = speedHistory.current[chosen.bus_id];
  if (h.length >= 2) {
    const first = h[0];
    const last = h[h.length - 1];
    const distMeters = distanceAlongShape(
      shape,
      Math.min(first.dist, last.dist),
      Math.max(first.dist, last.dist),
    );
    const timeSec = (last.t - first.t) / 1000;
    if (timeSec > 5 && distMeters > 0) {
      speedKmh = (distMeters / timeSec) * 3.6;
      speedKmh = Math.max(3, Math.min(speedKmh, 40));
    }
  }

  // fonction générique : ETA vers n'importe quel ordre cible sur le shape
  const etaToStop = (targetOrdre: number) => {
    const meters = distanceAlongShape(shape, busPoint.ordre, targetOrdre);
    return meters / (speedKmh / 3.6);
  };

  return {
    mode: "live",
    bus: chosen,
    busOrdre: busPoint.ordre,
    speedKmh,
    etaToStop,
  } as TrackingResult;
}
