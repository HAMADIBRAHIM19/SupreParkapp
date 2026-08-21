import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { Backdrop } from "./components/Backdrop";
import { HookScene } from "./scenes/HookScene";
import { StepScene } from "./scenes/StepScene";
import { CtaScene } from "./scenes/CtaScene";

const anton = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });
const manrope = loadManrope("normal", { weights: ["600", "800"], subsets: ["latin"] });

export type Step = { shot: string; title: string; sub: string; panY?: number };

export type ReelProps = {
  kicker: string;
  hookLines: string[];
  steps: Step[];
  ctaHeadline: string[];
  ctaSub: string;
  ctaTag: string;
};

const HOOK = 78;
const STEP = 68;
const CTA = 90;

const Fader: React.FC<{ duration: number; children: React.ReactNode }> = ({ duration, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, duration - 10, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const reelDuration = (steps: number) => HOOK + STEP * steps + CTA;

export const Reel: React.FC<ReelProps> = ({ kicker, hookLines, steps, ctaHeadline, ctaSub, ctaTag }) => {
  const display = anton.fontFamily;
  const body = manrope.fontFamily;

  return (
    <AbsoluteFill>
      <Backdrop />

      <Sequence durationInFrames={HOOK}>
        <Fader duration={HOOK}>
          <HookScene kicker={kicker} lines={hookLines} display={display} body={body} />
        </Fader>
      </Sequence>

      {steps.map((step, i) => (
        <Sequence key={step.shot + i} from={HOOK + i * STEP} durationInFrames={STEP}>
          <Fader duration={STEP}>
            <StepScene
              index={i + 1}
              shot={step.shot}
              title={step.title}
              sub={step.sub}
              panY={step.panY}
              duration={STEP}
              display={display}
              body={body}
              align={i % 2 === 0 ? "left" : "right"}
            />
          </Fader>
        </Sequence>
      ))}

      <Sequence from={HOOK + steps.length * STEP} durationInFrames={CTA}>
        <Fader duration={CTA}>
          <CtaScene headline={ctaHeadline} sub={ctaSub} tag={ctaTag} display={display} body={body} />
        </Fader>
      </Sequence>
    </AbsoluteFill>
  );
};
