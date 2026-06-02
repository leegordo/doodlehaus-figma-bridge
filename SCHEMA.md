# DoodleHaus → Figma JSON Schema v1

This document defines the JSON format that the DoodleHaus Bridge plugin consumes.

## Top-level structure

```json
{
  "version": "1.0",
  "nodes": [
    { /* node */ },
    { /* node */ }
  ]
}
```

`nodes` is an array of top-level nodes. Each node becomes a direct child of the current Figma page.

## Node types

All nodes share these base properties:

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | `FRAME`, `RECTANGLE`, `TEXT`, `ELLIPSE`, `LINE` |
| `name` | string | Layer name in Figma |
| `x` | number | X position in pixels |
| `y` | number | Y position in pixels |
| `width` | number | Width in pixels |
| `height` | number | Height in pixels |
| `fills` | array/object | Fill(s) — see Color section |
| `strokes` | array/object | Stroke fill(s) |
| `strokeWeight` | number | Stroke width |
| `strokeAlign` | string | `INSIDE`, `OUTSIDE`, `CENTER` |
| `cornerRadius` | number | Uniform corner radius |
| `topLeftRadius` | number | Individual corner overrides |
| `topRightRadius` | number | |
| `bottomLeftRadius` | number | |
| `bottomRightRadius` | number | |
| `opacity` | number | 0–1 |
| `effects` | array | Drop shadows — see Effects section |
| `layoutMode` | string | `HORIZONTAL`, `VERTICAL` (auto layout) |
| `primaryAxisAlignItems` | string | `MIN`, `CENTER`, `MAX`, `SPACE_BETWEEN` |
| `counterAxisAlignItems` | string | `MIN`, `CENTER`, `MAX` |
| `itemSpacing` | number | Gap between children |
| `paddingTop` | number | |
| `paddingRight` | number | |
| `paddingBottom` | number | |
| `paddingLeft` | number | |
| `constraints` | object | `{ horizontal, vertical }` |
| `children` | array | Child nodes (recursive) |

## Colors

Colors can be specified in multiple ways:

```json
// Hex string
{ "color": "#00f0ff" }

// RGB object (0–1 floats)
{ "color": { "r": 0, "g": 0.941, "b": 1 } }

// CSS rgb()
{ "color": "rgb(0, 240, 255)" }
```

## Fills

A fill can be a single object or an array:

```json
// Solid color
{ "type": "solid", "color": "#00f0ff", "opacity": 1 }

// Linear gradient
{
  "type": "gradient-linear",
  "gradientTransform": [[1,0,0],[0,1,0]],
  "gradientStops": [
    { "position": 0, "color": "#00f0ff", "opacity": 1 },
    { "position": 1, "color": "#a855f7", "opacity": 1 }
  ]
}
```

## Text nodes

Additional properties for `TEXT` nodes:

| Property | Type | Description |
|----------|------|-------------|
| `characters` | string | The text content |
| `fontSize` | number | Font size in px |
| `fontName` | object | `{ family: "Inter", style: "Regular" }` |
| `textCase` | string | `ORIGINAL`, `UPPER`, `LOWER`, `TITLE` |
| `textDecoration` | string | `NONE`, `UNDERLINE`, `STRIKETHROUGH` |
| `letterSpacing` | number/object | Pixel value or `{ value, unit }` |
| `lineHeight` | number/object | Pixel value or `{ value, unit }` |
| `textAlignHorizontal` | string | `LEFT`, `CENTER`, `RIGHT`, `JUSTIFIED` |
| `textAlignVertical` | string | `TOP`, `CENTER`, `BOTTOM` |
| `color` | string/object | Shortcut for text fill color |

## Effects

```json
{
  "effects": [
    {
      "type": "DROP_SHADOW",
      "color": "#000000",
      "opacity": 0.25,
      "offset": { "x": 0, "y": 4 },
      "radius": 8,
      "spread": 0,
      "blendMode": "NORMAL"
    }
  ]
}
```

## Example

```json
{
  "version": "1.0",
  "nodes": [
    {
      "type": "FRAME",
      "name": "Hero Section",
      "x": 0,
      "y": 0,
      "width": 1440,
      "height": 800,
      "fills": { "type": "solid", "color": "#050508" },
      "children": [
        {
          "type": "TEXT",
          "name": "Headline",
          "x": 120,
          "y": 240,
          "width": 600,
          "height": 80,
          "characters": "Design Without Limits",
          "fontSize": 64,
          "fontName": { "family": "Space Grotesk", "style": "Bold" },
          "color": "#ffffff",
          "textAlignHorizontal": "LEFT"
        },
        {
          "type": "RECTANGLE",
          "name": "CTA Button",
          "x": 120,
          "y": 380,
          "width": 180,
          "height": 48,
          "cornerRadius": 8,
          "fills": { "type": "solid", "color": "#00f0ff" }
        }
      ]
    }
  ]
}
```

## Generating from HTML/CSS

When converting a web component to Figma nodes:

1. **Container** → `FRAME` with `layoutMode` matching flex direction
2. **Background color** → `fills` on the frame
3. **Text elements** → `TEXT` nodes with computed `fontSize`, `fontFamily`, `color`
4. **Images** → `RECTANGLE` with image fill (or placeholder rectangle)
5. **Borders** → `strokes` + `strokeWeight` + `cornerRadius`
6. **Shadows** → `effects` array
7. **Padding** → `padding*` properties on parent frame
8. **Gap** → `itemSpacing` on parent frame

Use `getComputedStyle()` in the browser to extract actual rendered values.
