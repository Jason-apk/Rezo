// utils/trial.ts
const TRIAL_DAYS = 0;

export function isTrialExpired(firstLaunchAt: string | null): boolean {
  if (!firstLaunchAt) return false; // pas encore de date = premier lancement, essai non expiré
  const elapsedMs = Date.now() - new Date(firstLaunchAt).getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  return elapsedDays >= TRIAL_DAYS;
}
