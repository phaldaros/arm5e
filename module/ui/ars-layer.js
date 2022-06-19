import { log } from "../tools.js";
import { clearAuraFromActor } from "../helpers/aura.js";

export class ArsLayer extends CanvasLayer {
  async draw() {
    await super.draw();
    return this;
  }

  static async selectAura() {
    let dialogData = {
      fieldName: "arm5e.sheet.aura",
      placeholder: "0",
      value: ""
    };
    const html = await renderTemplate("systems/arm5e/templates/generic/textInput.html", dialogData);
    //   const html = `<form class="{{cssClass}} arm5eChooser" autocomplete="off">
    //   {{> "systems/arm5e/templates/roll/parts/roll-header.html" header="Inputs" }}
    //   <div class="flexrow3 backSection" style="padding: 48px">
    //     <label>{{ localize fieldName }}</label>
    //     <div class="form-fields">
    //     <label>Aura</label>
    //     <input type="text" name="inputField"></input>
    //     </div>
    //   </div>
    //   {{> "systems/arm5e/templates/roll/parts/roll-footer.html" footer="Inputs"}}
    // </form>`;
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
          let result = html.find('input[name="inputField"]');
          if (result.val() !== "") {
            const aura = result.val();
            await game.arm5e.setAuraValueForAllTokensInScene(aura);
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
