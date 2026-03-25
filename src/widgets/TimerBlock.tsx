import { useAlarm } from "@shared/hooks/useAlarm";
import { useTimer } from "@shared/hooks/useTimer";
import { useEffect } from "react";

export function TimerBlock() {
  const { displayMinutes, displaySeconds, status, start, pause, reset } =
    useTimer({
      duration: 2,
    });
  const { play } = useAlarm();
  useEffect(() => {
    if (status === "finished") {
      play();
      reset();
    }
  }, [status, play, reset]);
  return (
    <>
      <div
        style={{
          backgroundColor: status === "running" ? "green" : "black",
        }}
      >
        <h1>
          {displayMinutes} : {displaySeconds}
        </h1>
        {status === "running" ? (
          <button onClick={pause}>pause</button>
        ) : (
          <button onClick={start}>start</button>
        )}
        <button onClick={reset}>reset</button>
      </div>
    </>
  );
}
