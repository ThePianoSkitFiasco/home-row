/**
 * OverlayManager — loads a JSON "overlay recipe" exported from The Marking Room
 * and materializes it as Phaser GameObjects inside the given scene.
 *
 * Usage:
 *   import OverlayManager from '../systems/OverlayManager.js';
 *   const overlay = new OverlayManager(scene);
 *   overlay.load('src/data/overlays/my_overlay.json').then(() => overlay.apply());
 *   // later:
 *   overlay.destroy();
 */

export default class OverlayManager {
  constructor(scene) {
    this.scene = scene;
    this.recipe = null;
    this._objects = [];
    this._zones = {};  // id → GameObject, for lookup after apply()
  }

  // Load a recipe from a URL/path and parse it.
  async load(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`OverlayManager: failed to load ${path} (${res.status})`);
    this.recipe = await res.json();
    return this;
  }

  // Set a recipe directly from an already-parsed object.
  setRecipe(recipe) {
    this.recipe = recipe;
    return this;
  }

  // Materialise all elements from the recipe into the scene.
  apply() {
    if (!this.recipe) throw new Error('OverlayManager: call load() or setRecipe() before apply()');

    const { canvas, elements = [] } = this.recipe;
    const scaleX = canvas ? this.scene.scale.width  / canvas.width  : 1;
    const scaleY = canvas ? this.scene.scale.height / canvas.height : 1;

    for (const el of elements) {
      const obj = this._createElement(el, scaleX, scaleY);
      if (obj) {
        this._objects.push(obj);
        this._zones[el.id] = obj;
      }
    }

    return this;
  }

  // Return the GameObject for a named element (after apply()).
  get(id) {
    return this._zones[id] ?? null;
  }

  // Remove all created objects from the scene.
  destroy() {
    for (const obj of this._objects) {
      if (obj && obj.destroy) obj.destroy();
    }
    this._objects = [];
    this._zones = {};
  }

  // ── private ────────────────────────────────────────────────────────────────

  _createElement(el, scaleX, scaleY) {
    const x = el.x * scaleX;
    const y = el.y * scaleY;
    const w = (el.width  ?? 0) * scaleX;
    const h = (el.height ?? 0) * scaleY;

    switch (el.type) {
      case 'rect':
        return this._makeRect(el, x, y, w, h);

      case 'text':
        return this._makeText(el, x, y, scaleX, scaleY);

      case 'text_zone':
        // A named region that a scene can query and write into.
        // Rendered as an invisible zone + optional background rect.
        return this._makeTextZone(el, x, y, w, h, scaleX, scaleY);

      case 'image':
        return this._makeImage(el, x, y, scaleX, scaleY);

      default:
        console.warn(`OverlayManager: unknown element type "${el.type}" (id: ${el.id})`);
        return null;
    }
  }

  _makeRect(el, x, y, w, h) {
    const style = el.style ?? {};
    const fill   = style.fill   != null ? parseInt(style.fill.replace('#', ''), 16)   : 0x000000;
    const alpha  = style.alpha  != null ? style.alpha  : 1;
    const border = style.border != null ? parseInt(style.border.replace('#', ''), 16) : null;
    const borderWidth = style.borderWidth ?? 1;

    const rect = this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, fill, alpha);
    if (border != null) {
      rect.setStrokeStyle(borderWidth, border);
    }
    if (el.depth != null) rect.setDepth(el.depth);
    return rect;
  }

  _makeText(el, x, y, scaleX, scaleY) {
    const style = el.style ?? {};
    const fontSize = Math.round((style.fontSize ?? 16) * Math.min(scaleX, scaleY));
    const phaserStyle = {
      fontFamily: style.fontFamily ?? 'monospace',
      fontSize: `${fontSize}px`,
      color: style.color ?? '#ffffff',
      wordWrap: el.width ? { width: el.width * scaleX } : undefined,
    };
    const obj = this.scene.add.text(x, y, el.text ?? '', phaserStyle);
    if (el.depth != null) obj.setDepth(el.depth);
    return obj;
  }

  _makeTextZone(el, x, y, w, h, scaleX, scaleY) {
    const style = el.style ?? {};

    // Optional background rect
    if (style.fill != null) {
      const bg = this._makeRect({ style }, x, y, w, h);
      this._objects.push(bg);
    }

    // An invisible Phaser Zone marks the bounds — the scene can use
    // this.overlay.get('prompt_area').getBounds() to position its own text.
    const zone = this.scene.add.zone(x + w / 2, y + h / 2, w, h);
    if (el.depth != null) zone.setDepth(el.depth);

    // Attach metadata so calling code can read placement without parsing JSON again.
    zone.overlayMeta = {
      id: el.id,
      x, y, width: w, height: h,
      style: {
        fontFamily: style.fontFamily ?? 'monospace',
        fontSize: Math.round((style.fontSize ?? 16) * Math.min(scaleX, scaleY)),
        color: style.color ?? '#ffffff',
      },
    };

    return zone;
  }

  _makeImage(el, x, y, scaleX, scaleY) {
    const key = el.textureKey;
    if (!key || !this.scene.textures.exists(key)) {
      console.warn(`OverlayManager: texture "${key}" not loaded (id: ${el.id})`);
      return null;
    }
    const img = this.scene.add.image(x, y, key);
    img.setOrigin(el.originX ?? 0, el.originY ?? 0);
    if (el.scale != null) img.setScale(el.scale * scaleX, el.scale * scaleY);
    if (el.depth != null) img.setDepth(el.depth);
    return img;
  }
}
