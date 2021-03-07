# Ars Magica 5e for Foundry VTT

This is a Foundry VTT system for Ars Magica 5th Edition.

This package is intended to enable Ars Magica play using Foundry VTT. In order to play, official Ars Magica materials are still required. Official material for Ars Magica 5th edition is published by and may be purchased from Atlas Games (https://atlas-games.com).

Ars Magica content is copyright Trident, Inc d/b/a Atlas Games. Ars Magica, Mythic Europe, and Covenants are trademarks of Trident, Inc. Order of Hermes and Tremere are trademarks of White Wolf, Inc. USED WITH PERMISSION.

This Foundry VTT system project was based on the [Boilerplate System](https://gitlab.com/asacolips-projects/foundry-mods/boilerplate) by Asacolips.

Official Foundry VTT System Listing: https://foundryvtt.com/packages/arm5e/

## Versión Española

La utilización e inclusión del logo, iconos y elementos artísticos, así como el uso de terminología, ha sido autorizado expresamente y por escrito por Holocubierta Ediciones, S.L. (https://www.holocubierta.com), licenciataria del juego Ars Magica 5ª Edición para su publicación en castellano.

## Contributing
This is an open-source project and we encourage fellow developers to contribute and help improve it!

1. Fork it.
2. Create your feature branch (```git checkout -b my-new-feature```).
3. Contribute!
4. Commit your changes (```git commit -m 'Add new feature'```).
5. Push to the branch (```git push origin my-new-feature```).
6. Create a pull request.

You can also [join our Discord community](https://discord.gg/DdDetc9SYP) for development of this system.

## Release Notes

0.1.0
- Initial release.

0.1.1
- Corrected manifest. Added license.

0.1.2
- Corrected item template and spell template.

0.1.3
- Fixed + buttons to add inventory/spells directly in character sheet.
- Modified header - moved Age (Apparent) up there and moved House down to a Magus-specific section in Description tab.
- Exposed remaining Magus-specific fields I had in DB but forgot to add to sheet (parens, primus, etc.)
- Added conditional logic to only display Magus fields on description as well as Arts tab on character sheet if actor type = magus.
- Renamed "Items" tab to "Inventory".
- Fixed warping, decrepitude, and reputation.
- Added book item type to support level, quality, type (summa/tractatus)

0.1.4
- Corrected some description fields that weren't set as strings.

0.1.5
- Re-did Virtues & Flaws tab - still very much a work in-progress
- Updated header and tab font to Goudy Text MT Lombardic Capitals.

0.1.6
- Validated compatibility with FoundryVTT version 0.7.9
- Increased actor sheet profile image size to 256px
- Added support for Fatigue and Wounds. Will be improved in the near future, but functional.

0.1.7
- Re-did Virtues & Flaws as item entities.

0.2.0
- Implemented Stress Dice and Botch Mechanics when making Characteristic or Ability rolls from character sheet
- Removed non-Magus actor types until they can be properly implemented.

0.2.1
- Fixed stress die explosions but can't get the characteristic or ability modifier to be auto-added to stress dice, so will display e.g. "4 * (1d10 + 0)" if two ones are rolled in succession. Chat will show the correct multiplied roll, but it will not add the modifier to the roll. Stress dice rolls that do not explode DO correctly add the modifier, as do simple dice rolls, only exploding stress dice rolls are not working.

1.0.0
- Incredible overhaul from ialbiol! An update truly worth of a v 1, and now able to use official ArM5 core rulebook material by the kind permission of Atlas Games!

## Credits
<b>Authors:</b> ialbiol, phaldaros, sylph<br>

## Feedback
If you have any suggestions or bugs to report, feel free to create an issue on GitHub or [report them on Discord](https://discord.gg/DdDetc9SYP).

## Abandonment
Abandoned modules are a (potential) problem for Foundry, because users and/or other modules might rely on abandoned modules, which might break in future Foundry updates.<br>
I consider this module abandoned if all of the below cases apply:
<ul>
  <li>This module/github page has not received any updates in at least 3 months</li>
  <li>I have not posted anything on "the Foundry", "the League of Extraordinary Foundry VTT Developers" or the "ArM5e FoundryVTT System Development" Discord servers in at least 3 months</li>

  <li>I have not responded to emails or PMs on Discord in at least 1 month</li>
  <li>I have not announced a temporary break from development, unless the announced end date of this break has been passed by at least 3 months</li>
</ul>
If the above cases apply (as judged by the "League of Extraordinary Foundry VTT Developers" admins), I give permission to the "League of Extraordinary Foundry VTT Developers" admins to assign one or more developers to take over this module, including requesting the Foundry team to reassign the module to the new developer(s).<br>
I require the "League of Extraordinary Foundry VTT Developers" admins to send me an email 2 weeks before the reassignment takes place, to give me one last chance to prevent the reassignment.<br>
I require to be credited for my work in all future releases.
