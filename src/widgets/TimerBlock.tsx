import { useAlarm } from "@shared/hooks/useAlarm";
import { useTimer } from "@shared/hooks/useTimer";
import { useEffect, useState, type ChangeEvent } from "react";

export function TimerBlock() {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [breakTime, setBreakTime] = useState<number>();

  const { displayMinutes, displaySeconds, status, start, pause, reset } =
    useTimer({
      mode: mode,
      duration: 2,
    });

  const { play } = useAlarm();

  const handleSelectBreakTime = (event: ChangeEvent<HTMLSelectElement>) => {
    setBreakTime(Number(event.target.value));
  };

  useEffect(() => {
    //handle finish
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
        <div>
          <button
            style={{ backgroundColor: mode === "focus" ? "green" : "" }}
            onClick={() => setMode("focus")}
          >
            Focus
          </button>
          <button
            style={{ backgroundColor: mode === "break" ? "green" : "" }}
            onClick={() => setMode("break")}
          >
            Break
          </button>
        </div>

        <div>
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

        <div>
          <label htmlFor="TimerRangesFocus">Focus</label>

          <select name="TimerRangesFocus" id="TimerRangesFocus">
            <option value="2">2 seconds</option>
            <option value="60">1 minute</option>
            <option value="600">10 mintes</option>
            <option value="1500">25 minutes</option>
          </select>
        </div>
        <div>
          <label htmlFor="TimerRangesBreak">Break</label>

          <select
            name="TimerRangesBreak"
            id="TimerRangesBreak"
            value={breakTime}
            onChange={handleSelectBreakTime}
          >
            <option value="2">2 seconds</option>
            <option value="60">1 minute</option>
            <option value="300">5 mintes</option>
            <option value="600">10 minutes</option>
          </select>
        </div>
      </div>
    </>
  );
}
