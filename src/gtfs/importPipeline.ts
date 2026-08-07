import * as SQLite from "expo-sqlite";
import { loadAllGtfsFiles } from "./loadAssets";
import {
    GtfsAgency,
    GtfsCalendar,
    GtfsCalendarDate,
    GtfsRoute,
    GtfsShapePoint,
    GtfsStop,
    GtfsStopTime,
    GtfsTrip,
} from "./types";

/**
 * Insère un tableau de lignes dans une table, via un statement préparé
 * réutilisé pour chaque ligne — beaucoup plus rapide que des INSERT séparés.
 */
async function bulkInsert<T extends Record<string, any>>(
    db: SQLite.SQLiteDatabase,
    tableName: string,
    columns: string[],
    rows: T[]
): Promise<void> {
    if (rows.length === 0) {
        console.warn(`⚠️ Aucune ligne à insérer pour la table "${tableName}"`);
        return;
    }

    const placeholders = columns.map(() => "?").join(", ");
    const sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`;

    const statement = await db.prepareAsync(sql);
    try {
        for (const row of rows) {
            const values = columns.map((col) => row[col] ?? null);
            await statement.executeAsync(values);
        }
    } finally {
        await statement.finalizeAsync();
    }

    console.log(`✅ ${rows.length} lignes insérées dans "${tableName}"`);
}

/**
 * Étape 1 du pipeline : charge les fichiers GTFS et insère toutes les
 * tables brutes en base, dans une seule transaction.
 */
export async function insertRawGtfsData(db: SQLite.SQLiteDatabase): Promise<void> {
    console.log("📥 Chargement des fichiers GTFS...");
    const data = await loadAllGtfsFiles();

    console.log("💾 Insertion en base de données...");
    await db.withTransactionAsync(async () => {
        await bulkInsert<GtfsAgency>(
            db,
            "agency",
            ["agency_id", "agency_name", "agency_url", "agency_timezone", "agency_lang", "agency_phone"],
            data.agency
        );

        await bulkInsert<GtfsStop>(
            db,
            "stops",
            ["stop_id", "stop_code", "stop_name", "stop_desc", "stop_lat", "stop_lon"],
            data.stops
        );

        await bulkInsert<GtfsRoute>(
            db,
            "routes",
            ["route_id", "agency_id", "route_short_name", "route_long_name", "route_type", "route_color", "route_text_color"],
            data.routes
        );

        await bulkInsert<GtfsCalendar>(
            db,
            "calendar",
            ["service_id", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "start_date", "end_date"],
            data.calendar
        );

        await bulkInsert<GtfsCalendarDate>(
            db,
            "calendar_dates",
            ["service_id", "date", "exception_type"],
            data.calendarDates
        );

        await bulkInsert<GtfsTrip>(
            db,
            "trips",
            ["trip_id", "route_id", "service_id", "trip_headsign", "direction_id", "shape_id"],
            data.trips
        );

        await bulkInsert<GtfsStopTime>(
            db,
            "stop_times",
            ["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence"],
            data.stopTimes
        );

        await bulkInsert<GtfsShapePoint>(
            db,
            "shapes",
            ["shape_id", "shape_pt_lon", "shape_pt_lat", "shape_pt_sequence", "shape_dist_traveled"],
            data.shapes
        );
    });

    console.log("✅ Toutes les tables GTFS brutes ont été insérées.");
}

//----------------------------------------------------
    /**
     * Convertit une heure GTFS "HH:MM:SS" en secondes depuis minuit.
     * Note : GTFS autorise des heures > 24 (ex: "25:30:00" pour un service
     * qui continue après minuit) — Number() gère ça sans problème.
     */
    function timeToSeconds(time: string): number {
        const [h, m, s] = time.split(":").map(Number);
        return h * 3600 + m * 60 + s;
    }

/**
 * Sélectionne un seul trip représentatif par (route_id, direction_id, service_id).
 * Toutes les courses d'une même ligne/direction/service ont la même séquence
 * d'arrêts — on n'a donc besoin que d'un seul exemplaire pour générer les edges.
 */
function pickRepresentativeTrips(trips: GtfsTrip[]): GtfsTrip[] {
    const seen = new Map<string, GtfsTrip>();

    for (const trip of trips) {
        const key = `${trip.route_id}__${trip.direction_id}__${trip.service_id}`;
        if (!seen.has(key)) {
            seen.set(key, trip);
        }
    }

    return Array.from(seen.values());
}

/**
 * Étape 2 du pipeline : génère la table `edges` à partir des stop_times,
 * en ne traitant qu'un trip représentatif par ligne/direction/service.
 */
export async function generateEdges(db: SQLite.SQLiteDatabase): Promise<void> {
    console.log("🔗 Génération des edges...");

    // 1. Récupérer tous les trips
    const allTrips = await db.getAllAsync<GtfsTrip>("SELECT * FROM trips");
    const representativeTrips = pickRepresentativeTrips(allTrips);

    console.log(
        `📊 ${allTrips.length} trips au total → ${representativeTrips.length} trips représentatifs retenus`
    );

    const insertStatement = await db.prepareAsync(`
    INSERT INTO edges (from_stop_id, to_stop_id, route_id, direction_id, service_id, cost_seconds)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

    let totalEdgesCreated = 0;

    try {
        await db.withTransactionAsync(async () => {
            for (const trip of representativeTrips) {
                // 2. Récupérer les stop_times de ce trip, triés par séquence
                const stopTimes = await db.getAllAsync<GtfsStopTime>(
                    "SELECT * FROM stop_times WHERE trip_id = ? ORDER BY stop_sequence ASC",
                    [trip.trip_id]
                );

                if (stopTimes.length < 2) {
                    console.warn(
                        `⚠️ Trip "${trip.trip_id}" a moins de 2 arrêts, ignoré.`
                    );
                    continue;
                }

                // 3. Parcourir les arrêts consécutifs et créer un edge pour chaque paire
                for (let i = 0; i < stopTimes.length - 1; i++) {
                    const current = stopTimes[i];
                    const next = stopTimes[i + 1];

                    const departureSeconds = timeToSeconds(current.departure_time);
                    const arrivalSeconds = timeToSeconds(next.arrival_time);
                    const costSeconds = arrivalSeconds - departureSeconds;

                    if (costSeconds <= 0) {
                        console.warn(
                            `⚠️ Coût invalide (${costSeconds}s) entre "${current.stop_id}" et "${next.stop_id}" sur trip "${trip.trip_id}", ignoré.`
                        );
                        continue;
                    }

                    await insertStatement.executeAsync([
                        current.stop_id,
                        next.stop_id,
                        trip.route_id,
                        trip.direction_id,
                        trip.service_id,
                        costSeconds,
                    ]);

                    totalEdgesCreated++;
                }
            }
        });
    } finally {
        await insertStatement.finalizeAsync();
    }

    console.log(`✅ ${totalEdgesCreated} edges créés.`);
}

/**
 * Point d'entrée unique du pipeline complet.
 * C'est la seule fonction que le reste de l'app doit appeler.
 */
export async function runFullImportPipeline(db: SQLite.SQLiteDatabase): Promise<void> {
    await insertRawGtfsData(db);
    await generateEdges(db);
}