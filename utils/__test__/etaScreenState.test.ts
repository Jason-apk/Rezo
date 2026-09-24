// utils/__test__/etaScreenState.test.ts
import { RankedBus } from "../busRanking";
import { getScreenVariant } from "../etaScreenState";

function makeRankedBus(overrides: Partial<RankedBus>): RankedBus {
  return {
    bus_id: "B01",
    lat: 6.12,
    lng: 1.2,
    direction: "aller",
    status: "normal",
    updated_at: new Date().toISOString(),
    distanceKm: 1,
    etaMinutes: 5,
    isBlocked: false,
    isStale: false,
    hasPassedStop: false,
    ...overrides,
  };
}

test("hors ligne prime sur tout le reste", () => {
  const bus = makeRankedBus({});
  expect(getScreenVariant([bus], true, bus)).toBe("offline");
});

test("aucun bus dans la liste = no_tracking", () => {
  expect(getScreenVariant([], false, undefined)).toBe("no_tracking");
});

test("un topBus disponible avec ETA positif = normal", () => {
  const bus = makeRankedBus({ etaMinutes: 5 });
  expect(getScreenVariant([bus], false, bus)).toBe("normal");
});

test("un topBus disponible en embouteillage = embouteillage", () => {
  const bus = makeRankedBus({ etaMinutes: 5, status: "embouteillage" });
  expect(getScreenVariant([bus], false, bus)).toBe("embouteillage");
});

test("un topBus avec ETA à 0 = arrived", () => {
  const bus = makeRankedBus({ etaMinutes: 0 });
  expect(getScreenVariant([bus], false, bus)).toBe("arrived");
});

test("tous les bus stale et aucun topBus = no_tracking", () => {
  const bus = makeRankedBus({ isBlocked: true, isStale: true });
  expect(getScreenVariant([bus], false, undefined)).toBe("no_tracking");
});

test("tous les bus en pause et aucun topBus = pause", () => {
  const bus = makeRankedBus({ isBlocked: true, status: "pause" });
  expect(getScreenVariant([bus], false, undefined)).toBe("pause");
});

test("le premier bus en panne (non stale, non pause) et aucun topBus = panne", () => {
  const bus = makeRankedBus({ isBlocked: true, status: "panne" });
  expect(getScreenVariant([bus], false, undefined)).toBe("panne");
});

test("le premier bus plein (non stale, non pause) et aucun topBus = plein", () => {
  const bus = makeRankedBus({ isBlocked: true, status: "plein" });
  expect(getScreenVariant([bus], false, undefined)).toBe("plein");
});

test("tous les bus ont dépassé l'arrêt, aucune autre cause dominante = no_tracking", () => {
  const bus = makeRankedBus({ isBlocked: true, hasPassedStop: true });
  expect(getScreenVariant([bus], false, undefined)).toBe("no_tracking");
});
