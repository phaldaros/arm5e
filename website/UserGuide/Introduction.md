This is the long awaited user guide for the Ars Magica system in Foundry VTT.

This document is not intended as a substitute to the rules book and rather focus on the system features to help managing your game sessions  

Status: _Everdraft_  
  
  
This document assumes that:

-   You have some basic knowledge of the Ars Magica 5th edition RPG.
    
-   You have some basic understanding of the FoundryVTT concepts like Actors, Items, Scenes, Compendium
    
-   You are able to navigate in the FoundryVTT GUI.
    

### Conventions

The word **system** in this guide refers to the Foundry VTT system for Ars Magica 5th Edition. The word **core** refers to the Foundry VTT API and engine.

A **character** englobes any player character or npc Actor

Most Actors and Items sheets have tabs and subtabs. To help navigate in the sheet. the following convention is used in this guide : ActorName.TabName.SubtabName  

![](systems/arm5e/assets/userguide/CharacterTabs.png)

For example: Character.Abilities.Virtues&Flaws indicates the subtab Virtues&Flaws in the tab Abilities of the character sheet

**Actor** with a capital A and **Item** with a capital I refer to the Foundry VTT concepts.

You will encounter list of items on the sheets, here is a description of the icons:

![](systems/arm5e/assets/userguide/ListIcons.png)

-   The Plus sign is to add a new item to the list.
    
-   The parchment and feather quill is to edit the item
    
-   The Perdo hand sign is to delete it.
    

**GM** (Gamemaster) is used instead of Storyteller in this document as it is how Foundry calls it

### Everything is drag and drop

The concept is that everything can be dragged and dropped on everything else. It may have no effect but you are encouraged to try.

Drag and drop Items (Virtues, flaws, abilities, spells, equipment) to an Actor sheet

-   From a compendium to a character sheet
    
-   From a character sheet to another
    
-   From the Codex to a character sheet (and vice versa)
    
-   A spell from a character to a covenant will create a lab text for it.
    
-   A folder full of Items will work too
    

Drag and drop Actors on other Actors

-   A character on a covenant
    
-   A covenant on an actor
    
-   A laboratory on a character
    

A chain link symbol near a field often indicates it is possible to link the appropriate document by dropping it on the sheet. Clicking on the chain will generally open the linked document sheet.

## Settings

**Sourcebooks filter:** This settings allows to reduce the number options proposed to only the sourcebooks selected. That way it won't overwhelm a new user with items he or she is unfamiliar with. (_It only filter spell attributes for the moment)_

**System Migration Version**: This setting allows to reset the version of the system to an older version in order to trigger a migration from that version. Useful to quickly migrate documents freshly imported from an old compendium.

**Default icon style:** Whether black&white or color version of default icons are used at creation of documents. It only applies to brand new documents, a copy will keep the original icon.

**Icon style for Arts:** Choose between the Hermetic Arts symbols or Hand gestures to represent Arts

**Show metagame information:** Whether to show the sourcebook and page where an Item is coming from.

**Show rolls**: Who can see the rolls of who

**Show rolls formula**: Who can see the rolls formula of who

**Show NPC magic details:** During magic contests against a NPC, choose between:

-   Tell only if it is a success or failure
    
-   Tell exactly by how much a success or failure happened
    

**Fun stress die:** Show a dialog when rolling a 1 on a stress dice (Everyone, Nobody or only players).

**Quick delete:** Whether to ask for confirmation before deleting an owned Item or not.

**Dramatic pause when rolling a one:** [Dice so Nice integration] If you have the Dice so Nice module enabled and the "Fun stress die" setting disabled, it will add a dramatic pause (ms) after rolling a one.