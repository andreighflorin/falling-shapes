
// Extend PIXI.Graphics with a custom method to draw a star shape
PIXI.Graphics.prototype.drawStar = function (x, y, points, radius) {
  if (points < 2) return this;
  const step = Math.PI / points;
  this.moveTo(x + radius, y);
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? radius : radius / 2;
    const angle = i * step;
    this.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
  }
  return this;
};

// Shape parameters
const MIN_SIZE = 20;
const MAX_SIZE = 50;
const GRAVITY_STEP = 1;
const SPAWN_STEP = 1;

class Game {
  static _instance = null;

  constructor(opts = {}) {
    if (Game._instance) return Game._instance;

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Initialize PIXI application
    this.app = new PIXI.Application({
      width: this.width,
      height: this.height,
      backgroundColor: 0x061124,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });

    // Cache references to DOM elements for live updates
    this.shapesCountEl = document.getElementById('shapes-count');
    this.shapesAreaEl = document.getElementById('shapes-area');
    this.spawnRateEl = document.getElementById('spawn-rate');
    this.gravityValEl = document.getElementById('gravity-val');

    // Initialize game settings
    this.gravity = opts.gravity ?? 1;
    this.shapes = [];
    this.spawnPerSecond = opts.spawnPerSecond ?? 1;
    this._lastSpawn = 0;

    Game._instance = this;
  }

