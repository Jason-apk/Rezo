import * as SQLite from "expo-sqlite";
import { create } from "zustand";
import { buildGraph } from "../gtfs/buildGraph";
import { findShortestPath } from "../gtfs/dijkstra";
import { runFullImportPipeline } from "../gtfs/importPipeline";
import {
  getRouteShape,
  getRouteStops,
  RoutePolylinePoint,
  RouteStop,
} from "../gtfs/queries";
import {
  clearAllTables,
  createSchema,
  isImported,
  markImported,
  openDb,
} from "../gtfs/schema";
import { DijkstraResult, Graph, GtfsRoute, GtfsStop } from "../gtfs/types";

interface GtfsState {
  // ─── État ───
  db: SQLite.SQLiteDatabase | null;
  graph: Graph;
  isReady: boolean; // true quand DB ouverte + schéma créé + import fait + graph construit
  isLoading: boolean;
  error: string | null;

  // Données pour l'écran de vérification (liste + compteurs)
  stops: GtfsStop[];
  routes: GtfsRoute[];
  edgeCount: number;

  // Date utilisée pour filtrer le graph (défaut : aujourd'hui)
  selectedDate: Date;

  routeShapesCache: Record<string, RoutePolylinePoint[]>; // clé: `${routeId}_${directionId}`
  routeStopsCache: Record<string, RouteStop[]>;

  loadRouteDetails: (
    routeId: string,
    directionId: number,
  ) => Promise<{
    shape: RoutePolylinePoint[];
    stops: RouteStop[];
  }>;

  // ─── Actions ───
  initialize: () => Promise<void>;
  reimport: () => Promise<void>;
  setSelectedDate: (date: Date) => Promise<void>;
  findPath: (fromStopId: string, toStopId: string) => Promise<DijkstraResult>;
}

export const useGtfsStore = create<GtfsState>((set, get) => ({
  db: null,
  graph: {},
  isReady: false,
  isLoading: false,
  error: null,
  routeShapesCache: {},
  routeStopsCache: {},
  stops: [],
  routes: [],
  edgeCount: 0,
  selectedDate: new Date(),

  loadRouteDetails: async (routeId: string, directionId: number) => {
    const { db, routeShapesCache, routeStopsCache } = get();
    if (!db) throw new Error("loadRouteDetails() appelé avant initialize()");

    const cacheKey = `${routeId}_${directionId}`;

    // Si déjà en cache, on retourne directement (évite une requête DB inutile)
    if (routeShapesCache[cacheKey] && routeStopsCache[cacheKey]) {
      return {
        shape: routeShapesCache[cacheKey],
        stops: routeStopsCache[cacheKey],
      };
    }

    const [shape, stops] = await Promise.all([
      getRouteShape(db, routeId, directionId),
      getRouteStops(db, routeId, directionId),
    ]);

    set({
      routeShapesCache: { ...routeShapesCache, [cacheKey]: shape },
      routeStopsCache: { ...routeStopsCache, [cacheKey]: stops },
    });

    return { shape, stops };
  },

  /**
   * Point d'entrée unique à appeler au démarrage de l'app (ex: dans le
   * layout racine ou le premier écran). Ouvre la DB, crée le schéma,
   * importe le GTFS si besoin, puis construit le graph.
   */
  initialize: async () => {
    set({ isLoading: true, error: null });

    try {
      const db = await openDb();
      await createSchema(db);

      const alreadyImported = await isImported(db);

      if (!alreadyImported) {
        console.log("📦 Aucun import détecté, lancement du pipeline...");
        await runFullImportPipeline(db);
        await markImported(db);
      } else {
        console.log("✅ GTFS déjà importé, pipeline sauté.");
      }

      const graph = await buildGraph(db, get().selectedDate);
      const stops = await db.getAllAsync<GtfsStop>(
        "SELECT * FROM stops ORDER BY stop_name ASC",
      );
      const routes = await db.getAllAsync<GtfsRoute>(
        "SELECT * FROM routes ORDER BY route_short_name ASC",
      );
      const edgeCountRow = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM edges",
      );

      set({
        db,
        graph,
        stops,
        routes,
        edgeCount: edgeCountRow?.count ?? 0,
        isReady: true,
        isLoading: false,
      });
    } catch (err) {
      console.error("❌ Erreur lors de l'initialisation GTFS:", err);
      set({
        error: err instanceof Error ? err.message : "Erreur inconnue",
        isLoading: false,
      });
    }
  },

  /**
   * Vide toutes les tables et relance le pipeline complet.
   * À utiliser via le bouton "Réinitialiser & réimporter" après avoir
   * remplacé les fichiers .txt dans /data/gtfs et rebuild l'app.
   */
  reimport: async () => {
    const { db } = get();
    if (!db) {
      console.warn("⚠️ reimport() appelé avant initialize()");
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await clearAllTables(db);
      await runFullImportPipeline(db);
      await markImported(db);

      const graph = await buildGraph(db, get().selectedDate);
      const stops = await db.getAllAsync<GtfsStop>(
        "SELECT * FROM stops ORDER BY stop_name ASC",
      );
      const routes = await db.getAllAsync<GtfsRoute>(
        "SELECT * FROM routes ORDER BY route_short_name ASC",
      );
      const edgeCountRow = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM edges",
      );

      set({
        graph,
        stops,
        routes,
        edgeCount: edgeCountRow?.count ?? 0,
        isLoading: false,
      });

      console.log("✅ Réimport terminé.");
    } catch (err) {
      console.error("❌ Erreur lors du réimport:", err);
      set({
        error: err instanceof Error ? err.message : "Erreur inconnue",
        isLoading: false,
      });
    }
  },

  /**
   * Change la date utilisée pour filtrer le graph (appelée depuis l'UI
   * quand l'utilisateur choisit une date précise), et reconstruit le graph.
   */
  setSelectedDate: async (date: Date) => {
    const { db } = get();
    if (!db) {
      console.warn("⚠️ setSelectedDate() appelé avant initialize()");
      return;
    }

    const graph = await buildGraph(db, date);
    set({ selectedDate: date, graph });
  },

  /**
   * Calcule le plus court chemin entre deux arrêts, en utilisant le
   * graph actuellement chargé en mémoire (déjà filtré par date).
   */
  findPath: async (fromStopId: string, toStopId: string) => {
    const { db, graph } = get();
    if (!db) {
      throw new Error("findPath() appelé avant initialize()");
    }

    return await findShortestPath(db, graph, fromStopId, toStopId);
  },
}));
