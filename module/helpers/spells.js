export function spellTechniqueLabel(itemData) {
  let label = CONFIG.ARM5E.magic.techniques[itemData.data.technique.value].label;
  let techReq = Object.entries(itemData.data["technique-req"]).filter((r) => r[1] === true);
  if (techReq.length > 0) {
    label += " (";
    techReq.forEach((key) => {
      label += CONFIG.ARM5E.magic.arts[key[0]].short + " ";
    });
    // remove last whitespace
    label = label.substring(0, label.length - 1);
    label += ")";
  }

  return label;
}

export function spellFormLabel(itemData) {
  let label = CONFIG.ARM5E.magic.forms[itemData.data.form.value].label;
  let techReq = Object.entries(itemData.data["form-req"]).filter((r) => r[1] === true);
  if (techReq.length > 0) {
    label += " (";
    techReq.forEach((key) => {
      label += CONFIG.ARM5E.magic.arts[key[0]].short + " ";
    });
    // remove last whitespace
    label = label.substring(0, label.length - 1);
    label += ")";
  }

  return label;
}
