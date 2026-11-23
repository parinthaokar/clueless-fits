# Blender fitting room

Puts a recommended outfit on a 3D mannequin in Blender, over the
[blender-mcp](https://github.com/ahujasid/blender-mcp) add-on. Nothing in the
website or the stylist agent is needed: they only have to hand over an outfit JSON.

## One-time setup
1. Install Blender 3.x or newer.
2. Download `addon.py` from the blender-mcp repo, then Blender > Edit > Preferences > Add-ons > Install... and enable it.
3. In Blender press `N`, open the **BlenderMCP** tab and click **Connect to Claude** (listens on `localhost:9876`).
4. Optional, so Claude Code can also drive Blender directly: `claude mcp add blender -- uvx blender-mcp`

## Use
```
cd blender
python dress.py outfits/example.json                 # dress the mannequin
python dress.py outfits/example.json --render out.png
python dress.py --watch recommendation.json          # re-dress each time the file changes
```
`--watch` is the "when a recommendation is reached" hook: have the recommender write
`recommendation.json` and the model updates.

## Outfit format
Either shape works. Category is one of the dataset's: `tops, bottoms, all-body, outerwear, shoes, bags, hats, sunglasses, jewellery, scarves, accessories`
(the app's `Tops/Dresses/...` names are mapped, and "Accessories" named sunglasses/hat/scarf/necklace is refined).
```json
{ "items": [ { "category": "tops", "name": "Taupe Knit Sweater", "image": "https://.../x.jpg", "color": "#a89684" } ] }
```
or the app's `OutfitSuggestion` (`items: [{slot, item: {...}}]`). A bare `{"item_id": "..."}` is
looked up in the Supabase `items` table if `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set.
A new item replaces whatever is worn in its slot; a dress replaces top and bottom.

## How it works / limits
- `dress.py` sends `scene_builder.py` plus the outfit to Blender's `execute_code` command.
- The dataset only has 2D product photos, so garments are **procedural proxy meshes** (sleeve length,
  skirt vs pants, boots etc. guessed from the item name), not real fitted clothing. With Pillow installed
  the photo is projected onto tops, bottoms, dresses and outerwear and the garment colour comes from the photo.
- The mannequin is a generic figure, not a scan of the user. Swapping `ensure_scene()`'s body for an
  imported rigged model is the next step for a personalised avatar.
