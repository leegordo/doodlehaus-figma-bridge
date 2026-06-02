# DoodleHaus Bridge — Figma Plugin

Push designs from [DoodleHaus](https://leegordo.github.io/0xcreative/factory/) directly into Figma as editable native nodes.

## How it works

1. **Generate** a design in DoodleHaus
2. **Click the Figma icon** in the canvas topbar → copies structured JSON
3. **Paste the JSON** into this Figma plugin → renders as native frames, text, rectangles

No screenshots. No static images. Real Figma layers you can edit, restyle, and hand off.

## Install (one-time)

1. In Figma Desktop: **Plugins → Development → Import plugin from manifest**
2. Select `manifest.json` from this repo
3. The plugin appears in **Plugins → Development → DoodleHaus Bridge**

## Supported nodes

| Type | Properties |
|------|-----------|
| `FRAME` | Auto layout, padding, gap, fills, corners, shadows |
| `RECTANGLE` | Fills, strokes, corner radius, shadows |
| `TEXT` | Font, size, color, alignment, line height |
| `ELLIPSE` | Fills, strokes |
| `LINE` | Strokes |

## JSON Schema

See [SCHEMA.md](./SCHEMA.md) for the full spec.

## Files

- `manifest.json` — Figma plugin manifest
- `code.js` — Plugin runtime (node creation, font loading)
- `ui.html` — Plugin UI (paste JSON or fetch from URL)
- `SCHEMA.md` — Design JSON format documentation
