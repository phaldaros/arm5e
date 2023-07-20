export default class Aura {
    constructor(scene)
    {
        this.scene = scene;
        this.modifier = 0; // Modifier can be changed (if the user changes it in the dialog)
    }

    get values()
    {
        return this._sceneData.values;
    }

    get nightModifier()
    {
        return this._sceneData.nightModifier
    }

    get visible()
    {
        return this._sceneData.visible
    }

    // Scene may have been updated, so constantly retrieve scene flag data for aura values
    get _sceneData() 
    {
        // If scene doesn't specify aura data, merge with defaultAura to always have correct structure
        return mergeObject((this.scene?.getFlag("arm5e", "aura") || {}), this.constructor.defaultAura, {overwrite: false});
    }

    refresh()
    {
        // If auraData from scene is empty or null, fill it in with defaultAura
    }

    computeAuraModifierFor(alignment) {
        let dominantRealm = this.dominantRealm || "mundane"
        const multiplier = CONFIG.ARM5E.realmsExt[dominantRealm].influence[alignment];
        this.modifier = (this.auraValueFor(dominantRealm)) * multiplier;
        return this.modifier;
    }

    get dominantRealm()
    {
        let dominantRealm;
        let dominantRealmValue = 0;
        for(let realm in this.values)
        {
            if (this.auraValueFor(realm) > dominantRealmValue)
            {
                dominantRealmValue = this.values[realm];
                dominantRealm = realm;
            }
        }
        return dominantRealm;
        // TODO: What if two realms are the same value?
    }


    auraValueFor(realm)
    {
        return (this.values[realm] || 0) + this._nightModifier(realm)
    }

    /**
     * 
     * @param {String} realm Realm to calculate night modifier for, optional, if not provided use dominant realm
     * @returns 
     */
    _nightModifier(realm)
    {
        realm = realm || this.dominantRealm
        if (this.scene.darkness == 1) // Probably not the most accurate check
        {
            return this.nightModifier[realm] || 0;
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

    // Mundane is added here to easily compute cases with no aura
    static defaultAura = {
        values : {
            magic : 0,
            faeric : 0,
            divine : 0,
            infernal : 0,
        },
        visible : false,
        nightModifier : {
            magic : 0,
            faeric : 0,
            divine : 0,
            infernal : 0,
        }
      }
}