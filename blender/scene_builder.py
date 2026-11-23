"""Runs INSIDE Blender (sent over Blender MCP by dress.py).

Builds a mannequin and dresses it from an outfit dict. Garments are procedural
proxy meshes (the dataset only has 2D product photos), tagged by category so a
new item replaces whatever is already worn in that slot. No bpy.ops: everything
is bmesh + data API, so it does not depend on the UI context.

Person faces -Y (Blender "front view"). Units are metres, feet at z=0.
"""
import math

import bmesh
import bpy
from mathutils import Matrix

TAG = "cf_slot"
SKIN = (0.80, 0.62, 0.52)

# Wearing one of these removes the others.
CONFLICTS = {
    "all-body": {"tops", "bottoms"},
    "tops": {"all-body"},
    "bottoms": {"all-body"},
}

DEFAULT_COLOR = {
    "tops": "#d8d2c4", "bottoms": "#4a5568", "all-body": "#1a1a1a",
    "outerwear": "#b08d63", "shoes": "#f2f2f2", "bags": "#a9764a",
    "hats": "#3a3a3a", "sunglasses": "#111111", "jewellery": "#d4af37",
    "scarves": "#9b2c2c", "accessories": "#d4af37",
}

# Where each photographed garment sits in world space: (centre x, centre z, width, height).
# The product photo is projected straight through the garment from the front.
PROJ = {
    "tops": (0.0, 1.21, 0.64, 0.56),
    "outerwear": (0.0, 1.14, 0.70, 0.76),
    "bottoms": (0.0, 0.57, 0.40, 0.94),
    "all-body": (0.0, 0.98, 0.60, 0.97),
}


# ---------- colour / material ----------

def _linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _rgba(color):
    if isinstance(color, str):
        h = color.lstrip("#")
        color = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    r, g, b = (_linear(float(c)) for c in color[:3])
    return (r, g, b, 1.0)


def _material(name, color, image_path=None, proj=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = _rgba(color)
    bsdf.inputs["Roughness"].default_value = 0.75
    if image_path and proj:
        try:
            img = bpy.data.images.load(image_path, check_existing=True)
        except RuntimeError:
            return mat
        cx, cz, w, h = proj
        coord = nt.nodes.new("ShaderNodeTexCoord")
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        com = nt.nodes.new("ShaderNodeCombineXYZ")
        mapn = nt.nodes.new("ShaderNodeMapping")
        tex = nt.nodes.new("ShaderNodeTexImage")
        mapn.inputs["Scale"].default_value = (1 / w, 1 / h, 1)
        mapn.inputs["Location"].default_value = (0.5 - cx / w, 0.5 - cz / h, 0)
        tex.image = img
        tex.extension = "EXTEND"
        # Object coords == world coords because every mesh is baked at the origin.
        nt.links.new(coord.outputs["Object"], sep.inputs["Vector"])
        nt.links.new(sep.outputs["X"], com.inputs["X"])
        nt.links.new(sep.outputs["Z"], com.inputs["Y"])
        nt.links.new(com.outputs["Vector"], mapn.inputs["Vector"])
        nt.links.new(mapn.outputs["Vector"], tex.inputs["Vector"])
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


# ---------- geometry parts (all take a bmesh first) ----------

def _xf(loc, scale=(1, 1, 1), rot_x=0.0, rot_y=0.0):
    return (Matrix.Translation(loc) @ Matrix.Rotation(rot_y, 4, "Y")
            @ Matrix.Rotation(rot_x, 4, "X") @ Matrix.Diagonal((*scale, 1.0)))


def cone(bm, r_bottom, r_top, z0, z1, x=0.0, y=0.0, sy=1.0):
    bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=40,
        radius1=r_bottom, radius2=r_top, depth=z1 - z0,
        matrix=_xf((x, y, (z0 + z1) / 2), (1, sy, 1)))


def sphere(bm, radius, loc, scale=(1, 1, 1)):
    bmesh.ops.create_uvsphere(
        bm, u_segments=32, v_segments=16, radius=radius, matrix=_xf(loc, scale))


def box(bm, dims, loc, rot_y=0.0):
    bmesh.ops.create_cube(bm, size=1.0, matrix=_xf(loc, dims, rot_y=rot_y))


