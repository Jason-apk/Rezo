import * as SQLite from "expo-sqlite";
import { Graph, GtfsCalendar, GtfsCalendarDate } from "./types";

const DAY_COLUMNS = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
] as const;

/**
 * Convertit une Date JS en format GTFS "YYYYMMDD".
 */
function toGtfsDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
}

/**
 * Détermine la liste des service_id actifs pour une date donnée,
 * en croisant `calendar` (règle hebdomadaire) et `calendar_dates.txt` (exceptions).
 */
async function getActiveServiceIds(
    db: SQLite.SQLiteDatabase,
    targetDate: Date
): Promise<Set<string>> {
    const gtfsDate = toGtfsDate(targetDate);
    const dayColumn = DAY_COLUMNS[targetDate.getDay()]; // 0 = dimanche, 1 = lundi...

    // 1. Services actifs selon la règle hebdomadaire de `calendar`,
    //    en respectant la plage start_date / end_date
    const calendarRows = await db.getAllAsync<GtfsCalendar>(
        `SELECT * FROM calendar
     WHERE ${dayColumn} = 1
       AND start_date <= ?
       AND end_date >= ?`,
        [gtfsDate, gtfsDate]
    );

    const activeServiceIds = new Set(calendarRows.map((row) => row.service_id));

    // 2. Appliquer les exceptions de `calendar_dates.txt` pour cette date précise
    const exceptions = await db.getAllAsync<GtfsCalendarDate>(
        "SELECT * FROM calendar_dates WHERE date = ?",
        [gtfsDate]
    );

    for (const exception of exceptions) {
        if (exception.exception_type === 1) {
            // service ajouté ce jour-là (ex: service spécial)
            activeServiceIds.add(exception.service_id);
        } else if (exception.exception_type === 2) {
            // service retiré ce jour-là (ex: jour férié)
            activeServiceIds.delete(exception.service_id);
        }
    }

    return activeServiceIds;
}

/**
 * Construit le graph en mémoire (adjacency list) à partir de la table `edges`,
 * en ne gardant que les edges dont le service est actif pour la date donnée.
 *
 * @param targetDate Date pour laquelle on veut le graph. Si non fournie,
 *                   utilise la date réelle du téléphone (aujourd'hui).
 */
export async function buildGraph(
    db: SQLite.SQLiteDatabase,
    targetDate: Date = new Date()
): Promise<Graph> {
    console.log(`🗺️ Construction du graph pour la date ${toGtfsDate(targetDate)}...`);

    const activeServiceIds = await getActiveServiceIds(db, targetDate);

    if (activeServiceIds.size === 0) {
        console.warn(
            "⚠️ Aucun service actif pour cette date — le graph sera vide."
        );
    }

    // On charge tous les edges, puis on filtre en mémoire (plus simple à
    // maintenir qu'une requête SQL avec IN dynamique sur un Set potentiellement
    // grand — largement suffisant pour la taille de dataset visée).
    const allEdges = await db.getAllAsync<{
        from_stop_id: string;
        to_stop_id: string;
        route_id: string;
        direction_id: number;
        service_id: string;
        cost_seconds: number;
    }>("SELECT * FROM edges");

    const graph: Graph = {};

    for (const edge of allEdges) {
        if (!activeServiceIds.has(edge.service_id)) {
            continue; // ce service n'est pas actif pour la date demandée
        }

        if (!graph[edge.from_stop_id]) {
            graph[edge.from_stop_id] = [];
        }

        graph[edge.from_stop_id].push({
            toStopId: edge.to_stop_id,
            costSeconds: edge.cost_seconds,
            routeId: edge.route_id,
            directionId: edge.direction_id,
        });
    }

    const nodeCount = Object.keys(graph).length;
    const edgeCount = allEdges.filter((e) => activeServiceIds.has(e.service_id)).length;
    console.log(`✅ Graph construit : ${nodeCount} nœuds, ${edgeCount} edges actifs.`);

    return graph;
}