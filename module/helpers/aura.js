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

    /**
     * Takes an alignment number of a power and computes how the current aura will modify
     * that power being used. e.g. how much a faerie power is penalized in a divine aura
     * 
     * @param {Number} alignment Number representing alignment of power being used
     * @returns 
     */
    computeAuraModifierFor(alignment) {
        let dominantRealm = this.dominantRealm || "mundane"
        const multiplier = CONFIG.ARM5E.realmsExt[dominantRealm].influence[alignment];
        this.modifier = (this.auraValueFor(dominantRealm)) * multiplier;
        return this.modifier;
    }

    /**
     * Retrieve the realm that has the current highest value in the aura
     * The highest value is computed with the night modifier, if it is present and active
     */
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


    /**
     * Auras can have multiple realms, this retrieves the value of some realm in the aura, 
     * including the night modifier if it is present
     * 
     * @param {String} realm Realm string, such as "magic" or "divine"
     * @returns 
     */
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

    /**
     * Create an aura object from an actor and the scene they are associated with
     * If no token is on the map, juts use viewed scene
     * 
     * @param {Actor} actor 
     * @returns 
     */
    static fromActor(actor)
    {
        let token = actor.getActiveTokens()[0]
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