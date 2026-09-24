// utils/__test__/busRanking.test.ts
import { BusPosition } from "@/store/useRiderStore";
import { L12Stop, L12StopPoint } from "@/types";
import { rankBuses, resetArrivedBuses } from "../busRanking";

// Petite route à 5 arrêts, en ligne droite, pour simplifier les distances.
// ordre 1 à 5, chacun à ~1.1 km du précédent (0.01° de latitude ≈ 1.1 km).
const routeAller: L12Stop = [
  { id: "S1", nom: "Arrêt 1", lat: 6.1, lon: 1.2, ordre: 1 },
  { id: "S2", nom: "Arrêt 2", lat: 6.11, lon: 1.2, ordre: 2 },
  { id: "S3", nom: "Arrêt 3", lat: 6.12, lon: 1.2, ordre: 3 },
  { id: "S4", nom: "Arrêt 4", lat: 6.13, lon: 1.2, ordre: 4 },
  { id: "S5", nom: "Arrêt 5", lat: 6.14, lon: 1.2, ordre: 5 },
];

const routeStopsByDirection = { aller: routeAller, retour: [] };

const userStop: L12StopPoint = routeAller[2]; // Arrêt 3, ordre 3

function makeBus(overrides: Partial<BusPosition>): BusPosition {
  return {
    bus_id: "B01",
    lat: 6.1,
    lng: 1.2,
    direction: "aller",
    status: "normal",
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// arrivedBusIds est un état partagé au niveau du module (voir busRanking.ts) —
// sans ce reset, un test pourrait "polluer" le suivant avec un bus resté marqué
// arrivé d'un cas précédent. C'est le prix d'un état module-level : chaque test
// doit explicitement repartir de zéro.
beforeEach(() => {
  resetArrivedBuses();
});

test("un bus loin du userStop obtient un ETA positif et n'est pas bloqué", () => {
  const bus = makeBus({ lat: 6.1, lng: 1.2 }); // proche de l'arrêt 1, loin de l'arrêt 3
  const result = rankBuses([bus], userStop, routeStopsByDirection);

  expect(result[0].isBlocked).toBe(false);
  expect(result[0].etaMinutes).toBeGreaterThan(0);
});

test("un bus en panne est marqué bloqué même s'il est proche", () => {
  const bus = makeBus({ lat: 6.12, lng: 1.2, status: "panne" });
  const result = rankBuses([bus], userStop, routeStopsByDirection);

  expect(result[0].isBlocked).toBe(true);
});

test("un bus qui n'a pas émis depuis longtemps est signalé stale et bloqué", () => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const bus = makeBus({ lat: 6.12, lng: 1.2, updated_at: twoHoursAgo });
  const result = rankBuses([bus], userStop, routeStopsByDirection);

  expect(result[0].isStale).toBe(true);
  expect(result[0].isBlocked).toBe(true);
});

test("un bus qui a dépassé l'arrêt de l'usager est marqué hasPassedStop", () => {
  // Positionné près de l'arrêt 5 (ordre 5), bien au-delà de l'arrêt 3 (ordre 3, + tolérance 1)
  const bus = makeBus({ lat: 6.14, lng: 1.2 });
  const result = rankBuses([bus], userStop, routeStopsByDirection);

  expect(result[0].hasPassedStop).toBe(true);
  expect(result[0].isBlocked).toBe(true);
});

test("régression : un bus resté marqué arrivé ne redevient jamais disponible, même si le GPS oscille", () => {
  // 1er appel : le bus est loin devant (dépassé) → marqué arrivé
  const busFarAhead = makeBus({ lat: 6.14, lng: 1.2 });
  let result = rankBuses([busFarAhead], userStop, routeStopsByDirection);
  expect(result[0].hasPassedStop).toBe(true);

  // 2e appel : bruit GPS, le même bus semble "revenir" près de l'arrêt 3
  const busNoisyBack = makeBus({ lat: 6.12, lng: 1.2 });
  result = rankBuses([busNoisyBack], userStop, routeStopsByDirection);

  // Sans le fix de la tâche 1, ce test échouerait ici : hasPassedStop repasserait à false
  // et l'ETA remonterait pour l'usager — exactement le bug observé en pilote.
  expect(result[0].hasPassedStop).toBe(true);
  expect(result[0].isBlocked).toBe(true);
});

test("resetArrivedBuses libère un bus précédemment marqué arrivé", () => {
  const busFarAhead = makeBus({ lat: 6.14, lng: 1.2 });
  rankBuses([busFarAhead], userStop, routeStopsByDirection);

  resetArrivedBuses(); // équivalent d'un changement d'arrêt/direction côté usager

  const busNearAgain = makeBus({ lat: 6.12, lng: 1.2 });
  const result = rankBuses([busNearAgain], userStop, routeStopsByDirection);

  expect(result[0].hasPassedStop).toBe(false);
});

test("le classement trie les bus disponibles par distance croissante, bloqués en dernier", () => {
  const busClose = makeBus({ bus_id: "B_close", lat: 6.115, lng: 1.2 });
  const busFar = makeBus({ bus_id: "B_far", lat: 6.1, lng: 1.2 });
  const busBroken = makeBus({
    bus_id: "B_broken",
    lat: 6.119,
    lng: 1.2,
    status: "panne",
  });

  const result = rankBuses(
    [busFar, busBroken, busClose],
    userStop,
    routeStopsByDirection,
  );

  expect(result.map((b) => b.bus_id)).toEqual(["B_close", "B_far", "B_broken"]);
});
