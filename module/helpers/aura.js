export default class Aura {
    constructor(scene)
    {
        this.scene = scene;
        // If auraData supplied is empty or null, fill it in with defaultAura
        let auraData = mergeObject((scene.getFlag("arm5e", "aura") || {}), this.constructor.defaultAura, {overwrite: false});
        mergeObject(this, auraData);
    }

    computeAuraModifierFor(alignment) {
        let dominantRealm = this.dominantRealm
        const multiplier = CONFIG.ARM5E.realmsExt[dominantRealm].influence[alignment];
        this.computed = (this.values[this.dominantRealm] + this._nightModifier()) * multiplier;
        return this.computed;
    }

    get dominantRealm()
    {
        let dominantRealm;
        let dominantRealmValue = 0;
        for(let realm in this.values)
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


    _nightModifier()
    {
        if (this.scene.darkness == 1) // Probably not the most accurate check
        {
            let dominantRealm = this.dominantRealm;
            if (dominantRealm == "infernal" || dominantRealm == "divine")
            {
                return this.nightModifier[dominantRealm] || 0;
            }
            else return 0;
        }
        else return 0;
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
            magic : 0,
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
