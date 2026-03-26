import { useEffect } from "react";

type TimerFinish = {
  status: "idle" | "running" | "paused" | "finished";
  play: () => void;
  reset: () => void;
};

export const useHandleTimerFinish = ({ status, play, reset }: TimerFinish) => {
  useEffect(() => {
    if (status === "finished") {
      play();
      reset();
    }
  }, [status, play, reset]);
};