def torus(bm, major, minor, loc, scale=(1, 1, 1), rot_x=0.0, seg=40, ring=10):
    verts = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        row = []
        for j in range(ring):
            b = 2 * math.pi * j / ring
            r = major + minor * math.cos(b)
            p = _xf(loc, scale, rot_x=rot_x) @ Matrix.Translation(
                (r * math.cos(a), r * math.sin(a), minor * math.sin(b))).to_translation()
            row.append(bm.verts.new(p))
        verts.append(row)
    for i in range(seg):
        for j in range(ring):
            bm.faces.new((verts[i][j], verts[(i + 1) % seg][j],
                          verts[(i + 1) % seg][(j + 1) % ring], verts[i][(j + 1) % ring]))


# ---------- scene ----------

def _new_object(name, slot, mat, fill):
    bm = bmesh.new()
    fill(bm)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    obj[TAG] = slot
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _remove(slot):
    for obj in [o for o in bpy.data.objects if o.get(TAG) == slot]:
        mesh = obj.data
        bpy.data.objects.remove(obj, do_unlink=True)
        if mesh and mesh.users == 0:
            bpy.data.meshes.remove(mesh)


def ensure_scene():
    if any(o.get(TAG) == "body" for o in bpy.data.objects):
        return

    def body(bm):
        sphere(bm, 0.105, (0, 0, 1.68), (1, 1.05, 1.15))           # head
        cone(bm, 0.05, 0.048, 1.46, 1.60)                          # neck
        cone(bm, 0.15, 0.17, 0.88, 1.46, sy=0.65)                  # torso
        for s in (-1, 1):
            sphere(bm, 0.055, (s * 0.205, 0, 1.43))                # shoulder
            cone(bm, 0.035, 0.048, 0.85, 1.45, x=s * 0.22)         # arm
            sphere(bm, 0.04, (s * 0.22, 0, 0.83))                  # hand
            cone(bm, 0.04, 0.075, 0.08, 0.92, x=s * 0.09)          # leg
            sphere(bm, 1.0, (s * 0.09, -0.03, 0.04), (0.045, 0.11, 0.04))  # foot

    _new_object("cf_body", "body", _material("cf_skin", SKIN), body)

    _new_object("cf_floor", "scenery", _material("cf_floor", "#c9c9c9"),
                lambda bm: cone(bm, 0.9, 0.9, -0.02, 0.0))

    cam_data = bpy.data.cameras.new("cf_cam")
    cam = bpy.data.objects.new("cf_cam", cam_data)
    cam.location = (0, -5.6, 0.95)
    cam.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    sun_data = bpy.data.lights.new("cf_sun", "SUN")
    sun_data.energy = 3.0
    sun = bpy.data.objects.new("cf_sun", sun_data)
    sun.rotation_euler = (math.radians(50), 0, math.radians(-30))
    bpy.context.scene.collection.objects.link(sun)

    world = bpy.context.scene.world or bpy.data.worlds.new("cf_world")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = next((n for n in world.node_tree.nodes if n.type == "BACKGROUND"), None)
    if bg:
        bg.inputs["Color"].default_value = (0.9, 0.9, 0.9, 1)
        bg.inputs["Strength"].default_value = 0.8


# ---------- garments ----------

def _has(name, words):
    return any(w in name for w in words)


def _top_parts(name, outer):
    sleeveless = _has(name, ("tank", "cami", "sleeveless", "halter", "vest"))
    long_sleeve = outer or _has(name, (
        "sweater", "sweatshirt", "hoodie", "long sleeve", "cardigan",
        "turtleneck", "blouse", "knit", "pullover", "jumper"))

    def fill(bm):
        if outer:
            cone(bm, 0.20, 0.20, 0.78, 1.49, sy=0.70)
        else:
            cone(bm, 0.168, 0.183, 0.93, 1.47, sy=0.66)
        if sleeveless:
            return
        r_sh = 0.075 if outer else 0.066
        for s in (-1, 1):
            sphere(bm, r_sh, (s * 0.21, 0, 1.43))
            if long_sleeve:
                cone(bm, 0.06 if outer else 0.05, 0.07 if outer else 0.058,
                     0.88 if not outer else 0.84, 1.45, x=s * 0.22)
            else:
                cone(bm, 0.052, 0.058, 1.27, 1.45, x=s * 0.22)
    return fill


