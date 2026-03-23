import { useTimer } from "@shared/hooks/useTimer";

function App() {
  const { displayMinutes, displaySeconds, start, pause, reset, isRunning } =
    useTimer({
      duration: 62,
    });
  return (
    <>
      <div style={{ backgroundColor: isRunning ? "green" : "black" }}>
        <h1>
          {displayMinutes} : {displaySeconds}
        </h1>

        {isRunning ? (
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
