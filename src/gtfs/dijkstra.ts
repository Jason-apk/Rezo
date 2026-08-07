import * as SQLite from "expo-sqlite";
import { DijkstraResult, Graph, PathStep } from "./types";

/**
 * ─────────────────────────────────────────────────────────────
 * COMPRENDRE DIJKSTRA — explication pas à pas
 * ─────────────────────────────────────────────────────────────
 *
 * Objectif : trouver le chemin le "moins cher" (ici : le plus rapide
 * en secondes) entre un arrêt de départ et un arrêt d'arrivée, à
 * travers le graph construit à l'étape précédente.
 *
 * Trois structures de données suivent l'état de la recherche :
 *
 * 1. `distances` : pour chaque arrêt, le coût minimum connu pour
 *    l'atteindre depuis le départ. Au début, tout est "infini"
 *    sauf le départ (0).
 *
 * 2. `previous` : pour chaque arrêt, quel est l'arrêt précédent sur
 *    le meilleur chemin trouvé jusqu'ici. Ça sert à reconstruire le
 *    chemin complet à la fin, en remontant la chaîne depuis l'arrivée.
 *
 * 3. `visited` : les arrêts déjà "finalisés" (on est sûr que leur
 *    distance ne changera plus, donc pas besoin de les revisiter).
 *
 * L'algorithme, en boucle :
 *
 *   a. Parmi tous les arrêts NON visités, prendre celui qui a la
 *      distance connue la plus faible (c'est la "priority queue" —
 *      ici implémentée simplement avec un tri de tableau, largement
 *      suffisant pour un graph de quelques milliers de nœuds).
 *
 *   b. Marquer cet arrêt comme visité.
 *
 *   c. Regarder tous ses voisins directs (via graph[arret]).
 *      Pour chaque voisin : est-ce que passer par l'arrêt actuel
 *      donne un chemin moins cher que ce qu'on connaissait déjà
 *      pour ce voisin ? Si oui, on met à jour `distances` et
 *      `previous`.
 *
 *   d. On répète jusqu'à avoir visité l'arrêt d'arrivée (ou jusqu'à
 *      ce qu'il ne reste plus d'arrêts accessibles).
 *
 * ─────────────────────────────────────────────────────────────
 */

export function dijkstra(
    graph: Graph,
    startStopId: string,
    endStopId: string
): DijkstraResult {
    const distances: Record<string, number> = {};
    const previous: Record<string, { stopId: string; routeId: string } | null> = {};
    const visited = new Set<string>();

    // Initialisation : tous les arrêts connus du graph à l'infini,
    // sauf le départ à 0.
    for (const stopId of Object.keys(graph)) {
        distances[stopId] = Infinity;
        previous[stopId] = null;
    }
    distances[startStopId] = 0;

    while (true) {
        // ─── a. Trouver l'arrêt non visité avec la plus petite distance ───
        let currentStopId: string | null = null;
        let currentBestDistance = Infinity;

        for (const stopId of Object.keys(distances)) {
            if (!visited.has(stopId) && distances[stopId] < currentBestDistance) {
                currentBestDistance = distances[stopId];
                currentStopId = stopId;
            }
        }

        // Plus aucun arrêt accessible → on arrête (soit on a fini,
        // soit la destination est inatteignable depuis le départ)
        if (currentStopId === null) {
            break;
        }

        // On est arrivé à destination → on peut s'arrêter immédiatement
        if (currentStopId === endStopId) {
            break;
        }

        // ─── b. Marquer comme visité ───
        visited.add(currentStopId);

        // ─── c. Explorer les voisins ───
        const neighbors = graph[currentStopId] || [];
        for (const edge of neighbors) {
            if (visited.has(edge.toStopId)) continue;

            const candidateDistance = distances[currentStopId] + edge.costSeconds;

            if (candidateDistance < distances[edge.toStopId]) {
                distances[edge.toStopId] = candidateDistance;
                previous[edge.toStopId] = {
                    stopId: currentStopId,
                    routeId: edge.routeId,
                };
            }
        }
    }

    // ─── Reconstruction du chemin ───
    if (distances[endStopId] === undefined || distances[endStopId] === Infinity) {
        return { found: false, totalCostSeconds: 0, path: [] };
    }

    const reversedPath: { stopId: string; routeId: string | null }[] = [];
    let cursor: string | null = endStopId;

    while (cursor !== null) {
        const prev: { stopId: string; routeId: string } | null = previous[cursor];
        reversedPath.push({ stopId: cursor, routeId: prev?.routeId ?? null });
        cursor = prev?.stopId ?? null;
    }

    reversedPath.reverse();

    return {
        found: true,
        totalCostSeconds: distances[endStopId],
        path: reversedPath.map((step) => ({
            stopId: step.stopId,
            stopName: "", // rempli ensuite par findShortestPath (a besoin de la DB)
            routeId: step.routeId,
        })),
    };
}

/**
 * Fonction "prête à l'emploi" : calcule le plus court chemin et
 * enrichit le résultat avec les noms d'arrêts lisibles (stop_name).
 * C'est cette fonction que le reste de l'app doit appeler.
 */
export async function findShortestPath(
    db: SQLite.SQLiteDatabase,
    graph: Graph,
    startStopId: string,
    endStopId: string
): Promise<DijkstraResult> {
    const result = dijkstra(graph, startStopId, endStopId);

    if (!result.found) {
        return result;
    }

    // Récupérer les noms d'arrêts pour affichage lisible
    const stopIds = result.path.map((step) => step.stopId);
    const placeholders = stopIds.map(() => "?").join(", ");
    const stopRows = await db.getAllAsync<{ stop_id: string; stop_name: string }>(
        `SELECT stop_id, stop_name FROM stops WHERE stop_id IN (${placeholders})`,
        stopIds
    );

    const nameById = new Map(stopRows.map((row) => [row.stop_id, row.stop_name]));

    const enrichedPath: PathStep[] = result.path.map((step) => ({
        ...step,
        stopName: nameById.get(step.stopId) ?? step.stopId,
    }));

    return { ...result, path: enrichedPath };
}