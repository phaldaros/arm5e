
This is a template for people wanting to add compendium in their own language to the system.

0. Make a copy of the arm5e-LANG folder

1. Change the name suffix of the folder to the accronym of your language (eg: arm5e-pt for the Portuguese version)

2. Edit the module.json in it.

a. name field must match the name of the folder (eg: "arm5e-pt")
b. Edit title, description, authors field as you see fit.
c. Concerning the packs fields:
- Anything but the fields "name", "system" and "entity" can be changed.
- However, the "path" field needs to be of the format "packs/mypack.db"


3. Even if you don't have anything to put in some packs, it doesn't matter, the pack will be created empty. Someone else may contribute later.

4. Put the modified directory in the "modules" folder of Foundry data.

5. Load an arm5e world and enable the new module in the "Manage Modules" menu.

6. Reload and voilà! Your new compendiums are available

See https://foundryvtt.com/article/module-development/ for more details on the other fields.

Note: you can use the same instructions to create a shared compendium between your sagas