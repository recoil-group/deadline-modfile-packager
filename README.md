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

# Supported instance decode

| Name           | Support       |
| -------------- | ------------- |
| Part           | Partial       |
| MeshPart       | None          |
| Model          | Instance-only |
| Folder         | Full          |
| SpecialMesh    | Partial       |
| Motor6D        | Partial       |
| SurfaceGui     | Partial       |
| Frame          | Partial       |
| CanvasGroup    | Partial       |
| WeldConstraint | Partial       |
| Texture        | Full          |
| Attachment     | Instace-only  |

# Public mods

-   [Official test mods](https://github.com/blackshibe/deadline-insitux-core-scripts/tree/master/modfile)

# How to

-   Get a private Deadline server
-   Get the plugin from the releases page. there's a place file you can view a test mod from as well
-   Open the template place provided in the releases page
-   Go to plugins, Local Plugins, drop the plugin file in there, restart studio
-   Open the plugin (Plugins->DeadlineSDK), click on workspace.DeadlineTestMod
-   Click "export selected model as mod" in the plugin menu
-   Open the script you exported in notepad, copy the contents
-   Paste it to the 'server luau console' in-game (accessible after pressing `)
-   The modfile should load
-   Attachments are accessible immediately. You can set the map with `map.set_map("map_name")`
