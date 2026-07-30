import { staticFile } from "remotion";
import { APP_ICON_SIZE, COLORS, MENU_BAR_HEIGHT } from "./constants";
import { MenuBarIcon } from "./MenuBarIcon";

// Generic macOS menu bar chrome: Apple logo + app name on the left,
// a handful of unbranded status icons on the right, our app's icon,
// then the clock furthest right -- matching real macOS menu extra order.
//
// The right-side items are absolutely positioned (rather than flexed) so
// their pixel location matches APP_ICON_CENTER_X/Y in constants.ts exactly
// -- that's the anchor the cursor animates to and the popover hangs from.
export const MenuBar: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: MENU_BAR_HEIGHT,
        background: COLORS.menuBarBg,
        borderBottom: `1px solid ${COLORS.menuBarBorder}`,
        backdropFilter: "blur(20px)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif",
        fontSize: 13,
        color: COLORS.menuBarText,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 16,
          top: "50%",
          translate: "0 -50%",
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <AppleGlyph />
        <span style={{ fontWeight: 600 }}>Finder</span>
        <span style={{ opacity: 0.85 }}>File</span>
        <span style={{ opacity: 0.85 }}>Edit</span>
        <span style={{ opacity: 0.85 }}>View</span>
      </div>

      <StatusGlyph right={300} />
      <StatusGlyph right={270} />
      <MenuBarIcon
        src={staticFile("assets/app-icon.png")}
        size={APP_ICON_SIZE}
      />
      <StatusGlyph right={130} />

      <span
        style={{
          position: "absolute",
          right: 16,
          top: "50%",
          translate: "0 -50%",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        Tue 9:41 PM
      </span>
    </div>
  );
};

// Drawn as an SVG rather than the U+F8FF Apple-logo character, since that
// glyph only exists in Apple's own fonts and renders blank in headless
// Chrome (which Remotion uses for rendering).
const AppleGlyph: React.FC = () => (
  <svg width="13" height="15" viewBox="0 0 13 15" fill={COLORS.menuBarText}>
    <path d="M9.6 0c.1.9-.3 1.8-.8 2.4-.6.7-1.5 1.2-2.4 1.1-.1-.9.3-1.8.9-2.4C7.9.4 8.8-.1 9.6 0z" />
    <path d="M12.8 10.9c-.3.8-.5 1.1-.9 1.8-.6 1-1.5 2.3-2.6 2.3-1 0-1.2-.6-2.5-.6s-1.6.6-2.5.6c-1.1 0-1.9-1.2-2.5-2.1C.4 11.3-.3 8.4.6 6.4c.6-1.3 1.7-2.1 2.9-2.1 1.1 0 1.8.7 2.7.7.9 0 1.5-.7 2.7-.7.7 0 2.3.2 3.3 1.6-2.6 1.5-2.2 5.1.6 5z" />
  </svg>
);

// Small unbranded pill glyphs so the right side of the bar reads as "a
// real menu bar" without needing real wifi/battery icon assets.
const StatusGlyph: React.FC<{ right: number }> = ({ right }) => (
  <div
    style={{
      position: "absolute",
      right,
      top: "50%",
      translate: "0 -50%",
      width: 16,
      height: 12,
      borderRadius: 3,
      border: `1.4px solid ${COLORS.menuBarText}`,
      opacity: 0.75,
    }}
  />
);
