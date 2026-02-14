/**
 * Favicon Animator Module
 * ========================
 * Handles the animated favicon drawing functionality.
 * Uses the module pattern to avoid global scope pollution.
 *
 * How it works:
 * 1. User hovers over the button
 * 2. Animation loop begins drawing a square on canvas (0-100%)
 * 3. Each frame converts the canvas to a PNG and sets it as the favicon
 * 4. When animation completes, the square is fully drawn
 *
 * @example
 * FaviconAnimator.init();
 */

const FaviconAnimator = (() => {
  /**
   * PRIVATE VARIABLES
   * These variables are only accessible within this module
   */

  // DOM elements cached for performance (prevents repeated queries)
  let canvas = null;
  let context = null;
  let button = null;
  let favicon = null;

  // Animation state variables
  let animationProgress = 0; // Tracks drawing progress from 0-100
  let animationInterval = null; // Reference to setInterval for cleanup

  // Canvas drawing configuration
  const CANVAS_SIZE = 32; // Width and height in pixels
  const ANIMATION_DURATION = 100; // Total frames (0-100)
  const ANIMATION_SPEED = 60; // Milliseconds between frames (lower = faster)
  const GRADIENT_START_COLOR = "#c7f0fe"; // Light cyan
  const GRADIENT_END_COLOR = "#56d3c9"; // Teal

  /**
   * PRIVATE METHODS
   * Helper functions used internally by the module
   */

  /**
   * Initializes canvas 2D context and configures drawing styles
   * Called once during setup
   *
   * @returns {boolean} True if canvas context is supported, false otherwise
   */
  const setupCanvas = () => {
    // Safety check: ensure canvas is available
    if (!canvas) {
      console.error("Canvas element not found");
      return false;
    }

    // Get 2D context (required for drawing operations)
    context = canvas.getContext("2d");

    // Safety check: ensure browser supports 2D canvas
    if (!context) {
      console.error("Canvas 2D context not supported");
      return false;
    }

    // Create a gradient from top-left to bottom-right
    const gradient = context.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    gradient.addColorStop(0, GRADIENT_START_COLOR); // Start color at 0% (top-left)
    gradient.addColorStop(1, GRADIENT_END_COLOR); // End color at 100% (bottom-right)

    // Apply gradient styling to the stroke (the lines we'll draw)
    context.strokeStyle = gradient;
    context.lineWidth = 8; // Thickness of the square outline

    return true;
  };

  /**
   * Incremental drawing function called on each animation frame
   * Draws a square progressively over 4 stages:
   * 0-25%:   Top edge (0,0) → (32,0)
   * 25-50%:  Right edge (32,0) → (32,32)
   * 50-75%:  Bottom edge (32,32) → (0,32)
   * 75-100%: Left edge (0,32) → (0,0)
   *
   * After each frame, converts canvas to PNG and updates favicon
   */
  const animateFrame = () => {
    // Clear the canvas for this frame
    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Start a new drawing path
    context.beginPath();

    /**
     * STAGE 1: Draw top edge (0-25%)
     * Draws from (0,0) to (32,0) - horizontal line at top
     *
     * Progress: animationProgress goes 0→25
     * Calculation: (32/25) * animationProgress maps to distance across top
     * Example: at 50% progress (animationProgress=50):
     *   - (32/25) * 50 = 64px (but capped at 32px width)
     */
    if (animationProgress <= 25) {
      const currentWidth = (CANVAS_SIZE / 25) * animationProgress;
      context.moveTo(0, 0);
      context.lineTo(currentWidth, 0);
    }
    /**
     * STAGE 2: Draw right edge (25-50%)
     * Completes top edge + draws right edge down
     * Draws top line fully, then right edge from (32,0) to (32,32)
     *
     * Progress: animationProgress goes 25→50
     * Calculation: (32/25) * (animationProgress - 25) maps to height on right side
     */
    else if (animationProgress > 25 && animationProgress <= 50) {
      // Draw top edge (complete)
      context.moveTo(0, 0);
      context.lineTo(CANVAS_SIZE, 0);
      // Draw right edge (partial)
      const currentHeight = (CANVAS_SIZE / 25) * (animationProgress - 25);
      context.moveTo(CANVAS_SIZE, 0);
      context.lineTo(CANVAS_SIZE, currentHeight);
    }
    /**
     * STAGE 3: Draw bottom edge (50-75%)
     * Completes top + right edges + draws bottom edge left
     * Draws bottom from (32,32) to (0,32)
     *
     * Progress: animationProgress goes 50→75
     * Calculation: -(32/25) * (animationProgress - 75) creates leftward motion
     * The negative sign makes it go backwards (right to left)
     */
    else if (animationProgress > 50 && animationProgress <= 75) {
      // Draw top edge (complete)
      context.moveTo(0, 0);
      context.lineTo(CANVAS_SIZE, 0);
      // Draw right edge (complete)
      context.moveTo(CANVAS_SIZE, 0);
      context.lineTo(CANVAS_SIZE, CANVAS_SIZE);
      // Draw bottom edge (partial, going right to left)
      const currentWidth = -((CANVAS_SIZE / 25) * (animationProgress - 75));
      context.moveTo(CANVAS_SIZE, CANVAS_SIZE);
      context.lineTo(currentWidth, CANVAS_SIZE);
    }
    /**
     * STAGE 4: Draw left edge (75-100%)
     * Completes entire square by drawing left edge up
     * Draws left side from (0,32) to (0,0)
     *
     * Progress: animationProgress goes 75→100
     * Calculation: -(32/25) * (animationProgress - 100) creates upward motion
     * The negative sign makes it go upwards (bottom to top)
     */
    else if (animationProgress > 75 && animationProgress <= ANIMATION_DURATION) {
      // Draw top edge (complete)
      context.moveTo(0, 0);
      context.lineTo(CANVAS_SIZE, 0);
      // Draw right edge (complete)
      context.moveTo(CANVAS_SIZE, 0);
      context.lineTo(CANVAS_SIZE, CANVAS_SIZE);
      // Draw bottom edge (complete)
      context.moveTo(CANVAS_SIZE, CANVAS_SIZE);
      context.lineTo(0, CANVAS_SIZE);
      // Draw left edge (partial, going bottom to top)
      const currentHeight = -((CANVAS_SIZE / 25) * (animationProgress - ANIMATION_DURATION));
      context.moveTo(0, CANVAS_SIZE);
      context.lineTo(0, currentHeight);
    }

    // Actually paint the lines to the canvas
    context.stroke();

    // Convert canvas drawing to PNG data URL and update favicon
    favicon.href = canvas.toDataURL("image/png");

    // Check if animation is complete
    if (animationProgress === ANIMATION_DURATION) {
      // Stop the animation loop
      clearInterval(animationInterval);
      animationInterval = null;
      return; // Exit function
    }

    // Increment progress for next frame
    animationProgress++;
  };

  /**
   * Sets up button click/hover handlers
   * Triggers animation when user hovers over the button
   */
  const setupButton = () => {
    if (!button) {
      console.error("Button element not found");
      return;
    }

    // Listen for mouse entering the button
    button.addEventListener("mouseenter", handleButtonHover);
  };

  /**
   * Event handler for button hover
   * Starts the animation sequence
   */
  const handleButtonHover = function () {
    // Reset animation progress for this cycle
    animationProgress = 0;

    // Start the animation loop, calling animateFrame every ANIMATION_SPEED ms
    animationInterval = setInterval(animateFrame, ANIMATION_SPEED);

    // Disable button while animating to prevent multiple clicks
    this.setAttribute("disabled", "");
  };

  /**
   * Re-enables the button after page reload
   * Ensures button is clickable even if previously disabled
   */
  const resetButton = () => {
    if (button && button.hasAttribute("disabled")) {
      button.removeAttribute("disabled");
    }
  };

  /**
   * PUBLIC API
   * Methods accessible from outside the module
   */

  /**
   * Initializes the favicon animator
   * Called once when page loads
   * Sets up DOM elements, canvas, and event listeners
   *
   * @returns {boolean} True if initialization was successful
   */
  const init = () => {
    // Query DOM for required elements
    canvas = document.querySelector("canvas");
    button = document.querySelector("button");
    favicon = document.querySelector('link[rel*="icon"]');

    // Safety checks
    if (!canvas || !button || !favicon) {
      console.error("Required DOM elements not found");
      return false;
    }

    // Set canvas size attributes (required for proper drawing)
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // Initialize canvas context and styles
    if (!setupCanvas()) {
      return false;
    }

    // Set up button event listeners
    setupButton();

    // Reset button state from previous page loads
    resetButton();

    console.log("FaviconAnimator initialized successfully");
    return true;
  };

  // Return public API
  return {
    init: init,
  };
})();
