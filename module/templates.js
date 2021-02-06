/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const ArM5ePreloadHandlebarsTemplates = async function() {
  return loadTemplates([
    // Actor Sheet Partials
    "systems/arm5e/templates/actor/parts/actor-fatigue.html",
    "systems/arm5e/templates/actor/parts/actor-description.html",
    "systems/arm5e/templates/actor/parts/actor-abilities.html",
    "systems/arm5e/templates/actor/parts/actor-arts.html",
    "systems/arm5e/templates/actor/parts/actor-inventory.html",
    "systems/arm5e/templates/actor/parts/actor-virtuesFlaws.html",
    "systems/arm5e/templates/actor/parts/actor-labarotary.html",
    "systems/arm5e/templates/actor/parts/actor-dairy.html"

  ]);
};
