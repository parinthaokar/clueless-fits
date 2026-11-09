import type { Category, GarmentKind } from "./types";

// Tag colors a garment can have, and the fill used to draw it.
export const garmentColors = {
  white: "#ffffff",
  cream: "#fffaf0",
  black: "#2b2724",
  grey: "#b9b4ab",
  mustard: "#f6c544",
  pink: "#f6a5c0",
  raspberry: "#c2185b",
  red: "#d64545",
  lavender: "#c9b3f0",
  denim: "#8fb6e8",
  blue: "#6f9fdc",
  navy: "#2f3e63",
  green: "#7fb069",
  brown: "#8a5a3c",
  tan: "#d8b98c",
} as const;

export type ColorName = keyof typeof garmentColors;
export const colorNames = Object.keys(garmentColors) as ColorName[];

// Drawing to use when the category changes and we don't have a better guess.
export const defaultKind: Record<Category, GarmentKind> = {
  Tops: "tee",
  Bottoms: "trousers",
  Dresses: "dress",
  Outerwear: "blazer",
  Shoes: "sneakers",
  Bags: "bag",
  Accessories: "sunglasses",
};
