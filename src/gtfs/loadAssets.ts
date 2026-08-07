import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import Papa from "papaparse";
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
 * Charge un fichier GTFS (.txt = CSV) depuis les assets bundlés,
 * et retourne son contenu parsé en tableau d'objets typés.
 *
 * @param assetModule Résultat d'un require('../../data/gtfs/xxx.txt')
 */
async function loadGtfsFile<T>(assetModule: number): Promise<T[]> {
    // 1. Résoudre l'asset (le télécharger localement si besoin)
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();

    if (!asset.localUri) {
        throw new Error("Impossible de résoudre le chemin local de l'asset GTFS.");
    }

    // 2. Lire le contenu texte brut du fichier
    const rawContent = await FileSystem.readAsStringAsync(asset.localUri);

    // 3. Parser le CSV en tableau d'objets
    const result = Papa.parse<T>(rawContent, {
        header: true, // utilise la 1ère ligne comme noms de colonnes
        dynamicTyping: true, // convertit automatiquement "6.13" en 6.13, "1" en 1
        skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
        console.warn(
            `⚠️ Erreurs de parsing dans un fichier GTFS:`,
            result.errors.slice(0, 5) // on n'affiche que les 5 premières pour ne pas noyer les logs
        );
    }

    return result.data;
}

/**
 * Charge les 8 fichiers GTFS en parallèle et retourne tout dans un seul objet.
 * C'est LA fonction à appeler depuis le pipeline d'import.
 */
export async function loadAllGtfsFiles() {
    const [
        agency,
        stops,
        routes,
        calendar,
        calendarDates,
        trips,
        stopTimes,
        shapes,
    ] = await Promise.all([
        loadGtfsFile<GtfsAgency>(require("../../data/gtfs/agency.txt")),
        loadGtfsFile<GtfsStop>(require("../../data/gtfs/stops.txt")),
        loadGtfsFile<GtfsRoute>(require("../../data/gtfs/routes.txt")),
        loadGtfsFile<GtfsCalendar>(require("../../data/gtfs/calendar.txt")),
        loadGtfsFile<GtfsCalendarDate>(require("../../data/gtfs/calendar_dates.txt")),
        loadGtfsFile<GtfsTrip>(require("../../data/gtfs/trips.txt")),
        loadGtfsFile<GtfsStopTime>(require("../../data/gtfs/stop_times.txt")),
        loadGtfsFile<GtfsShapePoint>(require("../../data/gtfs/shapes.txt")),
    ]);

    return {
        agency,
        stops,
        routes,
        calendar,
        calendarDates,
        trips,
        stopTimes,
        shapes,
    };
}