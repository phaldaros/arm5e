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
      describe(`Diary entries tests`, function () {
        before(async function () {
          magus = await Actor.create({
            name: `JasquierTheChronicler`,
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
        describe("Conflict test", function () {
          it(`Legacy diary`, async function () {
            const entryData = [
              {
                name: `Legacy diary`,
                type: "diaryEntry",
                system: {
                  done: false,
                  cappedGain: false,
                  dates: [{ year: 1220, season: "winter", date: "The Date", applied: true }],
                  sourceQuality: 42,
                  activity: "none",
                  progress: {
                    abilities: [],
                    arts: [],
                    spells: [],
                    newSpells: []
                  },
                  optionKey: "standard",
                  duration: 1,
                  description: `Some label for it`,
                  externalIds: []
                }
              },
              {
                name: `Legacy diary 2`,
                type: "diaryEntry",
                system: {
                  done: false,
                  cappedGain: false,
                  dates: [{ year: 1220, season: "winter", date: "The Date", applied: true }],
                  sourceQuality: 42,
                  activity: "none",
                  progress: {
                    abilities: [],
                    arts: [],
                    spells: [],
                    newSpells: []
                  },
                  optionKey: "standard",
                  duration: 1,
                  description: `Some label for it`,
                  externalIds: []
                }
              }
            ];
            let entry = await magus.createEmbeddedDocuments("Item", entryData, {});
            assert.equal(entry.length, 2, "Item created");
            assert.equal(
              entry[0].system.hasScheduleConflict(magus),
              false,
              "There should be no conflict"
            );
          });

          after(async function () {
            let diariesIds = magus.items.filter((e) => e.type === "diaryEntry").map((e) => e._id);
            await magus.deleteEmbeddedDocuments("Item", diariesIds);
          });
        });
        describe("Conflicts test", function () {
          let tmpDate = { year: 1200, season: "spring" };
          for (const [key1, act1] of Object.entries(ARM5E.activities.generic)) {
            // magus.sheet.render(true);

            log(false, `date : ${JSON.stringify(tmpDate)}`);

            for (const [key2, act2] of Object.entries(ARM5E.activities.generic)) {
              tmpDate = { year: tmpDate.year, season: tmpDate.season };
              it(`${game.i18n.localize(act1.label)} vs ${game.i18n.localize(
                act2.label
              )}`, async function () {
                const entryData = [
                  {
                    name: `${game.i18n.localize(act1.label)}'s sheet`,
                    type: "diaryEntry",
                    system: {
                      done: false,
                      cappedGain: false,
                      dates: [
                        {
                          year: tmpDate.year,
                          season: tmpDate.season,
                          date: "The Date",
                          applied: false
                        }
                      ],
                      sourceQuality: 42,
                      activity: key1,
                      progress: {
                        abilities: [],
                        arts: [],
                        spells: [],
                        newSpells: []
                      },
                      optionKey: "standard",
                      duration: act1.duration ? act1.duration : 1,
                      description: `Some label for ${game.i18n.localize(act1.label)}`,
                      externalIds: []
                    }
                  },
                  {
                    name: `${game.i18n.localize(act2.label)}'s sheet`,
                    type: "diaryEntry",
                    system: {
                      done: false,
                      cappedGain: false,
                      dates: [
                        {
                          year: tmpDate.year,
                          season: tmpDate.season,
                          date: "The Date",
                          applied: false
                        }
                      ],
                      sourceQuality: 42,
                      activity: key2,
                      progress: {
                        abilities: [],
                        arts: [],
                        spells: [],
                        newSpells: []
                      },
                      optionKey: "standard",
                      duration: act2.duration ? act2.duration : 1,
                      description: `Some label for ${game.i18n.localize(act2.label)}`,
                      externalIds: []
                    }
                  }
                ];
                let entries = await magus.createEmbeddedDocuments("Item", entryData, {});
                assert.equal(entries.length, 2, "Item created");
                let hasConflict = true;
                if (key1 === key2) {
                  hasConflict = !CONFIG.ARM5E.activities.duplicateAllowed.includes(key2);
                } else {
                  hasConflict = !(
                    CONFIG.ARM5E.activities.conflictExclusion.includes(key1) ||
                    CONFIG.ARM5E.activities.conflictExclusion.includes(key2)
                  );
                }
                assert.equal(
                  entries[0].system.hasScheduleConflict(magus),
                  hasConflict,
                  hasConflict ? "There should be a conflict" : "There should be no conflict"
                );
                tmpDate = nextDate(tmpDate.season, tmpDate.year);
                await magus.deleteEmbeddedDocuments(
                  "Item",
                  entries.map((e) => e._id)
                );
              });
            }
          }
          after(async function () {
            let diariesIds = magus.items.filter((e) => e.type === "diaryEntry").map((e) => e._id);
            await magus.deleteEmbeddedDocuments("Item", diariesIds);
          });
          // magus.sheet.close();
        });
        describe("Display sheet test", function () {
          let tmpDate = { year: 1220, season: "spring" };
          for (const [key, act] of Object.entries(ARM5E.activities.generic)) {
            tmpDate = { year: tmpDate.year, season: tmpDate.season };

            log(false, `date : ${JSON.stringify(tmpDate)}`);
            it(`${game.i18n.localize(act.label)}'s sheet`, async function () {
              const entryData = [
                {
                  name: `${game.i18n.localize(act.label)}'s sheet`,
                  type: "diaryEntry",
                  system: {
                    done: false,
                    cappedGain: false,
                    dates: [
                      {
                        year: tmpDate.year,
                        season: tmpDate.season,
                        date: "The Date",
                        applied: false
                      }
                    ],
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
              assert.equal(
                entry[0].system.hasScheduleConflict(magus),
                false,
                "There should be no conflict"
              );
              await entry[0].sheet._onProgressApply();
              await entry[0].sheet.close();
              tmpDate = nextDate(tmpDate.season, tmpDate.year);
            });
          }
          after(async function () {
            let diariesIds = magus.items.filter((e) => e.type === "diaryEntry").map((e) => e._id);
            await magus.deleteEmbeddedDocuments("Item", diariesIds);
          });
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
