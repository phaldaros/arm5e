import { log } from "../tools.js";

export function dummyButton(buttons) {
  buttons.push({
    name: "ArsMagica",
    title: "ArsMagica",
    layer: "ars",
    icon: "fas fa-magic",
    tools: [
      {
        name: "aura",
        title: "Configure Aura",
        icon: "fas fa-expand"
      },
      {
        name: "localAura",
        title: "Localized auras",
        icon: "fas fa-map-pin",
        toggle: true,
        active: false
      }
    ],
    activeTool: "aura"
  });
}
