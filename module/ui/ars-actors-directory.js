export class ArM5eActorsDirectory extends ActorDirectory {
  constructor(...args) {
    super(...args);
    this._dragDrop[0].permissions["dragstart"] = true;
  }

  // DEV: it makes no sense to check that every actor has a limited permissions
  // because the only actors displayed are those who already have that permission
  // => always true.
}
