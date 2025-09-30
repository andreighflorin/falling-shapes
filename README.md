This code implements an interactive, browser-based game using **PIXI.js**, a 2D WebGL rendering library. The game continuously spawns randomly generated geometric shapes that fall down the screen under gravity. It also provides interactive controls for adjusting the spawn rate and gravity in real-time, while tracking statistics such as the number of active shapes and their combined area.

### Key Features and Components

1. **Custom Shape Drawing**

   * The `PIXI.Graphics` prototype is extended with a `drawStar` method to render star-shaped polygons.
   * Random shape generation includes circles, ellipses, regular polygons (triangles, squares, pentagons, hexagons), stars, and irregular polygons.

2. **Game Class (Singleton)**

   * Implemented as a singleton to ensure only one game instance exists.
   * Initializes a PIXI application (`PIXI.Application`) with full-window rendering, auto-resizing, and a fixed background color.
   * Maintains core game state including:

     * `gravity` (falling speed of shapes).
     * `spawnPerSecond` (rate of shape generation).
     * An array of active `shapes`.

3. **Mounting and Event Handling**

   * The canvas is attached to a DOM container and given an interactive stage.
   * Mouse clicks on empty space spawn new shapes at the click location.
   * Shapes are interactive: clicking a shape removes it from the screen.
   * Game loop is handled by PIXI’s ticker (`app.ticker`), which updates every frame.

4. **Shape Spawning and Motion**

   * Shapes are spawned periodically based on the configured spawn rate or manually through user interaction.
   * Each frame:

     * Shapes fall according to the current gravity setting.
     * Off-screen shapes are destroyed to free memory.
   * Shapes can be regular or irregular, with areas estimated using geometry formulas (including the shoelace formula for polygons).

5. **Responsive Design and Lifecycle Management**

   * Automatically resizes the game canvas when the window size changes.
   * Clears and resets shapes when resizing occurs.
   * Pauses the ticker when the browser tab becomes inactive to conserve resources.

6. **User Controls**

   * Buttons adjust **spawn rate** and **gravity** in real-time.
   * Current values are displayed in corresponding DOM elements.
   * The control system ensures values never drop below zero.

7. **Statistics**

   * The total number of active shapes and their combined surface area are updated live.
   * Area calculations differ depending on the type of shape (e.g., polygon formulas, circle area formula, ellipse approximation).

### Execution Flow

1. `new Game({...})` initializes the game with default gravity and spawn rate.
2. `game.mount(...)` attaches the PIXI canvas to the DOM, sets up input events, initializes controls, and starts the render loop.
3. The game loop (`_update`) handles:

   * Timed shape spawning.
   * Gravity-based movement.
   * Removal of off-screen shapes.
   * Live statistic updates.

### Use Cases

* Demonstrates real-time rendering and animation with PIXI.js.
* Provides an interactive sandbox for experimenting with basic physics (gravity) and geometry.
* Could be extended with collision detection, scoring, or additional interactivity for gamification.

In summary, this code is a **real-time, interactive shape spawner** built with PIXI.js. It highlights object-oriented design, responsive rendering, user interaction handling, and live statistics tracking within a browser-based graphical application.
