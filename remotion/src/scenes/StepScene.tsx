import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { theme } from "../theme";

type Props = {
  index: number;
  shot: string;
  title: string;
  sub: string;
  duration: number;
  display: string;
  body: string;
  align?: "left" | "right";
  panY?: number;
};

export const StepScene: React.FC<Props> = ({
  index,
  shot,
  title,
  sub,
  duration,
  display,
  body,
  align = "left",
  panY,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 200 } });
  const phoneIn = spring({ frame: frame - 4, fps, config: { damping: 18, stiffness: 90, mass: 1.2 } });
  const float = Math.sin(frame / 26) * 14;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 90,
          opacity: phoneIn,
          transform: `translateY(${interpolate(phoneIn, [0, 1], [180, 0]) + float}px) scale(${interpolate(
            phoneIn,
            [0, 1],
            [0.92, 1],
          )}) rotate(${interpolate(phoneIn, [0, 1], [align === "left" ? 5 : -5, align === "left" ? -2.2 : 2.2])}deg)`,
        }}
      >
        <PhoneFrame shot={shot} duration={duration} panY={panY} />
      </AbsoluteFill>

      <AbsoluteFill style={{ padding: 100, paddingTop: 150, alignItems: align === "left" ? "flex-start" : "flex-end" }}>
        <div
          style={{
            textAlign: align === "left" ? "left" : "right",
            opacity: enter,
            transform: `translateY(${interpolate(enter, [0, 1], [-60, 0])}px)`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 18,
              background: theme.amber,
              color: theme.tealInk,
              fontFamily: body,
              fontWeight: 800,
              fontSize: 34,
              padding: "12px 30px",
              borderRadius: 999,
              marginBottom: 26,
            }}
          >
            STEP {index}
          </div>
          <div
            style={{
              fontFamily: display,
              fontSize: 96,
              lineHeight: 0.98,
              color: "#fff",
              textTransform: "uppercase",
              maxWidth: 800,
              textShadow: `0 18px 50px ${theme.tealInk}`,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: body,
              fontWeight: 600,
              fontSize: 40,
              color: "#ffffffcc",
              marginTop: 22,
              maxWidth: 760,
            }}
          >
            {sub}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