  // Attach the game canvas to the DOM and set up event handlers
  mount(dom) {
    dom.appendChild(this.app.view);
    this.app.view.id = 'pixi-canvas';

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = new PIXI.Rectangle(0, 0, this.width, this.height);

    // Spawn a shape where the user clicks (if not clicking on a shape)
    this.app.stage.on('pointerdown', (e) => {
      if (e.target === this.app.stage) {
        const pos = e.global;
        this._spawnShape(pos.x, pos.y, true);
      }
    });

    // Main game loop (runs every frame)
    this.app.ticker.add((delta) => this._update(delta));

    this._setupControls();
    this._resize();
    window.addEventListener('resize', () => this._resize());

    // Pause when tab is inactive, resume when visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.app.ticker.stop();
      else this.app.ticker.start();
    });
  }

  // Hook up control buttons for spawn rate and gravity
  _setupControls() {
    document.getElementById('spawn-inc').onclick = () => { this.spawnPerSecond += SPAWN_STEP; this._updateControls(); };
    document.getElementById('spawn-dec').onclick = () => { this.spawnPerSecond = Math.max(0, this.spawnPerSecond - SPAWN_STEP); this._updateControls(); };
    document.getElementById('grav-inc').onclick = () => { this.gravity += GRAVITY_STEP; this._updateControls(); };
    document.getElementById('grav-dec').onclick = () => { this.gravity = Math.max(0, this.gravity - GRAVITY_STEP); this._updateControls(); };
    this._updateControls();
  }

  // Update control panel text
  _updateControls() {
    this.spawnRateEl.textContent = this.spawnPerSecond;
    this.gravityValEl.textContent = this.gravity;
  }

  // Resize game canvas when window size changes
  _resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.app.renderer.resize(this.width, this.height);
    this.app.stage.hitArea = new PIXI.Rectangle(0, 0, this.width, this.height);
    this._resetGame();
  }

  // Clear all shapes and reset stats
  _resetGame() {
    this.shapes.forEach(shape => shape.destroy());
    this.shapes = [];
    this._lastSpawn = 0;
    this._updateStats();
  }

  // Main update loop - spawns shapes, applies gravity, removes off-screen shapes
  _update(delta) {
    const now = performance.now();
    const interval = 1000 / (this.spawnPerSecond || 1);

    // Spawn shapes based on spawn rate
    if (now - this._lastSpawn >= interval) {
      this._lastSpawn = now;
      if (this.spawnPerSecond > 0) this._spawnShape(Math.random() * this.width, -50);
    }

    // Apply gravity to all shapes
    this.shapes.forEach(shape => shape.y += this.gravity * delta);

    // Remove shapes that fall off-screen
    this.shapes = this.shapes.filter(shape => {
      if (shape.y > this.height + 100) {
        shape.destroy();
        return false;
      }
      return true;
    });

    this._updateStats();
  }

  // Spawn a new shape at (x, y). Sometimes irregular if allowed.
  _spawnShape(x, y, allowIrregular = false) {
    const shape = allowIrregular && Math.random() < 0.3
      ? this._createIrregularShape()
      : this._createRandomShape();
    shape.x = x;
    shape.y = y;

    shape.eventMode = 'static';
    shape.cursor = 'pointer';
    shape.on('pointerdown', () => this._removeShape(shape));

    this.app.stage.addChild(shape);
    this.shapes.push(shape);
  }

  // Remove a shape from the stage and array
  _removeShape(shape) {
    const idx = this.shapes.indexOf(shape);
    if (idx !== -1) this.shapes.splice(idx, 1);
    shape.destroy();
  }

  // Create a randomly chosen shape (polygon, circle, ellipse, or star)
  _createRandomShape() {
    const g = new PIXI.Graphics();
    g.beginFill(Math.random() * 0xffffff);
    const size = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
    const type = Math.floor(Math.random() * 7);

    switch (type) {
      case 0: this._drawPolygon(g, size, 3); break;
      case 1: this._drawPolygon(g, size, 4); break;
      case 2: this._drawPolygon(g, size, 5); break;
      case 3: this._drawPolygon(g, size, 6); break;
      case 4: g.drawCircle(0, 0, size); break;
      case 5: g.drawEllipse(0, 0, size, size / 2); break;
      case 6: g.drawStar(0, 0, 5, size); break;
    }

    g.endFill();
    g._area = this._estimateArea(type, size);
    return g;
  }

  // Create an irregular polygon with random vertices
  _createIrregularShape() {
    const g = new PIXI.Graphics();
    g.beginFill(Math.random() * 0xffffff);
    const points = [];
    const numPoints = 5 + Math.floor(Math.random() * 5);
    const radius = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);

    for (let i = 0; i < numPoints; i++) {
      const angle = (Math.PI * 2 / numPoints) * i;
      const r = radius * (0.5 + Math.random());
      points.push(r * Math.cos(angle), r * Math.sin(angle));
    }

    g.drawPolygon(points);
    g.endFill();
    g._area = this._polygonArea(points);
    return g;
  }

  // Draw a regular polygon
  _drawPolygon(g, radius, sides) {
    const step = (Math.PI * 2) / sides;
    g.moveTo(radius, 0);
    for (let i = 1; i <= sides; i++) {
      g.lineTo(radius * Math.cos(i * step), radius * Math.sin(i * step));
    }
  }

  // Estimate the area of shapes for statistics
  _estimateArea(type, size) {
    switch (type) {
      case 0: return (Math.sqrt(3)/4) * size**2;
      case 1: return size**2;
      case 2: return (5/4) * size**2 * Math.tan(Math.PI/5);
      case 3: return (3*Math.sqrt(3)/2) * size**2;
      case 4: return Math.PI * size**2;
      case 5: return Math.PI * size * (size/2);
      case 6: return (5/2) * size**2 * Math.sin(2*Math.PI/5);
      default: return size**2;
    }
  }

  // Shoelace formula for polygon area
  _polygonArea(points) {
    let area = 0;
    for (let i = 0; i < points.length; i += 2) {
      const x1 = points[i], y1 = points[i+1];
      const x2 = points[(i+2)%points.length], y2 = points[(i+3)%points.length];
      area += x1*y2 - x2*y1;
    }
    return Math.abs(area/2);
  }

  // Update the on-screen statistics
  _updateStats() {
    this.shapesCountEl.textContent = this.shapes.length;
    const totalArea = this.shapes.reduce((sum, s) => sum + (s._area||0), 0);
    this.shapesAreaEl.textContent = Math.round(totalArea);
  }
}

// Start the game with default settings
const game = new Game({ gravity: 1, spawnPerSecond: 1 });
game.mount(document.getElementById('canvas-area'));
