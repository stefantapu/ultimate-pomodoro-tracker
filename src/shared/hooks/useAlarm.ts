import { useRef } from "react";

export const useAlarm = () => {
  const audioRef = useRef(new Audio("/sounds/alarm.wav"));
  const audio = audioRef.current;
  audio.currentTime = 0;
  audio.play();
};
