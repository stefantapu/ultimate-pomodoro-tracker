import { useAlarm } from "@shared/hooks/useAlarm";
import { useTimer } from "@shared/hooks/useTimer";
import { useEffect } from "react";

function App() {
  const { displayMinutes, displaySeconds, status, start, pause, reset } =
    useTimer({
      duration: 2,
    });
  const { play, stop } = useAlarm();

  useEffect(() => {
    if (status === "finished") {
      play();
    } else if (status !== "running") {
      stop();
    }
  }, [status, play, stop]);
  return (
    <>
      <div
        style={{
          backgroundColor: status === "running" ? "green" : "black",
          height: "100vh",
          alignContent: "center",
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

export default App;
