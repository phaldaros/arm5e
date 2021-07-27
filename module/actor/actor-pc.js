/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ArM5ePCActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   **/

  prepareData() {
    super.prepareData();

    const actorData = this.data;

    this._prepareCharacterData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    let CreationPx = {
      "0":  { art: 0,   abi: 0 },
      "1":  { art: 1,   abi: 5 },
      "2":  { art: 3,   abi: 15 },
      "3":  { art: 6,   abi: 30 },
      "4":  { art: 10,  abi: 50 },
      "5":  { art: 15,  abi: 75 },
      "6":  { art: 21,  abi: 105 },
      "7":  { art: 28,  abi: 140 },
      "8":  { art: 36,  abi: 180 },
      "9":  { art: 45,  abi: 225 },
      "10": { art: 55,  abi: 275 },
      "11": { art: 66,  abi: 330 },
      "12": { art: 78,  abi: 390 },
      "13": { art: 91,  abi: 455 },
      "14": { art: 105, abi: 525 },
      "15": { art: 120, abi: 600 },
      "16": { art: 136, abi: 680 },
      "17": { art: 153, abi: 765 },
      "18": { art: 171, abi: 855 },
      "19": { art: 190, abi: 950 },
      "20": { art: 210, abi: 1050 },
      "21": { art: 231, abi: 1155 },
      "22": { art: 253, abi: 1265 },
      "23": { art: 276, abi: 1380 },
      "24": { art: 300, abi: 1500 },
      "25": { art: 325, abi: 1625 },
      "26": { art: 351, abi: 1755 },
    };
    let overload = [ 0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 9999 ];

    // Initialize containers.
    let weapons = [];
    let armor = [];
    let spells = [];
    let vis = [];
    let items = [];
    let books = [];
    let virtues = [];
    let flaws = [];
    let abilities = [];
    let abilitiesSelect = {};
    let dairyEntries = [];
    let abilitiesFamiliar = [];
    let mightsFamiliar = [];

    let mights = [];

    let specialities = [];
    let distinctive = [];
    let rooms = [];
    let magicItems = [];
    let personalities = [];

    let reputations = [];
    let magi = [];
    let companion = [];
    let specialists = [];
    let habitants = [];
    let horses = [];
    let livestock = [];
    let possessions = [];
    let visSources = [];
    let visStock = [];
    let calendar = [];
    let incomingSources = [];
    let laboratoryTexts = [];
    let mundaneBooks = [];

    let totalXPAbilities = 0;
    let totalXPArts = 0;
    let totalVirtues = 0;
    let totalFlaws = 0;
    let totalXPSpells = 0;

    let combat = {
      weight: 0,
      overload: -1,
      init: 0,
      atk: 0,
      dfn: 0,
      dam: 0,
      prot: 0,
      ability: 0,
    };

    let data = actorData.data;

    if(actorData.type == "npc"){
      //confidence
      if(!actorData.data.con){
        actorData.data.con = { score: 0, points: 3};
      }


      //laboratory
      if(!actorData.data.laboratory){
        actorData.data.laboratory = {};
      }
      if(!actorData.data.laboratory.longevityRitual){
        actorData.data.laboratory.longevityRitual = { labTotal: 0, modifier: 0, twilightScars: "" };
      }
      if(!actorData.data.laboratory.abilitiesSelected){
        actorData.data.laboratory.abilitiesSelected = {};
      }
      if(!actorData.data.laboratory.abilitiesSelected.finesse){
        actorData.data.laboratory.abilitiesSelected.finesse = { abilityID: "", value: 0, label: "" };
      }
      if(!actorData.data.laboratory.abilitiesSelected.awareness){
        actorData.data.laboratory.abilitiesSelected.awareness = { abilityID: "", value: 0, label: "" };
      }
      if(!actorData.data.laboratory.abilitiesSelected.concentration){
        actorData.data.laboratory.abilitiesSelected.concentration = { abilityID: "", value: 0, label: "" };
      }
      if(!actorData.data.laboratory.abilitiesSelected.artesLib){
        actorData.data.laboratory.abilitiesSelected.artesLib = { abilityID: "", value: 0, label: "" };
      }
      if(!actorData.data.laboratory.abilitiesSelected.philosophy){
        actorData.data.laboratory.abilitiesSelected.philosophy = { abilityID: "", value: 0, label: "" };
      }
      if(!actorData.data.laboratory.abilitiesSelected.parma){
        actorData.data.laboratory.abilitiesSelected.parma = { abilityID: "", value: 0, label: "" };
      }
      if(!actorData.data.laboratory.abilitiesSelected.magicTheory){
        actorData.data.laboratory.abilitiesSelected.magicTheory = { abilityID: "", value: 0, label: "" };
      }

      if(!actorData.data.laboratory.fastCastingSpeed){
        actorData.data.laboratory.fastCastingSpeed = {value: 0, sumary: "Qik + Finesse + stress die"};
      }
      if(!actorData.data.laboratory.determiningEffect){
        actorData.data.laboratory.determiningEffect = {value: 0, sumary: "Per + Awareness + die VS 15-magnitude"};
      }
      if(!actorData.data.laboratory.targeting){
        actorData.data.laboratory.targeting = {value: 0, sumary: "Per + Finesse + die"};
      }
      if(!actorData.data.laboratory.concentration){
        actorData.data.laboratory.concentration = {value: 0, sumary: "Sta + Concentration + die"};
      }
      if(!actorData.data.laboratory.magicResistance){
        actorData.data.laboratory.magicResistance = {value: 0, sumary: "Parma * 5 + Form"};
      }
      if(!actorData.data.laboratory.multipleCasting){
        actorData.data.laboratory.multipleCasting = {value: 0, sumary: "Int + Finesse + stress die - no of spells VS 9"};
      }
      if(!actorData.data.laboratory.basicLabTotal){
        actorData.data.laboratory.basicLabTotal = {value: 0, sumary: "Int + Magic theory + Aura (+ Technique + Form)"};
      }
      if(!actorData.data.laboratory.visLimit){
        actorData.data.laboratory.visLimit = {value: 0, sumary: "Magic theory * 2"};
      }
    }

    if(data.fatigue){
      // check structure
      if(!actorData.data.fatigue.fresh.number != 0){
        actorData.data.fatigue.fresh.number = 0;
      }
      if(!actorData.data.fatigue.winded.number != 0){
        actorData.data.fatigue.winded.number = 0;
      }
      if(!actorData.data.fatigue.weary.number != -1){
        actorData.data.fatigue.weary.number = -1;
      }
      if(!actorData.data.fatigue.tired.number != -3){
        actorData.data.fatigue.tired.number = -3;
      }
      if(!actorData.data.fatigue.dazed.number != -5){
        actorData.data.fatigue.dazed.number = -5;
      }
      if(!actorData.data.fatigue.unconscious.number != 0){
        actorData.data.fatigue.unconscious.number = 0;
      }

      data.fatigueTotal = 0;
      for (let [key, item] of Object.entries(data.fatigue)) {
        if(item.level.value == true){
          data.fatigueTotal = item.number;
        }
      }
    }

    if(data.wounds){
      data.woundsTotal = 0;
      for (let [key, item] of Object.entries(data.wounds)) {
          data.woundsTotal = data.woundsTotal + (item.number.value * item.penalty.value);
      }
    }

    //abilities
    const temp = { id: "", name: "N/A", value: 0 };
    abilitiesSelect['a0'] = temp;
    for (let [key, i] of Object.entries(actorData.items)) {
      if (i.type === 'ability') {
        if(i.data.score < 0) { i.data.score = 0; }
        if(i.data.score > 25) { i.data.score = 25; }

        i.data.experienceNextLevel = (i.data.score + 1) * 5;
        abilities.push(i);

        const temp = {
          id: i._id,
          name: i.name,
          value: i.score
        };
        //abilitiesSelect.push(temp);
        abilitiesSelect['a'+key] = temp;

        totalXPAbilities = parseInt(totalXPAbilities) + parseInt(CreationPx[i.data.score].abi);

        if((actorData.data.laboratory) && (actorData.data.laboratory.abilitiesSelected)){
          if(i._id == actorData.data.laboratory.abilitiesSelected.finesse.abilityID){       actorData.data.laboratory.abilitiesSelected.finesse.value = i.data.score; }
          if(i._id == actorData.data.laboratory.abilitiesSelected.awareness.abilityID){     actorData.data.laboratory.abilitiesSelected.awareness.value = i.data.score; }
          if(i._id == actorData.data.laboratory.abilitiesSelected.concentration.abilityID){ actorData.data.laboratory.abilitiesSelected.concentration.value = i.data.score; }
          if(i._id == actorData.data.laboratory.abilitiesSelected.artesLib.abilityID){      actorData.data.laboratory.abilitiesSelected.artesLib.value = i.data.score; }
          if(i._id == actorData.data.laboratory.abilitiesSelected.philosophy.abilityID){    actorData.data.laboratory.abilitiesSelected.philosophy.value = i.data.score; }
          if(i._id == actorData.data.laboratory.abilitiesSelected.parma.abilityID){         actorData.data.laboratory.abilitiesSelected.parma.value = i.data.score; }
          if(i._id == actorData.data.laboratory.abilitiesSelected.magicTheory.abilityID){   actorData.data.laboratory.abilitiesSelected.magicTheory.value = i.data.score; }
        }
      }
    }

    for (let [key, i] of Object.entries(actorData.items)) {
    //for (let i of actorData.items) {
      i.img = i.img || DEFAULT_TOKEN;
      i._index = key;

      if (i.type === 'weapon') {
        if(i.data.equiped == true){
          combat.weight = parseInt(combat.weight) + parseInt(i.data.weight);
          combat.init = parseInt(combat.init) + parseInt(i.data.init);
          combat.atk = parseInt(combat.atk) + parseInt(i.data.atk);
          combat.dfn = parseInt(combat.dfn) + parseInt(i.data.dfn);
          combat.dam = parseInt(combat.dam) + parseInt(i.data.dam);

          if(i.data.ability == ""){
            if(i.data.weaponExpert){
              combat.ability = parseInt(combat.ability) + 1;
            }
          } else {
            for(var a=0; a<abilities.length; a++){
              if(abilities[a]._id == i.data.ability){
                let hab = abilities[a].data.score;
                if(i.data.weaponExpert){
                  hab = parseInt(hab) + 1;
                }
                if(i.data.horse){
                  if(hab > 3){
                    hab = 3;
                  }
                }
                combat.ability = parseInt(combat.ability) + parseInt(hab);
              }
            }
          }
        }

        i.data.abilities = abilitiesSelect;
        weapons.push(i);
      }
      else if (i.type === 'armor') {
        if(i.data.equiped == true){
          combat.weight = parseInt(combat.weight) + parseInt(i.data.weight);
          combat.prot = parseInt(combat.prot) + parseInt(i.data.prot);
        }
        armor.push(i);
      }
      else if (i.type === 'spell') {
        spells.push(i);
        totalXPSpells = parseInt(totalXPSpells) + parseInt(i.data.level);
      }
      else if (i.type === 'vis') { vis.push(i); }
      else if (i.type === 'item') { items.push(i); }
      else if (i.type === 'book') { books.push(i); }
      else if (i.type === 'virtue') {
        virtues.push(i);
        if(i.data.impacts[i.data.impact.value]){
          totalVirtues = parseInt(totalVirtues) + parseInt(i.data.impacts[i.data.impact.value].cost);
        }

      }
      else if (i.type === 'flaw') {
        flaws.push(i);
        if(i.data.impacts[i.data.impact.value]){
          totalFlaws = parseInt(totalFlaws) + parseInt(i.data.impacts[i.data.impact.value].cost);
        }
      }
      //else if (i.type === 'ability') {
      //  i.data.experienceNextLevel = (i.data.score + 1) * 5;
      //  abilities.push(i);
      //
      //  totalXPAbilities = parseInt(totalXPAbilities) + parseInt(CreationPx[i.data.score].abi);
      //
      //  if((actorData.type == "player") && (actorData.data.laboratory) && (actorData.data.laboratory.abilitiesSelected)){
      //    if(i._id == actorData.data.laboratory.abilitiesSelected.finesse.abilityID){       actorData.data.laboratory.abilitiesSelected.finesse.value = i.data.score; }
      //    if(i._id == actorData.data.laboratory.abilitiesSelected.awareness.abilityID){     actorData.data.laboratory.abilitiesSelected.awareness.value = i.data.score; }
      //    if(i._id == actorData.data.laboratory.abilitiesSelected.concentration.abilityID){ actorData.data.laboratory.abilitiesSelected.concentration.value = i.data.score; }
      //    if(i._id == actorData.data.laboratory.abilitiesSelected.artesLib.abilityID){      actorData.data.laboratory.abilitiesSelected.artesLib.value = i.data.score; }
      //    if(i._id == actorData.data.laboratory.abilitiesSelected.philosophy.abilityID){    actorData.data.laboratory.abilitiesSelected.philosophy.value = i.data.score; }
      //    if(i._id == actorData.data.laboratory.abilitiesSelected.parma.abilityID){         actorData.data.laboratory.abilitiesSelected.parma.value = i.data.score; }
      //    if(i._id == actorData.data.laboratory.abilitiesSelected.magicTheory.abilityID){   actorData.data.laboratory.abilitiesSelected.magicTheory.value = i.data.score; }
      //  }
      //}
      else if (i.type === 'dairyEntry') { dairyEntries.push(i); }
      else if (i.type === 'abilityFamiliar') { abilitiesFamiliar.push(i); }
      else if (i.type === 'mightFamiliar') { mightsFamiliar.push(i); }

      else if (i.type === 'might') { mights.push(i); }

      else if (i.type === 'speciality') { specialities.push(i); }
      else if (i.type === 'distinctive') { distinctive.push(i); }
      else if (i.type === 'sanctumRoom') { rooms.push(i); }
      else if (i.type === 'magicItem') { magicItems.push(i); }
      else if (i.type === 'personality') { personalities.push(i); }

      else if (i.type === 'reputation') { reputations.push(i); }
      else if (i.type === 'habitantMagi') { magi.push(i); }
      else if (i.type === 'habitantCompanion') { companion.push(i); }
      else if (i.type === 'habitantSpecialists') { specialists.push(i); }
      else if (i.type === 'habitantHabitants') { habitants.push(i); }
      else if (i.type === 'habitantHorses') { horses.push(i); }
      else if (i.type === 'habitantLivestock') { livestock.push(i); }
      else if (i.type === 'possessionsCovenant') { possessions.push(i); }
      else if (i.type === 'visSourcesCovenant') { visSources.push(i); }
      else if (i.type === 'visStockCovenant') { visStock.push(i); }
      else if (i.type === 'calendarCovenant') { calendar.push(i); }
      else if (i.type === 'incomingSource') { incomingSources.push(i); }
      else if (i.type === 'laboratoryText') { laboratoryTexts.push(i); }
      else if (i.type === 'mundaneBook') { mundaneBooks.push(i); }
    }

    // combat
    for(var a=0; a<overload.length; a++){
      if(combat.overload == -1){
        if(overload[a] > combat.weight){
          combat.overload = parseInt(a)-1;
        }
      }
    }
    if(combat.overload < 0){ combat.overload = 0; }
    if(actorData.data.characteristics){
      if(actorData.data.characteristics.str.value > 0){
        combat.overload = parseInt(combat.overload) - parseInt(actorData.data.characteristics.str.value);
      }
      if(combat.overload < 0){ combat.overload = 0; }
    }
    combat.overload = parseInt(combat.overload) * -1;

    if(actorData.data.laboratory){
      /*
      "fastCastingSpeed":{"value": 0, "calc": "Qik + Finesse + stress die" },
      "determiningEffect":{"value": 0, "calc": "Per + Awareness + die VS 15-magnitude" },
      "targeting":{"value": 0, "calc": "Per + Finesse + die" },
      "concentration":{"value": 0, "calc": "Sta + Concentration + die" },
      "magicResistance":{"value": 0, "calc": "Parma * 5 + Form" },
      "multipleCasting":{"value": 0, "calc": "Int + Finesse + stress die - no of spells VS 9" },
      "basicLabTotal":{"value": 0, "calc": "Int + Magic theory + Aura (+ Technique + Form)" },
      "visLimit":{"value": 0, "calc": "Magic theory * 2" }
      */
      // calculate laboratori totals
      actorData.data.laboratory.fastCastingSpeed.value = actorData.data.characteristics.qik.value + actorData.data.laboratory.abilitiesSelected.finesse.value;
      actorData.data.laboratory.determiningEffect.value = actorData.data.characteristics.per.value + actorData.data.laboratory.abilitiesSelected.awareness.value;
      actorData.data.laboratory.targeting.value = actorData.data.characteristics.per.value + actorData.data.laboratory.abilitiesSelected.finesse.value;
      actorData.data.laboratory.concentration.value = actorData.data.characteristics.sta.value + actorData.data.laboratory.abilitiesSelected.concentration.value;
      actorData.data.laboratory.magicResistance.value = actorData.data.laboratory.abilitiesSelected.parma.value * 5;
      actorData.data.laboratory.multipleCasting.value = actorData.data.characteristics.int.value + actorData.data.laboratory.abilitiesSelected.finesse.value;
      actorData.data.laboratory.basicLabTotal.value = actorData.data.characteristics.int.value + actorData.data.laboratory.abilitiesSelected.magicTheory.value; // aura pending
      actorData.data.laboratory.visLimit.value = actorData.data.laboratory.abilitiesSelected.magicTheory.value * 2;
    }

    if(actorData.type == "player"){
      //warping & decrepitude
      actorData.data.warping.experienceNextLevel = (actorData.data.warping.score + 1) * 5;
      actorData.data.decrepitude.experienceNextLevel = (actorData.data.decrepitude.score + 1) * 5;

      //confidence
      if(!actorData.data.con){
        actorData.data.con.score = 0;
        actorData.data.con.points = 3;
      }
    }


    if(data.arts){
      for (let [key, technique] of Object.entries(data.arts.techniques)) {
        // Calculate the next level experience needed
        technique.experienceNextLevel = (technique.score + 1);
        totalXPArts = parseInt(totalXPArts) + parseInt(CreationPx[technique.score].art);
      }

      for (let [key, form] of Object.entries(data.arts.forms)) {
        // Calculate the next level experience needed
        form.experienceNextLevel = (form.score + 1);
        if((actorData.type == "player") && (actorData.data.laboratory) && (actorData.data.laboratory.abilitiesSelected)){
          form.magicResistance = (actorData.data.laboratory.abilitiesSelected.parma.value * 5) + form.score;
        }
        totalXPArts = parseInt(totalXPArts) + parseInt(CreationPx[form.score].art);
      }
    }

    // Assign and return
    actorData.data.totalXPAbilities = totalXPAbilities;
    actorData.data.totalXPArts = totalXPArts;
    actorData.data.totalVirtues = totalVirtues;
    actorData.data.totalFlaws = totalFlaws;
    actorData.data.totalXPSpells = totalXPSpells;

    if(actorData.data.weapons){
      actorData.data.weapons = weapons;
      actorData.data.combat = combat;
    }
    if(actorData.data.armor){ actorData.data.armor = armor; }
    if(actorData.data.spells){ actorData.data.spells = spells; }
    if(actorData.data.vis){ actorData.data.vis = vis; }
    if(actorData.data.items){ actorData.data.items = items; }
    if(actorData.data.books){ actorData.data.books = books; }
    if(actorData.data.virtues){ actorData.data.virtues = virtues; }
    if(actorData.data.flaws){ actorData.data.flaws = flaws; }
    if(actorData.data.abilities){ actorData.data.abilities = abilities; }
    if(actorData.data.dairyEntries){ actorData.data.dairyEntries = dairyEntries; }
    if(actorData.data.familiar){
      actorData.data.familiar.abilitiesFam = abilitiesFamiliar;
      actorData.data.familiar.mightsFam = mightsFamiliar;
    }

    if(actorData.data.mights){ actorData.data.mights = mights; }

    if(actorData.data.specialities){ actorData.data.specialities = specialities; }
    if(actorData.data.distinctive){ actorData.data.distinctive = distinctive; }
    if(actorData.data.rooms){ actorData.data.rooms = rooms; }
    if(actorData.data.magicItems){ actorData.data.magicItems = magicItems; }
    if(actorData.data.personalities){ actorData.data.personalities = personalities; }
    if(actorData.data.rawVis){ actorData.data.rawVis = vis; }

    if(actorData.data.reputations){ actorData.data.reputations = reputations; }
    if(actorData.data.habitants){ 
      actorData.data.habitants.magi = magi;
      actorData.data.habitants.companion = companion;
      actorData.data.habitants.specialists = specialists;
      actorData.data.habitants.habitants = habitants;
      actorData.data.habitants.horses = horses;
      actorData.data.habitants.livestock = livestock;
    }
    if(actorData.data.possessions){ actorData.data.possessions = possessions; }
    if(actorData.data.visSources){ actorData.data.visSources = visSources; }
    if(actorData.data.visStock){ actorData.data.visStock = visStock; }
    if(actorData.data.calendar){ actorData.data.calendar = calendar; }
    if(actorData.data.incomingSources){ actorData.data.incomingSources = incomingSources; }
    if(actorData.data.magicBooks){ actorData.data.magicBooks = books; }
    if(actorData.data.laboratoryTexts){ actorData.data.laboratoryTexts = laboratoryTexts; }
    if(actorData.data.mundaneBooks){ actorData.data.mundaneBooks = mundaneBooks; }

    console.log("pc prepare actorData: "+ actorData.type + " - "+ actorData.name);
    console.log(actorData);
  }

}