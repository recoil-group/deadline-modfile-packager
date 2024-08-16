# deadline-modfile-packager

Main library for encoding and decoding modfiles to be used as importable mods in Deadline

# Supported features

-   Custom attachments
    -   [x] Default attachments
    -   [x] Optics
    -   [ ] Variable optics
    -   [ ] Lasers
    -   [ ] Flashlights
-   [x] Custom maps

# Public mod sources

-   [Official mods](https://github.com/blackshibe/deadline-insitux-core-scripts/tree/master/modfile)
-   The Deadline server has a #modding channel

# Other guides

-   [Maps](docs/maps.md)
-   [Attachments](docs/attachments.md)
-   [Using terrain](docs/terrain.md)

# How to

Generally, you want to

-   Install the plugin
    -   Get the plugin from the releases page. there's a place file you can view a test mod from as well
    -   Open the template mod place provided in the releases page
    -   Go to plugins, click "Plugins Folder", drop the `Plugin.rbxmx` file in there
    -   Restart Studio
    -   If you go to the Plugins tab after opening a place in Roblox Studio, you should see a button called "Deadline modding"
    -   Click it to open the plugin window
-   Get a mod studio place you can work on ([examples here](https://github.com/recoil-group/deadline-modfile-packager/tree/master/examples/source))
    -   Download one and open it with Roblox Studio
-   Export the mod
    -   Open the output (View->Output) to see any errors when exporting
    -   Open the plugin (Plugins->DeadlineSDK in Studio), click on workspace.DeadlineTestMod in the explorer, or the mod folder you have
    -   Click "export selected model as mod" in the plugin menu
-   Get a private Deadline server
    -   Dev branch and 0.23.0 VIP servers are free
-   Load the mod
    -   Instructions below

## How to load a mod

-   Open the modfile script/file. This may be the one you exported in the section above or just one from the public mods section
-   Copy the FULL contents
-   Paste them to the 'server luau console' in-game (accessible after pressing the ` key, right next to Escape on your keyboard)
-   The modfile should load
-   Scroll down to see what map name you need to use to load any maps. It will say "use ... to set the map"
-   Attachments are equippable immediately and will appear on any gun setups that happen to have modded attachments saved. You can also set the map with `map.set_map("map_name")` if you know the map code
