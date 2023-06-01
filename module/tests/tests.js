import { ARM5E } from "../config.js";
import { createRoll, stressDie } from "../dice.js";
import { StressDieInternal } from "../helpers/stressdie.js";
import { log, sleep } from "../tools.js";
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

export function registerTestSuites(quench) {
  registerDiaryTesting(quench);
  registerStressDieTesting(quench);
  registerAbilityScoresTesting(quench);
  registerRollTesting(quench);
  registerSheetDisplayTests(quench);
  registerItemCreationTests(quench);
}

export function registerDiaryTesting(quench) {
  quench.registerBatch(
    "Ars-Diary",
    (context) => {
      let magus;
      let Sp1;
      const { describe, it, assert, after, before } = context;
      describe(``, function () {
        before(async function () {
          magus = await Actor.create({
            name: `JasquierTheChroniquer`,
            type: "player",
            system: magusData
          });
          await magus.sheet._itemCreate({
            name: "Penetration",
            type: "ability",
            ...penetrationSkill
          });
          await magus.sheet._itemCreate({
            name: "Artes liberales",
            type: "ability",
            ...readingSkill
          });

          await magus.sheet._itemCreate({
            name: "Athletics",
            type: "ability",
            ...athleticsSkill
          });
          await magus.sheet._itemCreate({
            name: "Magic Theory",
            type: "ability",
            ...magicTheorySkill
          });
          await magus.sheet._itemCreate({ name: "Gaelic", type: "ability", ...languageSkill });
          Sp1 = (
            await magus.sheet._itemCreate({
              name: "Standard spell",
              type: "spell",
              ...spellData1
            })
          )[0];
        });
        describe("Display sheet test", function () {
          for (const [key, act] of Object.entries(ARM5E.activities.generic)) {
            it(`${game.i18n.localize(act.label)}'s sheet`, async function () {
              const entryData = [
                {
                  name: `${game.i18n.localize(act.label)}'s sheet`,
                  type: "diaryEntry",
                  system: {
                    done: false,
                    cappedGain: false,
                    dates: [{ year: 1220, season: "winter", date: "The Date", applied: true }],
                    sourceQuality: 42,
                    activity: key,
                    progress: {
                      abilities: [],
                      arts: [],
                      spells: [],
                      newSpells: []
                    },
                    optionKey: "standard",
                    duration: 1,
                    description: `Some label for ${game.i18n.localize(act.label)}`,
                    externalIds: []
                  }
                }
              ];
              let entry = await magus.createEmbeddedDocuments("Item", entryData, {});
              assert.equal(entry.length, 1, "Item created");
              entry[0].sheet.render(true);
              await sleep(100);
              await entry[0].sheet._onProgressApply();
              await entry[0].sheet.close();
            });
          }
          after(async function () {});
        });
        after(async function () {
          if (magus) {
            await magus.delete();
          }
        });
      });
    },
    { displayName: "ARS : Diary and activity sheets" }
  );
}