def _bottom_parts(name):
    def fill(bm):
        if "skirt" in name:
            hem = 0.62 if _has(name, ("mini",)) else 0.40
            cone(bm, 0.27, 0.165, hem, 1.04, sy=0.9)
            return
        cone(bm, 0.162, 0.166, 0.88, 1.04, sy=0.68)  # waistband
        bottom = 0.55 if "short" in name else 0.10
        for s in (-1, 1):
            cone(bm, 0.07 if bottom > 0.3 else 0.055, 0.088, bottom, 0.93, x=s * 0.09)
    return fill


def _dress_parts(name):
    hem = 0.62 if "mini" in name else 0.12 if _has(name, ("maxi", "gown")) else 0.45

    def fill(bm):
        cone(bm, 0.168, 0.183, 0.93, 1.47, sy=0.66)
        cone(bm, 0.27 if hem > 0.3 else 0.32, 0.168, hem, 0.95, sy=0.85)
        for s in (-1, 1):
            sphere(bm, 0.062, (s * 0.205, 0, 1.43))
    return fill


def _parts(category, name):
    if category == "tops":
        return _top_parts(name, outer=False)
    if category == "outerwear":
        return _top_parts(name, outer=True)
    if category == "bottoms":
        return _bottom_parts(name)
    if category == "all-body":
        return _dress_parts(name)
    if category == "shoes":
        def fill(bm):
            for s in (-1, 1):
                sphere(bm, 1.0, (s * 0.09, -0.03, 0.045), (0.052, 0.12, 0.048))
                if "boot" in name:
                    cone(bm, 0.05, 0.062, 0.05, 0.32, x=s * 0.09)
        return fill
    if category == "hats":
        def fill(bm):
            cone(bm, 0.118, 0.118, 1.72, 1.84)
            cone(bm, 0.20, 0.20, 1.745, 1.755)
        return fill
    if category == "sunglasses":
        def fill(bm):
            for s in (-1, 1):
                sphere(bm, 1.0, (s * 0.045, -0.108, 1.69), (0.035, 0.008, 0.025))
                box(bm, (0.003, 0.05, 0.004), (s * 0.09, -0.06, 1.69))
            box(bm, (0.02, 0.006, 0.004), (0, -0.109, 1.7))
        return fill
    if category == "bags":
        def fill(bm):
            box(bm, (0.08, 0.28, 0.24), (0.28, 0, 0.68))
            torus(bm, 0.06, 0.008, (0.28, 0, 0.83), rot_x=math.radians(90), seg=24, ring=6)
        return fill
    if category == "jewellery":
        return lambda bm: torus(bm, 0.075, 0.005, (0, 0, 1.485), seg=48, ring=6)
    if category == "scarves":
        return lambda bm: torus(bm, 0.078, 0.024, (0, 0, 1.49), (1, 0.85, 1))
    # accessories: a bracelet
    return lambda bm: torus(bm, 0.045, 0.007, (-0.22, 0, 0.9), seg=32, ring=6)


def wear(item):
    category = item["category"]
    for gone in CONFLICTS.get(category, ()):
        _remove(gone)
    _remove(category)
    name = (item.get("name") or "").lower()
    color = item.get("color") or DEFAULT_COLOR.get(category, "#cccccc")
    mat = _material(f"cf_{category}", color, item.get("image"), PROJ.get(category))
    return _new_object(f"cf_{category}", category, mat, _parts(category, name))


def dress(outfit):
    """outfit: {"items": [{category, name, color?, image?}], "reset": bool, "render": path?}"""
    ensure_scene()
    if outfit.get("reset", True):
        for slot in list(DEFAULT_COLOR):
            _remove(slot)
    worn = [wear(i).name for i in outfit["items"]]
    if outfit.get("render"):
        scene = bpy.context.scene
        scene.render.filepath = outfit["render"]
        scene.render.resolution_x, scene.render.resolution_y = 900, 1200
        bpy.ops.render.render(write_still=True)
    print("wearing:", ", ".join(worn))
    return worn
