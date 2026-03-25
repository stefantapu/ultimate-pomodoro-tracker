import { useAlarm } from "@shared/hooks/useAlarm";
import { useTimer } from "@shared/hooks/useTimer";

function App() {
  const { displayMinutes, displaySeconds, status, start, pause, reset } =
    useTimer({
      duration: 62,
    });
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
        {status === "finished" && useAlarm()}
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
