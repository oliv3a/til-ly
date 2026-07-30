import "./index.css";
import { Composition } from "remotion";
import { MenuBarDemo } from "./MenuBarDemo/MenuBarDemo";
import { CANVAS_HEIGHT, CANVAS_WIDTH, FPS, TOTAL_DURATION } from "./MenuBarDemo/constants";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MenuBarDemo"
        component={MenuBarDemo}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      />
    </>
  );
};
