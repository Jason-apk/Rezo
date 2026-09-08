// utils/time.ts
export function formatArrivalTime(etaMinutes: number): string {
  const arrival = new Date(Date.now() + etaMinutes * 60000);
  return arrival
    .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    .replace(":", "h");
}
