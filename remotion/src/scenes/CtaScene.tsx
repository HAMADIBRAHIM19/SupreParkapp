import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

type Props = {
  headline: string[];
  sub: string;
  tag: string;
  display: string;
  body: string;
};

export const CtaScene: React.FC<Props> = ({ headline, sub, tag, display, body }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 110 }}>
      <Img
        src={staticFile("icon.png")}
        style={{
          width: 260,
          height: 260,
          borderRadius: 62,
          opacity: logo,
          transform: `scale(${interpolate(logo, [0, 1], [0.6, 1])})`,
          boxShadow: `0 40px 100px -20px ${theme.teal}`,
        }}
      />

      {headline.map((line, i) => {
        const s = spring({ frame: frame - 12 - i * 7, fps, config: { damping: 200 } });
        return (
          <div
            key={line}
            style={{
              fontFamily: display,
              fontSize: 116,
              lineHeight: 1,
              color: "#fff",
              textTransform: "uppercase",
              textAlign: "center",
              marginTop: i === 0 ? 56 : 6,
              opacity: s,
              transform: `translateY(${interpolate(s, [0, 1], [70, 0])}px)`,
            }}
          >
            {line}
          </div>
        );
      })}

      <div
        style={{
          fontFamily: body,
          fontWeight: 600,
          fontSize: 42,
          color: "#ffffffcc",
          textAlign: "center",
          marginTop: 32,
          opacity: interpolate(frame, [30, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        {sub}
      </div>

      <div
        style={{
          marginTop: 54,
          background: theme.teal,
          color: "#fff",
          fontFamily: body,
          fontWeight: 800,
          fontSize: 44,
          padding: "26px 62px",
          borderRadius: 999,
          transform: `scale(${spring({ frame: frame - 40, fps, config: { damping: 10 } })})`,
          boxShadow: `0 30px 70px -20px ${theme.teal}`,
        }}
      >
        {tag}
      </div>
    </AbsoluteFill>
  );
};
