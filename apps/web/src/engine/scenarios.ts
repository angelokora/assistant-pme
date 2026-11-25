import type { Memory, Scenario } from "./types";
import index from "../scenarios/index.json";
import onboarding from "../scenarios/onboarding.json";
import askContract from "../scenarios/ask-contract.json";
import informPayment from "../scenarios/inform-payment.json";
import findBuches from "../scenarios/find-buches.json";
import firstVisit from "../scenarios/memory-first-visit.json";
import returning from "../scenarios/memory-returning.json";

export const SCENARIOS: Record<string, Scenario> = {
  onboarding: onboarding as Scenario,
  "ask-contract": askContract as Scenario,
  "inform-payment": informPayment as Scenario,
  "find-buches": findBuches as Scenario,
};

export type PresetId = "first-visit" | "returning";

export const PRESETS: Record<PresetId, Memory> = {
  "first-visit": firstVisit as unknown as Memory,
  returning: returning as unknown as Memory,
};

export const SCENARIO_INDEX = index.scenarios as { id: string; preset: PresetId; entry: string }[];

export function presetFor(scenarioId: string): PresetId {
  return SCENARIO_INDEX.find((s) => s.id === scenarioId)?.preset ?? "returning";
}
