// ─── Types bruts GTFS (correspondent 1:1 aux colonnes des fichiers .txt) ───

export interface GtfsAgency {
    agency_id: string;
    agency_name: string;
    agency_url: string;
    agency_timezone: string;
    agency_lang: string;
    agency_phone: string;
}

export interface GtfsStop {
    stop_id: string;
    stop_code: string;
    stop_name: string;
    stop_desc: string;
    stop_lat: number;
    stop_lon: number;
}

export interface GtfsStopTime {
    trip_id: string;
    arrival_time: string; // format "HH:MM:SS"
    departure_time: string;
    stop_id: string;
    stop_sequence: number;
}

export interface GtfsCalendar {
    service_id: string;
    monday: number; // 0 ou 1
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
    start_date: string; // format "YYYYMMDD"
    end_date: string;
}

export interface GtfsCalendarDate {
    service_id: string;
    date: string; // "YYYYMMDD"
    exception_type: number; // 1 = ajouté, 2 = retiré
}

export interface GtfsTrip {
    route_id: string;
    service_id: string;
    trip_id: string;
    trip_headsign: string;
    direction_id: number; // 0 ou 1
    shape_id: string;
}

export interface GtfsShapePoint {
    shape_id: string;
    shape_pt_lon: number;
    shape_pt_lat: number;
    shape_pt_sequence: number;
    shape_dist_traveled: number | null;
}

export interface GtfsRoute {
    route_id: string;
    agency_id: string;
    route_short_name: string;
    route_long_name: string;
    route_type: number;
    route_color: string;
    route_text_color: string;
}

// ─── Types dérivés (générés par notre pipeline, pas dans le GTFS brut) ───

export interface GtfsEdge {
    id: number;
    from_stop_id: string;
    to_stop_id: string;
    route_id: string;
    direction_id: number;
    service_id: string;
    cost_seconds: number; // temps de trajet entre les deux arrêts
}

// ─── Types pour le graph en mémoire ───

export interface GraphEdge {
    toStopId: string;
    costSeconds: number;
    routeId: string;
    directionId: number;
}

// adjacency list : chaque stop_id pointe vers ses voisins accessibles
export type Graph = Record<string, GraphEdge[]>;

// ─── Résultat Dijkstra ───

export interface PathStep {
    stopId: string;
    stopName: string;
    routeId: string | null; // null pour le premier arrêt (pas d'edge entrant)
}

export interface DijkstraResult {
    found: boolean;
    totalCostSeconds: number;
    path: PathStep[];
}