/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const ArM5ePreloadHandlebarsTemplates = async function() {
  return loadTemplates([
    // Actor Sheet Partials
    "systems/arm5e/templates/actor/parts/actor-characteristics.html",
    "systems/arm5e/templates/actor/parts/actor-fatigue.html",
    "systems/arm5e/templates/actor/parts/actor-description.html",
    "systems/arm5e/templates/actor/parts/actor-abilities.html",
    "systems/arm5e/templates/actor/parts/actor-arts.html",
    "systems/arm5e/templates/actor/parts/actor-inventory.html",
    "systems/arm5e/templates/actor/parts/actor-combat.html",
    "systems/arm5e/templates/actor/parts/actor-virtuesFlaws.html",
    "systems/arm5e/templates/actor/parts/actor-familiar.html",
    "systems/arm5e/templates/actor/parts/actor-labarotary.html",
    "systems/arm5e/templates/actor/parts/actor-setAbilities.html",
    "systems/arm5e/templates/actor/parts/actor-labarotaryTotals.html",
    "systems/arm5e/templates/actor/parts/actor-dairy.html",

    "systems/arm5e/templates/actor/parts/actor-atributesLaboratory.html",
    "systems/arm5e/templates/actor/parts/actor-inventoryLaboratory.html",

    "systems/arm5e/templates/actor/parts/actor-covenantAtributes.html",
    "systems/arm5e/templates/actor/parts/actor-covenantHabitants.html",
    "systems/arm5e/templates/actor/parts/actor-covenantPosessions.html",
    "systems/arm5e/templates/actor/parts/actor-covenantEconomics.html",
    "systems/arm5e/templates/actor/parts/actor-covenantLibrary.html",
    "systems/arm5e/templates/actor/parts/actor-covenantCalendar.html"

  ]);
};
