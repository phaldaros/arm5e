import { ARM5E } from "../config.js";
import { createRoll, stressDie } from "../dice.js";
import { StressDieInternal } from "../helpers/stressdie.js";
import { log, sleep } from "../tools.js";
import { nextDate } from "../tools/time.js";
import { registerAbilityScoresTesting } from "./abilityScoreTesting.js";
import { registerItemCreationTests } from "./itemCreationTests.js";
import { registerRollTesting } from "./rollsTest.js";
import { registerSheetDisplayTests } from "./sheetDisplayTests.js";
import { registerStressDieTesting } from "./stressDieTesting.js";
import {
  athleticsSkill,
  companionData,
  languageSkill,
  magicTheorySkill,
  magusData,
  penetrationSkill,
  readingSkill,
  spellData1
} from "./testData.js";
import { registerDiaryTesting } from "./testSchedule.js";

export function registerTestSuites(quench) {
  registerDiaryTesting(quench);
  registerStressDieTesting(quench);
  registerAbilityScoresTesting(quench);
  registerRollTesting(quench);
  registerSheetDisplayTests(quench);
  registerItemCreationTests(quench);
}
