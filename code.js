// DoodleHaus Bridge — Figma Plugin
// Reads structured JSON and renders native Figma nodes

const SUPPORTED_TYPES = ['FRAME', 'RECTANGLE', 'TEXT', 'ELLIPSE', 'LINE'];

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255
  };
}

function parseColor(colorInput) {
  if (!colorInput) return { r: 0, g: 0, b: 0 };
  if (typeof colorInput === 'string') {
    if (colorInput.startsWith('#')) return hexToRgb(colorInput);
    if (colorInput.startsWith('rgb')) {
      const m = colorInput.match(/\d+/g);
      if (m) return { r: m[0]/255, g: m[1]/255, b: m[2]/255 };
    }
    if (colorInput.startsWith('hsl')) {
      return { r: 0.5, g: 0.5, b: 0.5 };
    }
  }
  if (typeof colorInput === 'object' && 'r' in colorInput) {
    return colorInput;
  }
  return { r: 0, g: 0, b: 0 };
}

function parseFill(fillInput) {
  if (!fillInput) return [];
  if (Array.isArray(fillInput)) {
    return fillInput.map(f => parseSingleFill(f)).filter(Boolean);
  }
  const single = parseSingleFill(fillInput);
  return single ? [single] : [];
}

function parseSingleFill(fill) {
  if (!fill) return null;
  if (fill.type === 'SOLID' || fill.type === 'solid') {
    return {
      type: 'SOLID',
      color: parseColor(fill.color),
      opacity: fill.opacity !== undefined ? fill.opacity : 1
    };
  }
  if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'gradient-linear') {
    return {
      type: 'GRADIENT_LINEAR',
      gradientTransform: fill.gradientTransform || [[1,0,0],[0,1,0]],
      gradientStops: (fill.gradientStops || []).map(s => ({
        position: s.position,
        color: { ...parseColor(s.color), a: s.opacity !== undefined ? s.opacity : 1 }
      }))
    };
  }
  if (fill.color) {
    return { type: 'SOLID', color: parseColor(fill.color), opacity: fill.opacity || 1 };
  }
  return null;
}

async function loadFontsForNode(nodeSpec) {
  const fonts = [];
  function collect(n) {
    if (n.type === 'TEXT' || n.type === 'text') {
      const fontName = n.fontName || { family: 'Inter', style: 'Regular' };
      const key = `${fontName.family}:${fontName.style}`;
      if (!fonts.find(f => `${f.family}:${f.style}` === key)) {
        fonts.push(fontName);
      }
    }
    (n.children || []).forEach(collect);
  }
  collect(nodeSpec);

  for (const font of fonts) {
    try {
      await figma.loadFontAsync(font);
    } catch (e) {
      console.warn(`Font load failed: ${font.family} ${font.style}`, e);
      try {
        await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      } catch (_) {}
    }
  }
}

