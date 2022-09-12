# FAQ & Troubleshooting

## Installation

See README file

### I have still Foundry 0.8.x because XXX. I have downloaded an older release and all I have is that zip file I got from github, now what do I do with it?

**Be sure to backup everything before**
Update your Foundry VTT version to at least 0.8.9.
Unless you have edited the system, remove the old "arm5e" folder from the systems folder (Found in the Foundry Data folder)
Unzip, rename folder to "arm5e" and copy to systems folder.

## Compendium content

### Why are the description of the abilities, virtues, flaws and spells empty?

For copyright reasons, we aren't able to include this content in the system. However, the sourcebook and page are provided if you want to include them in your world/compendium.
For spells, we recommend you to download the Grand Grimoire of Hermetic spells (https://atlas-games.com/atlas-cms/resources/downloads/arm5-grand-grimoire-of-hermetic-spells.pdf)

## Modules

### Is there any recommended modules?

- "Compendium folders" is highly recommended. It is heavily used to organize the system compendiums (abilities, spells,...) and will greatly improve your browsing experience. (https://foundryvtt.com/packages/compendium-folders)
- If you want to contribute by adding and fixing errors in the system compendiums, Mana's compendium Importer can be useful to export an errata as json files and share them.(https://foundryvtt.com/packages/mkah-compendium-importer)
- If you plan to contribute to the code, It is highly recommended to install the module "Developper Mode" (https://foundryvtt.com/packages/_dev-mode). Once enabled, it will give all kind of information and easy print out of documents in console. All debug traces are done with it, so they don't need to be removed immediately for release, it only logs when the dev mode is active.

## Bugs reports

### I think I found a bug, what should I do?

Go the bugs channel in the Discord server and post a detailed description of your problem (ie: "it doesn't work" is not enough to help you). Open the dev console (F12) and see if there is any kind of error message or warning, it may even give you the answer to your problem (eg: you forgot to migrate)
It is possible someone already posted about that problem, feel free to add any other information you think is missing

## Translation

### I have Foundy VTT configured in Latin but some text in the interface is still in English.

There could be 2 reasons for that:

1. There is no translation done for this specific text/mnemonic (it defaults to English in that case)
2. There is hardcoded English in the code instead of a mnemonic.
   When n° 2 is found, the mnemonic is added but some may have escaped me.
   In your data folder: systems\arm5e\lang there are files for each language, if you compare the English one (en.json) with the other ones, some lines may be missing. It is case number 1, if you are fluent in that language, you can complete it and send me the final file and I will integrate it in the next version. (For the courageous, you can create a whole new language support for the system).
   For the tech savvy people, a pull request on the git repo will do the trick too
3. Some translated messages have parameters in braces (eg: "{name}"), you can move them around but you must not translate them or they will appear as undefined in the GUI.

## Migration

### I have upgraded to the latest version but when I import Actors and Items from a shared compendium I have lot of errors or are missing information I filled previously.

Sometimes, due to added features, the datamodel of the system needs to change. The first time you load a world with the new version, all the Items and Actors will be migrated, including the world compendiums (the ones in the system should already be migrated). However, the system will not migrate the stuff in external compendiums, you will need to retrigger a manual migration:

- Import your Items and Actors in the world.
- Go into the system settings and change the "System Migration Version" to a lower version (if possible the version you upgraded from)
- Save
- Reload (F5). It will then convert your Actors and Items
  To avoid redoing this operation at every import , re-export the migrated stuff to your compendium again.

### When and how do you need to "trigger a migration"?

A migration is automatically triggered when you load a world for the first time with a new version. However, there are a few cases when you need to trigger it manually:

- if you retrieve my commits from the master branch, the version has probably changed already, so the migration won't trigger. It is usually mentioned that a migration is needed.
- when importing compendiums which are neither in the system or your world and have been generated with an older version. For example, spells created in version 1.2.3 stored only one requisite per technique and form, they have to be migrated to store multiple requisites but also keeping the existing one if configured.

Running the migration again and again should never be a problem (If there is one, it's a bug).
As mentioned above, to trigger a migration:

- Go to the system settings
- Change the "System Migration Version" setting to the previous stable release you installed
- Save and hit F5

# Gameplay FAQ

## General

### I have got this warning when I create a new world: "You don't have a Actor of type 'magicCodex' in your world, some functionality will be disabled/not working, you can import the one in the Magi compendium".

Nothing to worry about, this is normal. You just have to follow instructions and import it from the Magi Compendium or create it from scratch. It will disappear on next reload.

## Abilities

### What are the fields "Ability key" and "Option" for?

The Ability Key field is used by the system to which ability it is. That way you can name it as you wish and in the language you prefer. The option field is read-only most of the time, but it is used for generic abilities (eg: Area Lore, Crafting , Languages,... ) to distinguish them. For example, a character may know leatherwork and forging, both crafting abilities, the option field will allow to differentiate between the two.
This is useful when you need to tell the system which ability you are talking about. With afinities or puissant ability virtues for example.

## Diary

### I cannot select the ability I want to progress into.

A character must possess an ability in order to progress into it. Add the ability from a compendium with a score of 0 or drag and drop them on the diary sheet's abilities tab (the latter doesn't work with training and teaching)

## Rolls

### How do I know where the roll total comes from?

There is a unfoldable section if you click "details" in the chat message

### How do I use confidence points?

There is a little button in the chat message which will allow that if the character has enough confidence point left.

## Combat

### How do I apply damage to a character?

Click on the "Soak" link in the combat tab and set a value. If a combat is on going, it will automatically compute the correct amount to soak. The size is taken into account.
