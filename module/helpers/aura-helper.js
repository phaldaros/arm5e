export default class AuraHelper {
    constructor(scene)
    {
        this.scene = scene;
        // If auraData supplied is empty or null, fill it in with defaultAura
        let auraData = mergeObject((scene.getFlag("arm5e", aura) || {}), this.constructor.defaultAura, {overwrite: false});

        mergeObject(this, auraData);
    }

    get spellModifier() {
        return this.values[this._findHighestAura()];
    }

    _findHighestAura()
    {
        let dominantRealm;
        let dominantRealmValue = 0;
        for(let realm of this.values)
        {
            if (this.values[realm] > dominantRealmValue)
            {
                dominantRealmValue = this.values[realm];
                dominantRealm = realm;
            }
        }
        return dominantRealm;
        // TODO: What if two realms are the same value?
    }


    static fromActor(actor)
    {
        let token = actor.isToken ? actor.token : actor.getActiveTokens()[0] // In v11 only need to use getActiveTokens()[0]
        let scene
        if (token)
        {
            scene = token.scene
        }
        else // no token on the map, just use viewed scene
        {
            scene = canvas?.scene
        }
        return new this(scene)
    }



    static defaultAura = {
        values : {
            magical : 0,
            faeric : 0,
            divine : 0,
            infernal : 0,
        },
        visible : false,
        nightModifier : {
            divine : 0,
            infernal : 0,
        }
      }
}