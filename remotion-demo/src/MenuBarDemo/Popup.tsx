import { Easing, Img, interpolate, useCurrentFrame } from "remotion";
import {
  APP_ICON_CENTER_X,
  COLORS,
  MENU_BAR_HEIGHT,
  TIMING,
} from "./constants";

// Sized to match study-popup.png's own aspect ratio (652x726, portrait)
// so the screenshot displays in full instead of being cropped to fit a
// landscape box. Scaled to 2/3 to match the smaller desktop canvas.
const POPUP_WIDTH = 228;
const POPUP_HEIGHT = 252;
const NOTCH_SIZE = 10;

type Props = {
  screenshotSrc: string;
};

// The macOS-style popover that drops down from the menu bar icon, in the
// style of Control Center / menu bar extras: a small notch pointing up at
// the icon, a frosted rounded panel, and the app's screenshot inside.
export const Popup: React.FC<Props> = ({ screenshotSrc }) => {
  const frame = useCurrentFrame();

  // Opens with a springy "genie" pop anchored at the icon, closes faster
  // and more linearly -- mirroring how macOS popovers behave.
  const openProgress = interpolate(
    frame,
    [TIMING.popoverOpenStart, TIMING.popoverOpenEnd],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.spring({ damping: 14 }),
    },
  );
  const closeProgress = interpolate(
    frame,
    [TIMING.holdEnd, TIMING.popoverCloseEnd],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 1, 1),
    },
  );
  const progress = Math.min(openProgress, closeProgress);

  const scale = interpolate(progress, [0, 1], [0.82, 1], {
    output: "perceptual-scale",
  });
  const translateY = interpolate(progress, [0, 1], [-10, 0]);
  const opacity = progress;

  // Screenshot fades/scales in a touch after the panel itself for a
  // layered reveal instead of everything popping in at once.
  const screenshotProgress = interpolate(
    frame,
    [TIMING.popoverOpenStart + 10, TIMING.popoverOpenEnd + 6],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );
  const screenshotOpacity = Math.min(screenshotProgress, closeProgress);
  const screenshotScale = interpolate(screenshotProgress, [0, 1], [0.96, 1], {
    output: "perceptual-scale",
  });

  if (opacity <= 0) {
    return null;
  }

  const left = APP_ICON_CENTER_X - POPUP_WIDTH / 2;
  const top = MENU_BAR_HEIGHT + 10;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: POPUP_WIDTH,
        scale,
        translate: `0 ${translateY}px`,
        opacity,
        transformOrigin: "top center",
      }}
    >
      <Notch />
      <div
        style={{
          marginTop: NOTCH_SIZE / 2,
          width: "100%",
          height: POPUP_HEIGHT,
          borderRadius: 16,
          background: COLORS.popoverBg,
          border: `1px solid ${COLORS.popoverBorder}`,
          boxShadow: "0 24px 48px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.15)",
          backdropFilter: "blur(24px)",
          padding: 14,
          display: "flex",
        }}
      >
        <Img
          src={screenshotSrc}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: 10,
            opacity: screenshotOpacity,
            scale: screenshotScale,
          }}
        />
      </div>
    </div>
  );
};

// Small diamond that overlaps the panel's top edge, pointing up at the
// menu bar icon -- the same visual language as macOS's own popovers.
const Notch: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: 0,
      width: NOTCH_SIZE,
      height: NOTCH_SIZE,
      translate: "-50% -50%",
      rotate: "45deg",
      background: COLORS.popoverBg,
      border: `1px solid ${COLORS.popoverBorder}`,
      borderBottomWidth: 0,
      borderRightWidth: 0,
    }}
  />
);
