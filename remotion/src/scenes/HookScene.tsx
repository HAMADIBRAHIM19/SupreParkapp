import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from "remotion";
import { theme } from "../theme";

type Props = {
  kicker: string;
  lines: string[];
  display: string;
  body: string;
};

export const HookScene: React.FC<Props> = ({ kicker, lines, display, body }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logo = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const kick = interpolate(frame, [6, 22], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ padding: 110, justifyContent: "center", alignItems: "flex-start" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 26,
          opacity: logo,
          transform: `translateY(${interpolate(logo, [0, 1], [50, 0])}px)`,
          marginBottom: 70,
        }}
      >
        <Img
          src={staticFile("icon.png")}
          style={{ width: 130, height: 130, borderRadius: 32, boxShadow: `0 24px 60px -18px ${theme.teal}` }}
        />
        <span style={{ fontFamily: body, fontSize: 54, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>
          SuperParking
        </span>
      </div>

      <div
        style={{
          opacity: kick,
          transform: `translateY(${interpolate(kick, [0, 1], [30, 0])}px)`,
          fontFamily: body,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: theme.amber,
          marginBottom: 34,
        }}
      >
        {kicker}
      </div>

      {lines.map((line, i) => {
        const s = spring({ frame: frame - 18 - i * 8, fps, config: { damping: 200 } });
        return (
          <div
            key={line}
            style={{
              fontFamily: display,
              fontSize: 128,
              lineHeight: 1.02,
              color: "#fff",
              textTransform: "uppercase",
              opacity: s,
              transform: `translateX(${interpolate(s, [0, 1], [-120, 0])}px)`,
              filter: `blur(${interpolate(s, [0, 1], [14, 0])}px)`,
            }}
          >
            {line}
          </div>
        );
      })}

      <div
        style={{
          marginTop: 60,
          width: interpolate(frame, [40, 70], [0, 420], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
          height: 12,
          borderRadius: 8,
          background: theme.teal,
        }}
      />
    </AbsoluteFill>
  );
};
