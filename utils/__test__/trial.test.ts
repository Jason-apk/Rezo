// utils/trial.test.ts
import { isTrialExpired } from "@/utils/trial";

test("pas de date = essai non expiré", () => {
  expect(isTrialExpired(null)).toBe(false);
});

test("essai non expiré à 10 jours", () => {
  const tenDaysAgo = new Date(
    Date.now() - 10 * 24 * 60 * 60 * 1000,
  ).toISOString();
  expect(isTrialExpired(tenDaysAgo)).toBe(false);
});

test("essai expiré à 35 jours", () => {
  const thirtyFiveDaysAgo = new Date(
    Date.now() - 35 * 24 * 60 * 60 * 1000,
  ).toISOString();
  expect(isTrialExpired(thirtyFiveDaysAgo)).toBe(true);
});
