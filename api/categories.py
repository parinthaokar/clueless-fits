"""
Category mapping between the model and the frontend.

The model predicts the 11 raw Polyvore categories. The frontend (lib/types.ts)
uses 7 app categories and 4 outfit slots, so the backend translates here and
the frontend never has to know about the raw labels.
"""

# The 11 classes the model can predict (raw Polyvore labels).
MODEL_CLASSES = [
    "accessories", "all-body", "bags", "bottoms", "hats", "jewellery",
    "outerwear", "scarves", "shoes", "sunglasses", "tops",
]

# Raw label -> frontend Category (must match `Category` in lib/types.ts).
APP_CATEGORY = {
    "tops": "Tops",
    "bottoms": "Bottoms",
    "all-body": "Dresses",
    "outerwear": "Outerwear",
    "shoes": "Shoes",
    "bags": "Bags",
    "jewellery": "Accessories",
    "sunglasses": "Accessories",
    "hats": "Accessories",
    "scarves": "Accessories",
    "accessories": "Accessories",
}

# Raw label -> outfit slots the item can fill (must match `Slot` in lib/types.ts).
# A dress fills both the top and bottom slots. Outerwear is layered over a top.
SLOTS = {
    "tops": ["Top"],
    "bottoms": ["Bottom"],
    "all-body": ["Top", "Bottom"],
    "outerwear": ["Top"],
    "shoes": ["Shoes"],
    "bags": ["Accessory"],
    "jewellery": ["Accessory"],
    "sunglasses": ["Accessory"],
    "hats": ["Accessory"],
    "scarves": ["Accessory"],
    "accessories": ["Accessory"],
}

assert set(APP_CATEGORY) == set(MODEL_CLASSES) == set(SLOTS)
