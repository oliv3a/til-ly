import { AbsoluteFill } from "remotion";
import { COLORS } from "./constants";

// A flat wallpaper in the web app's own turquoise theme color.
export const MacDesktop: React.FC = () => {
  return <AbsoluteFill style={{ background: COLORS.wallpaper }} />;
};
