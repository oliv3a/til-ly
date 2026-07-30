import { Easing, interpolate, useCurrentFrame } from "remotion";
import { CURSOR_PATH, TIMING } from "./constants";

// A macOS-style arrow cursor that eases from the dock area up to the menu
// bar icon, pauses for the click + hold, then fades out before the loop
// resets. Position is driven by three keyframes (start -> mid -> end) so
// the path reads as a natural arc instead of a straight diagonal line.
export const Cursor: React.FC = () => {
  const frame = useCurrentFrame();

  const arrivalKeyframes = [
    TIMING.cursorStart,
    (TIMING.cursorStart + TIMING.cursorArrive) / 2,
    TIMING.cursorArrive,
  ];

  const x = interpolate(
    frame,
    arrivalKeyframes,
    [CURSOR_PATH.start.x, CURSOR_PATH.mid.x, CURSOR_PATH.end.x],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );

  const y = interpolate(
    frame,
    arrivalKeyframes,
    [CURSOR_PATH.start.y, CURSOR_PATH.mid.y, CURSOR_PATH.end.y],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );

  // Slight lean into the direction of travel, settling flat on arrival.
  const tilt = interpolate(frame, arrivalKeyframes, [-6, 4, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const opacity = interpolate(
    frame,
    [
      TIMING.cursorStart,
      TIMING.cursorStart + 6,
      TIMING.popoverCloseEnd,
      TIMING.cursorExitEnd,
    ],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.linear,
    },
  );

  // A soft downward drift as the cursor fades, implying it moves away.
  const exitDrift = interpolate(
    frame,
    [TIMING.popoverCloseEnd, TIMING.cursorExitEnd],
    [0, 26],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + exitDrift,
        translate: "-3px -2px",
        rotate: `${tilt}deg`,
        opacity,
        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))",
      }}
    >
      <CursorGlyph />
    </div>
  );
};

// Standard macOS arrow cursor silhouette.
const CursorGlyph: React.FC = () => (
  <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
    <path
      d="M1.5 1L1.5 21.5L6.8 17.2L9.7 24.3L13 22.9L10.1 15.8L17 15.4L1.5 1Z"
      fill="white"
      stroke="black"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);
