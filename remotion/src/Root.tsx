import React from "react";
import { Composition } from "remotion";
import { Reel, ReelProps, reelDuration } from "./Reel";

const seeker: ReelProps = {
  kicker: "Parking in the UK",
  hookLines: ["Still", "Circling", "The block?"],
  steps: [
    {
      shot: "seeker-home.png",
      title: "Open the app",
      sub: "Don't search for a spot — let someone reserve it for you.",
      panY: -40,
    },
    {
      shot: "seeker-booking.png",
      title: "Drop a pin",
      sub: "Pick your destination on the map, anywhere in the UK.",
      panY: -260,
    },
    {
      shot: "seeker-dashboard.png",
      title: "Roll straight in",
      sub: "A nearby Crew member holds the space until you arrive.",
      panY: -120,
    },
  ],
  ctaHeadline: ["Parking,", "Sorted."],
  ctaSub: "SuperParking — reserve your spot before you arrive.",
  ctaTag: "Download SuperParking",
};

const crew: ReelProps = {
  kicker: "Side income idea",
  hookLines: ["Turn", "Spare time", "Into cash"],
  steps: [
    {
      shot: "signup.png",
      title: "Join the crew",
      sub: "Sign up free and go on shift whenever it suits you.",
      panY: -120,
    },
    {
      shot: "crew-dashboard.png",
      title: "Pick a request",
      sub: "See nearby drivers who need a parking space held.",
      panY: -260,
    },
    {
      shot: "crew-dashboard.png",
      title: "Hold. Get paid.",
      sub: "Keep the space, chat in-app, earn on every completed job.",
      panY: -300,
    },
  ],

  ctaHeadline: ["Your city.", "Your hours."],
  ctaSub: "SuperParking Crew — earn from the spaces around you.",
  ctaTag: "Become a Crew member",
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="seeker"
      component={Reel}
      durationInFrames={reelDuration(seeker.steps.length)}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={seeker}
    />
    <Composition
      id="crew"
      component={Reel}
      durationInFrames={reelDuration(crew.steps.length)}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={crew}
    />
  </>
);
