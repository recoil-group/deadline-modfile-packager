# deadline-modfile-packager

## NOTICE

Currently the plugin is not public and so is the format. [You may view currently public modfiles here](https://github.com/blackshibe/deadline-insitux-core-scripts/tree/master/modfile)

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

-   Get the plugin from the releases page. there's a place file you can view a test mod from as well
-   Open the template place provided in the releases page
-   Open the plugin, select workspace.DeadlineTestMod
-   Click "export selected model as mod"
-   Copy the string from the studio output to a separate file
-   Wrap it in `load_mod()`, like `load_mod("STRING_HERE")`
-   Paste it to the 'server luau console' in-game (accessible after pressing `)
-   The modfile should load
-   Attachments are accessible immediately. You can set the map with `map.set_map("map_name")`