function createNode(spec, parent) {
  const type = (spec.type || 'FRAME').toUpperCase();
  let node;

  switch (type) {
    case 'FRAME':
      node = figma.createFrame();
      break;
    case 'RECTANGLE':
      node = figma.createRectangle();
      break;
    case 'TEXT':
      node = figma.createText();
      break;
    case 'ELLIPSE':
      node = figma.createEllipse();
      break;
    case 'LINE':
      node = figma.createLine();
      break;
    default:
      node = figma.createFrame();
  }

  // Basic properties
  if (spec.name) node.name = spec.name;
  if (spec.x !== undefined) node.x = spec.x;
  if (spec.y !== undefined) node.y = spec.y;
  if (spec.width !== undefined && spec.height !== undefined) {
    node.resize(spec.width, spec.height);
  }

  // Fills
  if (spec.fills) {
    node.fills = parseFill(spec.fills);
  }

  // Strokes
  if (spec.strokes) {
    node.strokes = parseFill(spec.strokes);
  }
  if (spec.strokeWeight !== undefined) {
    node.strokeWeight = spec.strokeWeight;
  }
  if (spec.strokeAlign) {
    node.strokeAlign = spec.strokeAlign;
  }

  // Corner radius
  if (spec.cornerRadius !== undefined) {
    node.topLeftRadius = spec.cornerRadius;
    node.topRightRadius = spec.cornerRadius;
    node.bottomLeftRadius = spec.cornerRadius;
    node.bottomRightRadius = spec.cornerRadius;
  }
  if (spec.topLeftRadius !== undefined) node.topLeftRadius = spec.topLeftRadius;
  if (spec.topRightRadius !== undefined) node.topRightRadius = spec.topRightRadius;
  if (spec.bottomLeftRadius !== undefined) node.bottomLeftRadius = spec.bottomLeftRadius;
  if (spec.bottomRightRadius !== undefined) node.bottomRightRadius = spec.bottomRightRadius;

  // Effects (shadows)
  if (spec.effects) {
    node.effects = spec.effects.map(e => ({
      type: e.type || 'DROP_SHADOW',
      color: { ...parseColor(e.color), a: e.opacity || 0.25 },
      offset: e.offset || { x: 0, y: 4 },
      radius: e.radius || 8,
      spread: e.spread || 0,
      visible: true,
      blendMode: e.blendMode || 'NORMAL'
    }));
  }

  // Opacity
  if (spec.opacity !== undefined) {
    node.opacity = spec.opacity;
  }

  // Layout (auto layout)
  if (spec.layoutMode) {
    node.layoutMode = spec.layoutMode;
    if (spec.primaryAxisAlignItems) node.primaryAxisAlignItems = spec.primaryAxisAlignItems;
    if (spec.counterAxisAlignItems) node.counterAxisAlignItems = spec.counterAxisAlignItems;
    if (spec.itemSpacing !== undefined) node.itemSpacing = spec.itemSpacing;
    if (spec.paddingTop !== undefined) node.paddingTop = spec.paddingTop;
    if (spec.paddingRight !== undefined) node.paddingRight = spec.paddingRight;
    if (spec.paddingBottom !== undefined) node.paddingBottom = spec.paddingBottom;
    if (spec.paddingLeft !== undefined) node.paddingLeft = spec.paddingLeft;
  }

  // Text-specific
  if (type === 'TEXT') {
    if (spec.characters !== undefined) {
      node.characters = String(spec.characters);
    }
    if (spec.fontSize) {
      node.fontSize = spec.fontSize;
    }
    if (spec.fontName) {
      node.fontName = spec.fontName;
    }
    if (spec.textCase) {
      node.textCase = spec.textCase;
    }
    if (spec.textDecoration) {
      node.textDecoration = spec.textDecoration;
    }
    if (spec.letterSpacing) {
      node.letterSpacing = typeof spec.letterSpacing === 'object'
        ? spec.letterSpacing
        : { value: spec.letterSpacing, unit: 'PIXELS' };
    }
    if (spec.lineHeight) {
      node.lineHeight = typeof spec.lineHeight === 'object'
        ? spec.lineHeight
        : { value: spec.lineHeight, unit: 'PIXELS' };
    }
    if (spec.textAlignHorizontal) {
      node.textAlignHorizontal = spec.textAlignHorizontal;
    }
    if (spec.textAlignVertical) {
      node.textAlignVertical = spec.textAlignVertical;
    }
    if (spec.fills && node.fills.length > 0) {
      // Text uses fills for color — already set above
    } else if (spec.color) {
      node.fills = [{ type: 'SOLID', color: parseColor(spec.color) }];
    }
  }

  // Constraints
  if (spec.constraints) {
    node.constraints = spec.constraints;
  }

  // Append to parent
  if (parent && 'appendChild' in parent) {
    parent.appendChild(node);
  }

  // Recurse children
  if (spec.children && Array.isArray(spec.children)) {
    spec.children.forEach(child => createNode(child, node));
  }

  return node;
}

// Main handlers
figma.showUI(__html__, { width: 380, height: 520 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'render-json') {
    let data;
    try {
      data = typeof msg.json === 'string' ? JSON.parse(msg.json) : msg.json;
    } catch (e) {
      figma.ui.postMessage({ type: 'error', message: 'Invalid JSON: ' + e.message });
      return;
    }

    if (!data.nodes && !Array.isArray(data)) {
      figma.ui.postMessage({ type: 'error', message: 'JSON must have a "nodes" array or be an array of nodes.' });
      return;
    }

    const nodes = data.nodes || data;
    if (!Array.isArray(nodes) || nodes.length === 0) {
      figma.ui.postMessage({ type: 'error', message: 'No nodes found in JSON.' });
      return;
    }

    figma.ui.postMessage({ type: 'status', message: 'Loading fonts...' });

    // Load all fonts first
    for (const node of nodes) {
      await loadFontsForNode(node);
    }

    figma.ui.postMessage({ type: 'status', message: `Rendering ${nodes.length} top-level nodes...` });

    const created = [];
    for (const nodeSpec of nodes) {
      try {
        const n = createNode(nodeSpec, figma.currentPage);
        created.push(n);
      } catch (e) {
        console.error('Failed to create node:', nodeSpec.name, e);
      }
    }

    // Select and zoom to fit
    if (created.length > 0) {
      figma.currentPage.selection = created;
      figma.viewport.scrollAndZoomIntoView(created);
    }

    figma.ui.postMessage({
      type: 'success',
      message: `Created ${created.length} node(s) on the canvas.`
    });

  } else if (msg.type === 'fetch-url') {
    try {
      const response = await fetch(msg.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      figma.ui.postMessage({ type: 'fetched', data });
    } catch (e) {
      figma.ui.postMessage({ type: 'error', message: 'Fetch failed: ' + e.message });
    }
  }
};
