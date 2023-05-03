## Rolls

You can trigger a roll by clicking on the relevant item

-   Click on a characteristic label to roll on a pure characteristic
    
-   Click on an ability name in the character sheet
    
-   Click on an Art label for spontaneous magic
    
-   Click on a spell name to cast it
    
-   Click on the dice icon next to a label to roll for it (eg: attack, defense, personality trait)
    

The roll type (public, private, …) set in the chat bar is taken into account for all the above.

**Dev note:** There is not yet a way to just roll a stress die using the character sheet (some people are rolling a dummy personality trait for that). A macro has been provided to do it, it is available in the system compendia

**Experimental**: use "/r Xds" to roll an exploding dice. X is the number of botch dice

-   All the items above can be drag and dropped on the macro bar for quick access to roll.
    
-   In addition, weapons can be put on the macro bar too for a combat roll.
    
-   To take into account any rule not implemented yet or any special modifier granted by the GM, a **modifier** field is available for all rolls.
    

### Characteristic and ability rolls

![](systems/arm5e/assets/userguide/RollAbility.png)

-   This dialog is the same for characteristic and abilities. The appropriate fields will be set automatically based on the original item clicked:
    
    -   Characteristic label: Characteristic set to the proper value, Ability set to "None"
        
    -   Ability name: Characteristic set to the default characteristic field of the ability.
        
-   The **specialty** field allows to tell whether the ability's speciality applies or not.
    
-   It is always possible to change the values before rolling.
    

### Magic rolls

-   Click on a spell or magic effect label to cast it.
    
-   For generic spontaneous magic, click on the Art label.
    

![](systems/arm5e/assets/userguide/RollSpontMagic.png)

-   Apply magical focus will be set automatically to the value set in a spell, but can be enabled if appropriate for spontaneous magic.
    

Magic rolls have 2 additional sections which can be expanded and collapsed as needed:

The bonuses section will list any special modifier that will be applied to the roll:

-   Aura if present
    
-   Voice and gestures modifier
    
-   Special bonus from the spell sheet
    
-   Optional bonuses like special circumstances will go there in the future
    

![](systems/arm5e/assets/userguide/SpellBonuses.png)

The Penetration options will influence the final casting total if the spell is a success.

-   Penetration mastery relate to the spell mastery effect if it exists
    

![](systems/arm5e/assets/userguide/PenetrationOptions.png)

### Combat rolls

You can roll everything in Description.Vitals&Combat:

![](systems/arm5e/assets/userguide/CombatStats.png)

See [[#Combat|Combat]] below for more details.  
It is also possible to roll for attack by dropping a weapon in the hotbar.

-   If your specialty is with the shield, mark it on the shield and not on the weapon. If you don't have the shield equipped, the specialty bonus doesn't apply.
    
-   Create a 'mounted' item with the ability to 'mount' and mark on its attributes that it is a horse. When you equip it, the calculations will be applied.
    

### Other rolls

Most rolls are triggered by clicking on the appropriate label.

## Magic

Once you cast a spell, do spontaneous magic or use a power, the result of the roll will appear in chat:  

![](systems/arm5e/assets/userguide/SpellChatResult.png)

-   Icon of the token. Clicking on it will open its sheet.
    
-   The name of the spell/magical effect and its level
    
-   Icon of the spell if applicable.
    
-   Details of the roll modifiers including penetration computation
    
-   Roll formula
    
-   Casting total without penetration
    
-   Penetration total in parentheses
    
-   The small icon is to use a confidence point if available.
    

If the spell is cast while one or more tokens are selected, additional message per target will appear in the chat indicating whether the spell successfully overcame magic resistance:

![](systems/arm5e/assets/userguide/MagicContest.png)

Note that with the right [[Introduction#Settings|Settings]], a player will only see whether if the spell was a success or not, the details are reserved for the GM.

## Combat

**Dev note**: Combat being usually short and deadly in Ars Magica, it hasn't been properly integrated in the Foundry framework yet. At the moment, you can roll for initiative with it to have an action order, but it is a simplified version of the rules (ie: no reroll is made in case of tie).

-   On **Attack** or **Defence** rolls, it is possible to exert self (ie: lose a fatigue level) to double the ability score.
    
-   **Damage** roll will automatically compute the advantage based on the previous attack and defence chat messages. That's why the GM should pay attention that players only roll when it is their turn, otherwise the Advantage must be computed "manually".
    
-   **Soak** roll will retrieve the result of the latest **Damage** roll to be applied to the target or zero if none are found.
    
    -   Size is taken into account for the computation of wounds
        
    -   This is also the way to apply damage from external events (fire, fall, etc)
        
    -   Select your Form resistance bonus if you are a Magus (eg: Ignem for fire damage) or if you have an active effect which applies
        
    -   Natural resistance: Some virtues and flaws may give modifiers to soak rolls (eg: Fire resistance or vulnerability) through Active effects. You can select it here.
        
    -   **Dev note:** Spell damage will be applied differently in the future.