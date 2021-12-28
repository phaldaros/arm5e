
## FAQ & Troubleshooting

### I have Foundy VTT configured in <another language> but some text in the interface is still in English.

There could be 2 reasons for that: 
1. There is no translation done for this specific text/mnemonic (it defaults to English in that case)
2. There is hardcoded English in the code instead of a mnemonic.
When I find n°2, I add the mnemonic but some may have escaped me.
In your data folder:  systems\arm5e\lang there are files for each language, if you compare the English one (en.json) with the other ones, some lines may be missing. It is case number 1, if you are fluent in that language, you can complete it and send me the final file and I will integrate it in the next version. (For the courageous, you can create a whole new language support for the system). 
For the tech savvy people, a pull request on the git repo will do the trick too

### I have upgraded to the latest version but when I import Actors and Items from a shared compendium I have lot of errors or are missing information I filled previously.

Sometimes, due to added features, the datamodel of the system needs to change. The first time you load a world with the new version, all the Items and Actors will be migrated, including the world compendiums (the ones in the system should already be migrated). However, the system will not migrate the stuff in external compendiums, you will need to retrigger a manual migration:
- Import your Items and Actors in the world.
- Go into the system settings and change the "System Migration Version" to a lower version (if possible the version you upgraded from)
- Save
- Reload (F5). It will then convert your Actors and Items
To avoid redoing this operation at every import , re-export the migrated stuff to your compendium again.

