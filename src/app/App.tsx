import { useTimer } from "@shared/hooks/useTimer";

function App() {
  const { timeLeft, start, pause, reset, isRunning } = useTimer({
    duration: 20,
  });
  return (
    <>
      <div style={{ backgroundColor: isRunning ? "green" : "" }}>
        <h1>{timeLeft}</h1>
        <button onClick={start}>start</button>
        <button onClick={pause}>pause</button>
        <button onClick={reset}>reset</button>
      </div>
    </>
  );
}

export default App;
