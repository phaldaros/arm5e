There are different types of Actors that can be created:

## Characters

The traditional troupe members of a Saga. The character sheets should be familiar to the Ars Magica player as most fields are self explanatory. The focus will be on Foundry specific features.

Sheets and owned items are color coded. Unowned Items are black

### Troupe members (blue)

#### **Magus, Companion and Grog**

### Non-played characters (NPCs) (brown)

#### **Magus, Mundane and Entity**

## Sheet features

Find below a description of the sheet features tab by tab.

-   A magus has additional tab for Hermetic Arts and Laboratory.
    
-   An entity is aligned to a realm, has a might score and can have powers. It is affected by auras.
    

### Header

#### **Characteristics:** 
Click on a characteristic label to open a roll dialog. Mouse over the score will also tell you the number of aging point in that characteristic, the more aging points, the larger a shadow will appear around the field. To edit the aging points, shift+click the label of the characteristic.**  
  
Covenant field:** Set it to an existing covenant name in the world to link with the character. The character will also become a member in the covenant sheet. Click on the link symbol to open the covenant sheet. You can also drag and drop a covenant actor on the sheet for the same effect.

### Description

Some fields like size, soak and encumbrance are read only because they are computed and/or can only be changed through [[Active effects]]:

**Warping**: WIP, Twilight and its effects are not implemented yet

**Aging and decrepitude**: Click on the little hourglass icon to do an aging roll. (see [[Long term activities#Aging (special)|Aging]]);

**Personaliy traits:** Click on the dice icon to roll for a personality trait.

**Reputation**: Click on the dice icon to roll for reputation

### Vitals and Combat

**Fatigue**: Use the + and - signs to increase your fatigue or the rest button to reset.  
As you can see below, it is possible to increase or decrease your fatigue levels and the associated penalty using [[Active effects]]:

![](systems/arm5e/assets/userguide/Fatigue.png)

**Wounds:** You can manually add wounds to a character here. Each wound is individually represented by an icon and fresh wounds have a red aura around them.

The penalties for wounds and fatigue are automatically taken into account for rolls.

**Combat section:** You can roll for initiative, attack and defence here (See [[Gameplay#Combat|Combat]]).

-   Click on the Soak label to apply a given amount of damage. If a combat is on going, it will automatically compute the correct amount to soak. Size, stamina, armor, etc are automatically taken in account to compute the correct wound type.
    

**Weapons and Armor**: A duplicate from the Inventory tab put here for convenience. Click on the check box to equip or unequip.

### Abilities

This section will list all the abilities possessed by the character. As mentioned in the introduction chapter, you can add preconfigured abilities by drag and dropping from the sidebar, a Compendium or even another character sheet.

![](systems/arm5e/assets/userguide/AbilitiesActor.png)

-   Click on the Ability label to roll for it.
    
-   The abilities are put alphabetically in different sections corresponding to their category.
    
-   A category will appear only if the character has an ability in it. Clicking on a category will collapse or expand the corresponding list of abilities
    

### Virtues and Flaws

As with abilities, you can drag and drop virtues and flaws. A label in _italic_ means it has an Active Effect.

### Arts

This tab is only available to magic users

![](systems/arm5e/assets/userguide/HermeticArts.png)

Each of the Arts is described in this section:

-   The Art symbol or its hand gesture (see [[Introduction#Settings|Settings]])
    
-   Its name, click on it to roll for spontaneous magic.
    
-   The amount xp spent in it and the total needed for next level. You can directly edit the amount
    
-   The score, read only but adjustable with the plus and minus icons
    
-   The forms have an additional number between braces: this is the magic resistance for this form (ie: 5x Parma Magica + score).
    
-   The same colored shadow codes as abilities are used to indicate an active effect:
    
    -   Blue: Puissant
        
    -   Red: Affinity
        
    -   Violet: Puissant and affinity
        
    -   Dark grey blue: Deficiency
        

### Voice and gestures

You can configure the default casting modifiers

### Magic totals

A list of totals used for magic computed with characteristics and abilities.

-   You can directly roll fast-casting and targeting by clicking on the corresponding labels.
    

### Spells

Like for abilities, a list of the spells known by the magus.

-   Click on a spell to roll for casting.
    
-   Clicking on the up-down arrow will display a special filter area:
    

![](systems/arm5e/assets/userguide/SpellsFilter.png)

-   You can filter by technique, form and level and then close it back. A little glow will indicate the list is filtered.
    
-   The filter parameters are stored in the browser on per user and character basis so two different users can have their own specific view of the same sheet at the same time. As long as you keep using the same tab they will be preserved.
    

### Spontaneous magical effects

Same as spells list, but for frequently used spontaneous effects.

### Magical abilities

-   This section is a remnant of the earlier sheet, before the use of ability keys. It will probably be removed in the future. **You don't actually need to match the abilities unless their ability key is not configured properly**
    
-   It can still be used to quickly create corresponding abilities in the character by clicking the little cog icon (it will use the ones in the system compendium).
    

### Casting totals

This table gives you a quick overview of the magical capabilities of a character. Fields are self explanatory.

### Laboratory

**Dev notes:** This tab is still a work in progress and will evolve greatly as lab activities are put in place. For now, it can be used to store information as is.

-   **Sanctum**: You can link a laboratory to your character, its quality and Art specialities will be taken into account in the Lab total sub tab.
    
-   **Longevity modifier:** the modifier given by the character longevity potion. (**Dev note:** It may change in the future when longevity potions crafting are implemented
    
-   **Familiar cords:** they are used in a few places (bronze for soak and aging)
    

### Lab totals

Similar to casting totals, this table gives an overview of the lab capabilities of a character.

-   **Laboratory quality** is read only if the character has a sanctum linked
    
-   **Apprentice:** put here the important stats of the apprentice that affect the lab total
    

### Inventory

Self-explanatory, note that Mundane and Magical book will be merged soon  
  
You can equip or unequip weapons and armor by clicking the checkbox

### Diary

-   List all diary entries in ante-chronological order (see [[Long term activities]]).
    
-   Diary entries with an activity not yet applied will be in _italic._
    
-   **Pending XP:** This field will display the total XPs from activities which was not applied or distributed.
    

### Effects

![](systems/arm5e/assets/userguide/ActiveEffects.png)

-   See [[Active effects]] for more details on each kind of effect available.
    
-   This tab is read only for players, hovering the mouse pointer on the icon will give a description of the effect
    
-   It will list the active effect on the character.
    
-   Clicking on the cross icon will temporarily disactivate it until the check march icon is clicked.
    
-   Some effects a read only even for a GM, this is because they are part of an Item owned by the character (eg: a Virtue). The **source** field will indicate from where the effect comes from.
    
-   **Dev note:** In Foundry core, the name for this feature is Active effects but they can be Active, Passive or inactive which can make things confusing.
    

## Beasts (brown)

Beasts have their own character sheet but it is not very different from the character's one. This will evolve later

## Structures

This section is a work in progress

### Covenant (red)

### Laboratory (green)

For activities in the laboratory, see the [[Laboratory activities]]

entry.

## Special

### Codex Hermeticum (violet)

This Actor is usually unique in a world. It is used to quickly design effects based on a database of base effects.