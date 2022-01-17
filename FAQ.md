
# FAQ & Troubleshooting


## Installation

### I have that zip file I got from github, now what do I do with it?

**Be sure to backup everything before**
Unless you have edited the system, remove the old "arm5e" folder from the systems folder (Found in the Foundry Data folder)
Unzip, rename folder to "arm5e" and copy to systems folder.


## Modules 

### Is there any recommended modules?

- "Compendium folders" is highly recommended. It is heavily used to organize the system compendiums (abilities, spells,...) and will greatly improve your browsing experience. (https://foundryvtt.com/packages/compendium-folders)
- If you want to contribute by adding and fixing errors in the system compendiums, Mana's compendium Importer can be useful to export an errata as json files and shared them.(https://foundryvtt.com/packages/mkah-compendium-importer)
- If you plan to contribute to the code, It is highly recommended to install the module "Developper Mode" (https://foundryvtt.com/packages/_dev-mode). Once enabled, it will give all kind of information and easy print out of documents in console. All debug traces are done with it, so they don't need to be removed immediately for release, it only logs when the dev mode is active.


## Bugs reports

### I think I found a bug, what should I do?

Go the bugs channel in the Discord server and post a detailed description of your problem (ie: "it doesn't work" is not enough to help you). Type F12 and see if there is any kind of error message or warning, it may even give you the answer to your problem (eg: you forgot to migrate)
It is possible someone already posted about that problem, feel free to add any other information you think is missing 


## Translation

### I have Foundy VTT configured in <another language> but some text in the interface is still in English.

There could be 2 reasons for that: 
1. There is no translation done for this specific text/mnemonic (it defaults to English in that case)
2. There is hardcoded English in the code instead of a mnemonic.
When n° 2 is found, the mnemonic is added but some may have escaped me.
In your data folder:  systems\arm5e\lang there are files for each language, if you compare the English one (en.json) with the other ones, some lines may be missing. It is case number 1, if you are fluent in that language, you can complete it and send me the final file and I will integrate it in the next version. (For the courageous, you can create a whole new language support for the system). 
For the tech savvy people, a pull request on the git repo will do the trick too

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
-  if you retrieve my commits from the master branch, the version has probably changed already, so the migration won't trigger. It is  usually mentioned that a migration is needed.
- when importing compendiums which are neither in the system or your world and have been generated with an older version. For example, spells created in version  1.2.3 stored only one requisite per technique and form, they have to be migrated to store multiple requisites but also keeping the existing one if configured.

Running the migration again and again should never be a problem (If there is one, it's a bug).
As mentioned above, to trigger a migration: 
- Go to the system settings
- Change the "System Migration Version" setting to the previous stable release you installed
- Save and hit F5