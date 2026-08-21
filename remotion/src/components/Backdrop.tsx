import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 40;
  const drift2 = Math.cos(frame / 70) * 55;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(165deg, ${theme.tealInk} 0%, #0a3a2f 55%, ${theme.tealDeep} 100%)` }}>
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1300,
          left: -320 + drift,
          top: -260,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.teal}55, transparent 65%)`,
          filter: "blur(20px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          right: -300,
          bottom: -200 + drift2,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.amber}33, transparent 62%)`,
          filter: "blur(24px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "90px 90px",
          transform: `translateY(${(frame * 0.35) % 90}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
