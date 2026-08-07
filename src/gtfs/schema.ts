import * as SQLite from "expo-sqlite";

export const DB_NAME = "rezo_gtfs.db";

/**
 * Ouvre (ou crée) la base de données.
 * expo-sqlite crée automatiquement le fichier s'il n'existe pas encore.
 */
export async function openDb(): Promise<SQLite.SQLiteDatabase> {
    return await SQLite.openDatabaseAsync(DB_NAME);
}

/**
 * Crée toutes les tables si elles n'existent pas encore.
 * À appeler une seule fois au démarrage, avant tout import.
 */
export async function createSchema(db: SQLite.SQLiteDatabase): Promise<void> {
    await db.execAsync(`
    PRAGMA journal_mode = WAL;

    -- ─── Table meta : sert à savoir si l'import a déjà eu lieu ───
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    -- ─── Tables GTFS brutes (1:1 avec les fichiers .txt) ───

    CREATE TABLE IF NOT EXISTS agency (
      agency_id TEXT PRIMARY KEY NOT NULL,
      agency_name TEXT,
      agency_url TEXT,
      agency_timezone TEXT,
      agency_lang TEXT,
      agency_phone TEXT
    );

    CREATE TABLE IF NOT EXISTS stops (
      stop_id TEXT PRIMARY KEY NOT NULL,
      stop_code TEXT,
      stop_name TEXT,
      stop_desc TEXT,
      stop_lat REAL,
      stop_lon REAL
    );

    CREATE TABLE IF NOT EXISTS routes (
      route_id TEXT PRIMARY KEY NOT NULL,
      agency_id TEXT,
      route_short_name TEXT,
      route_long_name TEXT,
      route_type INTEGER,
      route_color TEXT,
      route_text_color TEXT
    );

    CREATE TABLE IF NOT EXISTS calendar (
      service_id TEXT PRIMARY KEY NOT NULL,
      monday INTEGER,
      tuesday INTEGER,
      wednesday INTEGER,
      thursday INTEGER,
      friday INTEGER,
      saturday INTEGER,
      sunday INTEGER,
      start_date TEXT,
      end_date TEXT
    );

    CREATE TABLE IF NOT EXISTS calendar_dates (
      service_id TEXT NOT NULL,
      date TEXT NOT NULL,
      exception_type INTEGER,
      PRIMARY KEY (service_id, date)
    );

    CREATE TABLE IF NOT EXISTS trips (
      trip_id TEXT PRIMARY KEY NOT NULL,
      route_id TEXT,
      service_id TEXT,
      trip_headsign TEXT,
      direction_id INTEGER,
      shape_id TEXT
    );

    CREATE TABLE IF NOT EXISTS stop_times (
      trip_id TEXT NOT NULL,
      arrival_time TEXT,
      departure_time TEXT,
      stop_id TEXT NOT NULL,
      stop_sequence INTEGER NOT NULL,
      PRIMARY KEY (trip_id, stop_sequence)
    );

    CREATE TABLE IF NOT EXISTS shapes (
      shape_id TEXT NOT NULL,
      shape_pt_lon REAL,
      shape_pt_lat REAL,
      shape_pt_sequence INTEGER NOT NULL,
      shape_dist_traveled REAL,
      PRIMARY KEY (shape_id, shape_pt_sequence)
    );

    -- ─── Table dérivée : edges (générée par notre pipeline, pas du GTFS brut) ───

    CREATE TABLE IF NOT EXISTS edges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_stop_id TEXT NOT NULL,
      to_stop_id TEXT NOT NULL,
      route_id TEXT NOT NULL,
      direction_id INTEGER NOT NULL,
      service_id TEXT NOT NULL,
      cost_seconds INTEGER NOT NULL
    );

    -- Index pour accélérer la construction du graph (recherche par from_stop_id)
    CREATE INDEX IF NOT EXISTS idx_edges_from ON edges (from_stop_id);
    CREATE INDEX IF NOT EXISTS idx_stop_times_trip ON stop_times (trip_id);
  `);
}

/**
 * Vide toutes les tables (utilisé par le bouton "Réinitialiser & réimporter").
 * Ne supprime pas le schéma, juste les données.
 */
export async function clearAllTables(db: SQLite.SQLiteDatabase): Promise<void> {
    await db.execAsync(`
    DELETE FROM edges;
    DELETE FROM shapes;
    DELETE FROM stop_times;
    DELETE FROM trips;
    DELETE FROM calendar_dates;
    DELETE FROM calendar;
    DELETE FROM routes;
    DELETE FROM stops;
    DELETE FROM agency;
    DELETE FROM meta;
  `);
}

/**
 * Vérifie si l'import GTFS a déjà eu lieu.
 */
export async function isImported(db: SQLite.SQLiteDatabase): Promise<boolean> {
    const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM meta WHERE key = 'imported'"
    );
    return row?.value === "true";
}

/**
 * Marque l'import comme terminé.
 */
export async function markImported(db: SQLite.SQLiteDatabase): Promise<void> {
    await db.runAsync(
        "INSERT OR REPLACE INTO meta (key, value) VALUES ('imported', 'true')"
    );
}