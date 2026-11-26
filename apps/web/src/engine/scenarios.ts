import { hardenMoneySpaces } from "@elea/ds";
import type { Memory, Scenario } from "./types";
import index from "../scenarios/index.json";
import onboarding from "../scenarios/onboarding.json";
import askSubcontract from "../scenarios/ask-subcontract.json";
import informPayment from "../scenarios/inform-payment.json";
import findHourlyRate from "../scenarios/find-hourly-rate.json";
import addDocument from "../scenarios/add-document.json";
import firstVisit from "../scenarios/memory-first-visit.json";
import returning from "../scenarios/memory-returning.json";

/** Garantit les séparateurs de milliers FR sur tout montant « N € » des JSON. */
function hardenData<T>(data: T): T {
  return JSON.parse(hardenMoneySpaces(JSON.stringify(data))) as T;
}

export const SCENARIOS: Record<string, Scenario> = {
  onboarding: hardenData(onboarding as Scenario),
  "ask-subcontract": hardenData(askSubcontract as Scenario),
  "inform-payment": hardenData(informPayment as Scenario),
  "find-hourly-rate": hardenData(findHourlyRate as Scenario),
  "add-document": hardenData(addDocument as Scenario),
};

export type PresetId = "first-visit" | "returning";

export const PRESETS: Record<PresetId, Memory> = {
  "first-visit": hardenData(firstVisit as unknown as Memory),
  returning: hardenData(returning as unknown as Memory),
};

export const SCENARIO_INDEX = index.scenarios as { id: string; preset: PresetId; entry: string }[];

export function presetFor(scenarioId: string): PresetId {
  return SCENARIO_INDEX.find((s) => s.id === scenarioId)?.preset ?? "returning";
}
