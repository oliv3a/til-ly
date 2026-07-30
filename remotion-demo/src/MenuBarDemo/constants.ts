// Shared layout + timing constants for the macOS menu bar demo.
// Keeping every magic number here means the animation in MenuBarDemo.tsx
// reads like a storyboard instead of a wall of pixel math.

// Canvas is 2/3 scale of a 1440x900 "laptop screen" (same 8:5 aspect), so
// the desktop area reads smaller/more compact overall. MENU_BAR_HEIGHT,
// APP_ICON_SIZE, and all menu bar text/glyph sizes below are intentionally
// NOT scaled down with it -- they stay at their original absolute pixel
// sizes so the menu bar itself stays just as legible, just proportionally
// larger within the smaller frame.
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 600;
export const FPS = 30;

// Total length of one loop. The animation is authored so the very last
// frame (empty desktop, cursor gone) visually matches the very first frame,
// so looping back to frame 0 reads as seamless with no jump-cut.
export const TOTAL_DURATION = 8 * FPS; // 240 frames / 8s

export const MENU_BAR_HEIGHT = 32;

// Where our app's menu bar icon sits, measured from the right edge of the
// screen (menu extras are laid out right-to-left in real macOS, ending
// with Control Center + the clock furthest right).
//
// Real macOS menu bar icons are small square glyphs. app-logo.png is a
// wide wordmark lockup, not suited to that slot, so the menu bar uses the
// separate square app-icon.png instead (see MenuBar.tsx).
export const APP_ICON_SIZE = 20;
export const APP_ICON_RIGHT_OFFSET = 230; // distance from right edge to icon center
export const APP_ICON_CENTER_X = CANVAS_WIDTH - APP_ICON_RIGHT_OFFSET;
export const APP_ICON_CENTER_Y = MENU_BAR_HEIGHT / 2;

// --- Timeline (in frames, 30fps) -------------------------------------------
// 0-15    Establishing shot: static desktop, cursor not yet visible.
// 15-70   Cursor travels from the dock area up to the app's menu bar icon.
// 70-82   Click: cursor presses down, icon highlight pill fades in.
// 82-136  Popover reveals beneath the icon (genie-style scale + fade).
// 136-190 Hold: popover fully open, screenshot visible, cursor resting.
// 190-208 Popover closes (faster than it opened, per Apple convention).
// 208-224 Cursor eases back down and fades out.
// 224-240 Empty desktop again -> loops seamlessly into frame 0.
export const TIMING = {
  cursorStart: 15,
  cursorArrive: 70,
  clickEnd: 82,
  popoverOpenStart: 82,
  popoverOpenEnd: 136,
  holdEnd: 190,
  popoverCloseEnd: 208,
  cursorExitEnd: 224,
} as const;

// Cursor travel path: starts near the dock (bottom-left of center), arrives
// at the icon. A mid waypoint gives the motion a gentle arc instead of a
// robotic straight diagonal line.
export const CURSOR_PATH = {
  start: { x: CANVAS_WIDTH * 0.42, y: CANVAS_HEIGHT * 0.78 },
  mid: { x: CANVAS_WIDTH * 0.68, y: CANVAS_HEIGHT * 0.32 },
  end: { x: APP_ICON_CENTER_X + 2, y: APP_ICON_CENTER_Y + 6 },
};

export const COLORS = {
  // Matches --color-turquoise in the web app's globals.css.
  wallpaper: "#7AD8C8",
  menuBarBg: "rgba(246, 246, 248, 0.78)",
  menuBarBorder: "rgba(0, 0, 0, 0.08)",
  menuBarText: "#1d1d1f",
  iconHighlight: "rgba(0, 0, 0, 0.08)",
  popoverBg: "rgba(255, 255, 255, 0.92)",
  popoverBorder: "rgba(0, 0, 0, 0.06)",
  dockBg: "rgba(255, 255, 255, 0.35)",
};
