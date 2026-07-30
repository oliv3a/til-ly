import { AbsoluteFill, staticFile } from "remotion";
import { MacDesktop } from "./MacDesktop";
import { MenuBar } from "./MenuBar";
import { Cursor } from "./Cursor";
import { Popup } from "./Popup";

// Top-level scene: desktop -> menu bar -> cursor click -> popover reveal
// -> hold -> close -> loop. Every child reads useCurrentFrame() directly
// against the shared frame numbers in constants.ts (no nested <Sequence>
// offsets), so the whole choreography lives in one flat, easy-to-scrub
// timeline. See constants.ts for the frame-by-frame breakdown.
export const MenuBarDemo: React.FC = () => {
  return (
    <AbsoluteFill>
      <MacDesktop />
      <MenuBar />
      <Popup screenshotSrc={staticFile("assets/study-popup.png")} />
      <Cursor />
    </AbsoluteFill>
  );
};
