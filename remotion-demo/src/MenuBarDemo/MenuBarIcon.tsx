import { Easing, Img, interpolate, useCurrentFrame } from "remotion";
import {
  APP_ICON_CENTER_X,
  APP_ICON_CENTER_Y,
  COLORS,
  TIMING,
} from "./constants";

type Props = {
  src: string;
  size: number;
};

// The app's own menu bar icon, including the rounded "pressed" highlight
// pill that macOS shows behind a menu extra while its popover is open.
export const MenuBarIcon: React.FC<Props> = ({ src, size }) => {
  const frame = useCurrentFrame();

  // Highlight pill: fades in right as the click lands, stays visible for
  // the whole hold, fades out as the popover closes.
  const highlightOpacity = interpolate(
    frame,
    [
      TIMING.cursorArrive,
      TIMING.clickEnd,
      TIMING.popoverCloseEnd - 8,
      TIMING.popoverCloseEnd,
    ],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );

  // A tiny press-down scale on the icon itself sells the "click" moment.
  const pressScale = interpolate(
    frame,
    [TIMING.cursorArrive, TIMING.clickEnd - 4, TIMING.clickEnd],
    [1, 0.88, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      output: "perceptual-scale",
    },
  );

  const pillWidth = size + 16;
  const pillHeight = size + 10;

  return (
    <div
      style={{
        position: "absolute",
        left: APP_ICON_CENTER_X,
        top: APP_ICON_CENTER_Y,
        translate: "-50% -50%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          translate: "-50% -50%",
          width: pillWidth,
          height: pillHeight,
          borderRadius: 6,
          background: COLORS.iconHighlight,
          opacity: highlightOpacity,
        }}
      />
      <Img
        src={src}
        style={{
          position: "relative",
          width: size,
          height: size,
          scale: pressScale,
          objectFit: "contain",
        }}
      />
    </div>
  );
};
