import * as SQLite from "expo-sqlite";
import { GtfsStop, GtfsTrip } from "./types";

export interface RoutePolylinePoint {
  latitude: number;
  longitude: number;
}

export interface RouteStop extends GtfsStop {
  stop_sequence: number;
  arrival_time: string;
}

/**
 * Retourne un trip représentatif pour une ligne + direction donnée.
 * Réutilise la même logique que la génération des edges : peu importe
 * quel trip exact on prend, la séquence d'arrêts et le tracé sont
 * identiques pour tous les trips d'une même (route_id, direction_id).
 */
async function getRepresentativeTrip(
  db: SQLite.SQLiteDatabase,
  routeId: string,
  directionId: number,
): Promise<GtfsTrip | null> {
  const trip = await db.getFirstAsync<GtfsTrip>(
    "SELECT * FROM trips WHERE route_id = ? AND direction_id = ? LIMIT 1",
    [routeId, directionId],
  );
  return trip ?? null;
}

/**
 * Retourne le tracé géographique complet d'une ligne (pour dessiner
 * le Polyline sur la carte), dans l'ordre du parcours.
 */
export async function getRouteShape(
  db: SQLite.SQLiteDatabase,
  routeId: string,
  directionId: number,
): Promise<RoutePolylinePoint[]> {
  const trip = await getRepresentativeTrip(db, routeId, directionId);
  if (!trip || !trip.shape_id) {
    console.warn(
      `⚠️ Aucun shape trouvé pour route ${routeId} direction ${directionId}`,
    );
    return [];
  }

  const points = await db.getAllAsync<{
    shape_pt_lat: number;
    shape_pt_lon: number;
  }>(
    "SELECT shape_pt_lat, shape_pt_lon FROM shapes WHERE shape_id = ? ORDER BY shape_pt_sequence ASC",
    [trip.shape_id],
  );

  return points.map((p) => ({
    latitude: p.shape_pt_lat,
    longitude: p.shape_pt_lon,
  }));
}

/**
 * Retourne la liste ordonnée des arrêts d'une ligne + direction,
 * avec leurs horaires (utile pour l'affichage détail et la simulation temps réel).
 */
export async function getRouteStops(
  db: SQLite.SQLiteDatabase,
  routeId: string,
  directionId: number,
): Promise<RouteStop[]> {
  const trip = await getRepresentativeTrip(db, routeId, directionId);
  if (!trip) {
    console.warn(
      `⚠️ Aucun trip trouvé pour route ${routeId} direction ${directionId}`,
    );
    return [];
  }

  const rows = await db.getAllAsync<RouteStop>(
    `SELECT stops.*, stop_times.stop_sequence, stop_times.arrival_time
     FROM stop_times
     JOIN stops ON stops.stop_id = stop_times.stop_id
     WHERE stop_times.trip_id = ?
     ORDER BY stop_times.stop_sequence ASC`,
    [trip.trip_id],
  );

  return rows;
}
