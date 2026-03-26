import { useEffect } from "react";

type TimerFinishParams = {
  status: "idle" | "running" | "paused" | "finished";
  play: () => void;
  reset: () => void;
};

export const useHandleTimerFinish = ({
  status,
  play,
  reset,
}: TimerFinishParams) => {
  useEffect(() => {
    if (status === "finished") {
      play();
      reset();
    }
  }, [status, play, reset]);
};
