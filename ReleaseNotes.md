
## Release Notes

1.2.4
- removed some useless assets from previous design
- improved chat-messages
- new design for chat messages and rolls (by Sylph)
- fixed a bug where results of a stress die were always 0 on a 10 even if there was no botch 
- improved design for pop-ups (removed the grey border, buttons matching background color)
- drop-down list to pick the original source material (by Nono)
- multiple requisites support
- fixed a typo when guessing range causing error during migration
- Dice rolls are now all aynchronous (ie: V9 ready)
- Improved migration (finally found out how to remove fields)
- casting total is now displayed in character sheets


1.2.3
- fixed some errors during NPC migration because they don't have a familiar
- New base effects created in the Codex have the technique and form of the filters if set
- New enchantment item type (added to codex)
- It is now again possible to drop folders and from compendium on sheets
- lab texts are now of 3 types (Raw (free form), spell or enchantment) are sortable
- dropping a spell or enchantment on a covenant sheet will transform them into a lab text
- Design: added proper arrows to tab sheet where they were using the old design ones
- fixed a bug where "undefined" was displayed instead of the proper characteristic
- new setting to display and edit the source material and page if it applies
- It is again possible to drop Item in Codex
- Ritual rolls now include Artes Liberales and Philosophiae
- Ritual spells are now indicated as such in spells lists
- It is no longer possible to create enchantment based on rituals anymore.
- new arbitrary modifier field for  rolls
- magical focus is applied to rolls
- Roll fields Aura, Modifier, Fatigue and Wounds are not displayed in chat-log roll entries if value is 0



1.2.2
- fixed magic rules enforcement setting for spells without base level
- button to create missing default skills
- changed release notes to be ante-chronological 
- Arts Icons settings is now client based.
- Abilities, spells lists can be sorted

1.2.1 
- Confidence for NPCs is back
- Ritual checkbox fixed.

1.2.0
- New design of all the actor sheets
- Support of Italian language.
- "Mights" have been properly translated to "Powers"
- NPCs don't have any confidence points anymore (as they should)
- Might of NPC has a realm now (magic, fae, divine, infernal)
- 2 styles of icons for arts sheet (symbols or gestures)

1.1.1
- Introduction of the Codex Hermetica

1.1.0
- Compatibility with Foundry VTT 0.8.x
- Overhaul of the data template

1.0.0
- Incredible overhaul from ialbiol! An update truly worth of a v 1, and now able to use official ArM5 core rulebook material by the kind permission of Atlas Games!

0.2.1
- Fixed stress die explosions but can't get the characteristic or ability modifier to be auto-added to stress dice, so will display e.g. "4 * (1d10 + 0)" if two ones are rolled in succession. Chat will show the correct multiplied roll, but it will not add the modifier to the roll. Stress dice rolls that do not explode DO correctly add the modifier, as do simple dice rolls, only exploding stress dice rolls are not working.

0.2.0
- Implemented Stress Dice and Botch Mechanics when making Characteristic or Ability rolls from character sheet
- Removed non-Magus actor types until they can be properly implemented.

0.1.7
- Re-did Virtues & Flaws as item entities.

0.1.6
- Validated compatibility with FoundryVTT version 0.7.9
- Increased actor sheet profile image size to 256px
- Added support for Fatigue and Wounds. Will be improved in the near future, but functional.

0.1.5
- Re-did Virtues & Flaws tab - still very much a work in-progress
- Updated header and tab font to Goudy Text MT Lombardic Capitals.

0.1.4
- Corrected some description fields that weren't set as strings.

0.1.3
- Fixed + buttons to add inventory/spells directly in character sheet.
- Modified header - moved Age (Apparent) up there and moved House down to a Magus-specific section in Description tab.
- Exposed remaining Magus-specific fields I had in DB but forgot to add to sheet (parens, primus, etc.)
- Added conditional logic to only display Magus fields on description as well as Arts tab on character sheet if actor type = magus.
- Renamed "Items" tab to "Inventory".
- Fixed warping, decrepitude, and reputation.
- Added book item type to support level, quality, type (summa/tractatus)

0.1.2
- Corrected item template and spell template.

0.1.1
- Corrected manifest. Added license.

0.1.0
- Initial release.

