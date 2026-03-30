import { TimerBlock } from "@widgets/TimerBlock";
import { AuthBlock } from "../widgets/AuthBlock";
import { useAuth } from "./providers/AuthProvider";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center", color: "white" }}>
        Loading Realm...
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          height: "100vh",
          alignContent: "center",
        }}
      >
        {user ? <TimerBlock /> : <AuthBlock />}
      </div>
    </>
  );
}

export default App;
