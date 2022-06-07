import { log } from "../tools.js";

const HERMETIC_FILTER = {
  formFilter: "",
  levelFilter: 0,
  levelOperator: 0,
  techniqueFilter: "",
  expanded: false
};

async function updateUserCache(actorId, list, key, value) {
  let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));

  usercache[actorId].filters.hermetic[list][key] = value;
  log(false, `Set field ${key} to ${value}`);
  sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
  return;
}

export { HERMETIC_FILTER, updateUserCache };
