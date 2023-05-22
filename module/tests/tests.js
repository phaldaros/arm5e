import { ARM5E } from "../config.js";
import { registerAbilityScoresTesting } from "./abilityScoreTesting.js";
import { registerItemCreationTests } from "./itemCreationTests.js";
import { registerRollTesting } from "./rollsTest.js";
import { registerSheetDisplayTests } from "./sheetDisplayTests.js";

export function registerTestSuites(quench) {
  registerAbilityScoresTesting(quench);
  registerRollTesting(quench);
  registerSheetDisplayTests(quench);
  registerItemCreationTests(quench);
}
