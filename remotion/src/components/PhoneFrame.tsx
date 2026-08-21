import React from "react";
import { Img, staticFile, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

type Props = {
  shot: string;
  /** frames since scene start */
  duration: number;
  zoomFrom?: number;
  zoomTo?: number;
  panY?: number;
};

export const PhoneFrame: React.FC<Props> = ({
  shot,
  duration,
  zoomFrom = 1.04,
  zoomTo = 1.14,
  panY = -60,
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, duration], [zoomFrom, zoomTo], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, duration], [0, panY], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: 720,
        height: 1150,
        borderRadius: 68,
        padding: 14,
        background: "linear-gradient(150deg, #1b2b28, #0a1513)",
        boxShadow: `0 60px 120px -30px ${theme.tealInk}88, 0 0 0 2px #ffffff22`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 56,
          overflow: "hidden",
          background: theme.cream,
          position: "relative",
        }}
      >
        <Img
          src={staticFile(`shots/${shot}`)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${y}px) scale(${scale})`,
            transformOrigin: "center top",
          }}
        />
      </div>
    </div>
  );
};
