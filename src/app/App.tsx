import { Suspense, lazy, useEffect } from "react";
import { DashboardLayout } from "../widgets/DashboardLayout";
import { LockedOverlay } from "../widgets/LockedOverlay";
import {
  markToastHostReady,
  useUIStore,
} from "../shared/stores/uiStore";
import { useAuth } from "./providers/useAuth";

const LazyAuthBlock = lazy(() =>
  import("../widgets/AuthBlock").then((module) => ({
    default: module.AuthBlock,
  })),
);

const LazyToastHost = lazy(() =>
  import("sonner").then(({ Toaster }) => ({
    default: function ToastHost() {
      useEffect(() => {
        markToastHostReady();
      }, []);

      return (
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            classNames: {
              toast: "forge-toast",
              title: "forge-toast__title",
            },
          }}
        />
      );
    },
  })),
);

const LazyInfographicsModal = lazy(() =>
  import("../widgets/InfographicsModal").then((module) => ({
    default: module.InfographicsModal,
  })),
);

const LazyThemePickerModal = lazy(() =>
  import("../widgets/ThemePickerModal").then((module) => ({
    default: module.ThemePickerModal,
  })),
);

function AuthModalFallback() {
  return (
    <div className="auth-block">
      <div className="auth-block__panel">
        <p className="auth-block__description">Loading sign in...</p>
      </div>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();
  const isAuthModalOpen = useUIStore((state) => state.isAuthModalOpen);
  const isInfographicsModalOpen = useUIStore(
    (state) => state.isInfographicsModalOpen,
  );
  const isThemePickerModalOpen = useUIStore(
    (state) => state.isThemePickerModalOpen,
  );
  const isToastHostEnabled = useUIStore((state) => state.isToastHostEnabled);

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center", color: "white" }}>
        Loading Realm...
      </div>
    );
  }

  return (
    <>
      {isToastHostEnabled ? (
        <Suspense fallback={null}>
          <LazyToastHost />
        </Suspense>
      ) : null}

      {isAuthModalOpen ? (
        <Suspense fallback={<AuthModalFallback />}>
          <LazyAuthBlock />
        </Suspense>
      ) : null}

      {isInfographicsModalOpen ? (
        <Suspense fallback={null}>
          <LazyInfographicsModal />
        </Suspense>
      ) : null}

      {isThemePickerModalOpen ? (
        <Suspense fallback={null}>
          <LazyThemePickerModal />
        </Suspense>
      ) : null}

      <DashboardLayout user={user} LockedOverlayComponent={LockedOverlay} />
    </>
  );
}

export default App;
