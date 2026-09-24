// config.ts
// Toutes les constantes ajustables de l'app Rider, centralisées ici.
// Objectif : pouvoir recalibrer après les tests terrain sans chasser
// les valeurs éparpillées dans chaque fichier.

export const RANKING_CONFIG = {
  // Vitesse moyenne utilisée pour convertir une distance en ETA (km/h).
  AVG_SPEED_KMH: 15,
  // Au-delà de ce délai sans nouvelle position, un bus est considéré "signal perdu".
  STALE_THRESHOLD_MS: 2 * 60 * 1000,
  // Marge (en nombre d'arrêts) avant de considérer qu'un bus a dépassé l'arrêt de l'usager.
  PASSED_TOLERANCE: 1,
  BLOCKED_STATUSES: ["panne", "pause", "plein"] as const,
};

export const TRIAL_CONFIG = {
  TRIAL_DAYS: 30,
};

export const ETA_LOGGER_CONFIG = {
  // Fréquence minimale entre deux logs d'ETA pour le même topBus (évite de saturer eta_logs).
  THROTTLE_MS: 30_000,
};

export const FEEDBACK_CONFIG = {
  // Délai entre "bus arrivé" et l'affichage de la demande de feedback.
  ARRIVED_TO_FEEDBACK_DELAY_MS: __DEV__ ? 3_000 : 5000,
  // Délai avant d'enregistrer "no_response" si l'usager ne répond pas.
  FEEDBACK_TIMEOUT_MS: __DEV__ ? 10_000 : 20_000,
};
