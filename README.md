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

# Public mods

-   [Official mods](https://github.com/blackshibe/deadline-insitux-core-scripts/tree/master/modfile)

# How to

Generally, you want to

-   Install the plugin
    -   Get the plugin from the releases page. there's a place file you can view a test mod from as well
    -   Open the template mod place provided in the releases page
    -   Go to plugins, click "Plugins Folder", drop the `Plugin.rbxmx` file in there
    -   Restart Studio
-   Get a mod studio place you can work on ([examples here](https://github.com/recoil-group/deadline-modfile-packager/tree/master/examples/source))
-   Export the mod
    -   Open the plugin (Plugins->DeadlineSDK), click on workspace.DeadlineTestMod, or wherever your mod is located
    -   Click "export selected model as mod" in the plugin menu
-   Get a private Deadline server
    -   Dev branch and 0.23.0 VIP servers are free
-   Load the mod
    -   Instructions below

## How to load a mod

-   Open the modfile script. This may be the one you exported in the section above or just one from the public mods section
-   Copy the FULL contents
-   Paste them to the 'server luau console' in-game (accessible after pressing the ` key, right next to Escape on your keyboard)
-   The modfile should load
-   Attachments are accessible immediately. You can set the map with `map.set_map("map_name")`
