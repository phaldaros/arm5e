import { log } from "../tools.js";
import { clearAuraFromActor } from "../helpers/aura.js";
import { ArM5eActiveEffectConfig } from "../helpers/active-effect-config.sheet.js";

export class ArsLayer extends CanvasLayer {
  async draw() {
    await super.draw();
    return this;
  }

  static async selectAura() {
    let dialogData = {
      fieldName: "arm5e.sheet.aura",
      placeholder: "0",
      value: "",
      realms: CONFIG.ARM5E.realms
    };
    const html = await renderTemplate("systems/arm5e/templates/generic/auraInput.html", dialogData);
    new Dialog(
      {
        title: game.i18n.localize("arm5e.sheet.aura"),
        content: html,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Apply Changes`
          }
        },
        default: "yes",
        close: async (html) => {
          let val = html.find('input[name="inputField"]');

          if (val.val() !== "") {
            const aura = val.val();
            const type = html.find(".aura-type")[0].value;
            await game.arm5e.setAuraValueForAllTokensInScene(aura, type);
          }
        }
      },
      {
        jQuery: true,
        height: "140px",
        classes: ["arm5e-dialog", "dialog"]
      }
    ).render(true);
  }

  static async clearAura() {
    game.scenes.viewed.unsetFlag("world", "aura_" + game.scenes.viewed.data._id);
    game.scenes.viewed.unsetFlag("world", "aura_type_" + game.scenes.viewed.data._id);
    const tokens = canvas.tokens.placeables.filter((token) => token.actor);
    for (const token of tokens) {
      clearAuraFromActor(token.actor);
    }
  }
}

export function addArsButtons(buttons) {
  buttons.push({
    name: "ArsMagica",
    title: "ArsMagica",
    layer: "arsmagica",
    icon: "icon-Icon_Ars",
    visible: game.user.isGM,
    tools: [
      {
        name: "aura",
        title: "Configure Aura",
        icon: "icon-Icon_Auras",
        visible: true,
        button: true,
        onClick: () => ArsLayer.selectAura()
      },
      {
        name: "clearAura",
        title: "Clear aura",
        icon: "icon-Icon_Delete_Perdo2",
        visible: true,
        button: true,
        onClick: () => ArsLayer.clearAura()
      }
    ],
    activeTool: "aura"
  });
}
