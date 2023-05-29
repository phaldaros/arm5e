export const seasonOrder = {
  standard: { spring: 0, summer: 1, autumn: 2, winter: 3 },
  winterFirst: { winter: 0, spring: 1, summer: 2, autumn: 3 }
};
export const seasonOrderInv = {
  standard: { 0: "spring", 1: "summer", 2: "autumn", 3: "winter" },
  winterFirst: { 0: "winter", 1: "spring", 2: "summer", 3: "autumn" }
};
export function nextDate(season, year) {
  if (season == CONFIG.SEASON_ORDER_INV[3]) {
    return { season: CONFIG.SEASON_ORDER_INV[0], year: year + 1 };
  } else {
    return { season: CONFIG.SEASON_ORDER_INV[CONFIG.SEASON_ORDER[season] + 1], year: year };
  }
}
export function compareDiaryEntries(e1, e2) {
  if (e1.system.dates[0].year < e2.system.dates[0].year) {
    return 1;
  } else if (e1.system.dates[0].year > e2.system.dates[0].year) {
    return -1;
  } else {
    if (
      CONFIG.SEASON_ORDER[e1.system.dates[0].season] <
      CONFIG.SEASON_ORDER[e2.system.dates[0].season]
    ) {
      return 1;
    } else if (
      CONFIG.SEASON_ORDER[e1.system.dates[0].season] >
      CONFIG.SEASON_ORDER[e2.system.dates[0].season]
    ) {
      return -1;
    } else {
      let cmp = -e1.system.dates[0].date.localeCompare(e2.system.dates[0].date);
      if (cmp) {
        return cmp;
      } else {
        return e1.name.localeCompare(e2.name);
      }
    }
  }
}

// used in the calendar
export function compareEvents(e1, e2) {
  if (e1.year < e2.year) {
    return -1;
  } else if (e1.year > e2.year) {
    return 1;
  } else {
    if (CONFIG.SEASON_ORDER[e1.season] < CONFIG.SEASON_ORDER[e2.season]) {
      return -1;
    } else if (CONFIG.SEASON_ORDER[e1.season] > CONFIG.SEASON_ORDER[e2.season]) {
      return 1;
    } else {
      return 0;
    }
  }
}
