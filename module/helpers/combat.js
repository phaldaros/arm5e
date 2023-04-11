import { log } from "../tools.js";
import { stressDie } from "../dice.js";

export async function exertSelf(actor, mode, callback, roll) {
  log(false, "Exert self in combat");

  actor.rollData.combat.exertion = true;

  await stressDie(actor, roll, callback, mode, 0);

  await actor.loseFatigueLevel(1);
}

export function computeCombatStats(actor) {
  return {
    init:
      actor.system.combat.init -
      actor.system.combat.overload +
      actor.system.characteristics.qik.value,
    attack:
      actor.system.combat.atk +
      actor.system.combat.ability +
      actor.system.characteristics.dex.value,
    defense:
      actor.system.combat.dfn +
      actor.system.combat.ability +
      actor.system.characteristics.qik.value,
    damage: actor.system.combat.dam + actor.system.characteristics.str.value,
    soak: actor.system.combat.prot + actor.system.characteristics.sta.value
  };
}

export class QuickCombat extends FormApplication {
  constructor(data, options) {
    super(data, options);

    this.object.actor.apps[this.appId] = this;
    Hooks.on("closeApplication", (app, html) => this.onClose(app));
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e-dialog", "dialog"],
      title: game.i18n.localize("arm5e.sheet.combat"),
      template: "systems/arm5e/templates/generic/quick-combat.html",
      width: "auto",
      height: "auto",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  onClose(app) {
    if (this.object.actor.apps[app.appId] != undefined) {
      delete this.object.actor.apps[app.appId];
    }
  }

  async getData(options = {}) {
    let sys = {
      combat: this.object.actor.system.combat,
      characteristics: this.object.actor.system.characteristics
    };
    const context = {
      name: this.object.name,
      system: sys,
      combat: computeCombatStats(this.object.actor)
    };
    log(false, `QuickCombat: ${JSON.stringify(context)}`);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".rollable").click(async event => await this.object.actor.sheet._onRoll(event));
    html
      .find(".soak-damage")
      .click(async event => await this.object.actor.sheet._onSoakDamage(event));
    html
      .find(".damage")
      .click(async event => await this.object.actor.sheet._onCalculateDamage(event));
  }
}
export async function quickCombat(tokenName, actor) {
  if (!actor._isCharacter()) return;

  const combat = new QuickCombat(
    {
      name: tokenName,
      actor: actor
    },
    {}
  );
  const res = await combat.render(true);
}

export class QuickVitals extends FormApplication {
  constructor(data, options) {
    super(data, options);

    this.object.actor.apps[this.appId] = this;
    Hooks.on("closeApplication", (app, html) => this.onClose(app));
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e-dialog", "dialog"],
      title: game.i18n.localize("arm5e.sheet.vitals"),
      template: "systems/arm5e/templates/generic/quick-vitals.html",
      width: 200,
      height: "auto",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  onClose(app) {
    if (this.object.actor.apps[app.appId] != undefined) {
      delete this.object.actor.apps[app.appId];
    }
  }

  async getData(options = {}) {
    const context = {
      name: this.object.name,
      system: this.object.actor.system,
      woundCfg: CONFIG.ARM5E.character.wounds,
      conscious: this.object.actor.system.fatigueCurrent < this.object.actor.system.fatigueMaxLevel
    };
    log(false, `Vitals: ${context}, Fatigue: ${context.system.fatigueCurrent}`);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".rest").click(async () => {
      await this.object.actor.rest();
      this.render();
    });
    html.find(".addFatigue").click(async () => {
      await this.object.actor._changeFatigueLevel(1, false);
      this.render();
    });
    html.find(".removeFatigue").click(async () => {
      await this.object.actor._changeFatigueLevel(-1, false);
      this.render();
    });
    html.find(".addWound").click(async event => {
      event.preventDefault();
      const dataset = event.currentTarget.dataset;
      await this.object.actor.changeWound(1, dataset.type);
      this.render();
    });
    html.find(".removeWound").click(async event => {
      event.preventDefault();
      const dataset = event.currentTarget.dataset;
      await this.object.actor.changeWound(-1, dataset.type);
      this.render();
    });
  }
}

export async function quickVitals(tokenName, actor) {
  if (!actor._isCharacter()) return;

  const vitals = new QuickVitals(
    {
      name: tokenName,
      actor: actor
    },
    {}
  ); // data, options
  const res = await vitals.render(true);
}
