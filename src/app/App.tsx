import { Suspense, lazy, useEffect, useMemo } from "react";
import { DashboardLayout } from "../widgets/DashboardLayout";
import { LockedOverlay } from "../widgets/LockedOverlay";
import {
  markToastHostReady,
  useUIStore,
} from "../shared/stores/uiStore";
import { mapSkinToCssVariables } from "../shared/skins/cssVars";
import { useSkinStore } from "../shared/stores/skinStore";
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

function AuthModalFallback({
  skinCssVariables,
  skinId,
}: {
  skinCssVariables: ReturnType<typeof mapSkinToCssVariables>;
  skinId: string;
}) {
  return (
    <div
      className={`auth-block app-auth-fallback auth-block--${skinId}`}
      style={skinCssVariables}
    >
      <div className="auth-block__panel">
        <p className="auth-block__description app-auth-fallback__description">
          Loading sign in...
        </p>
      </div>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();
  const activeSkin = useSkinStore((state) => state.activeSkin);
  const isAuthModalOpen = useUIStore((state) => state.isAuthModalOpen);
  const isInfographicsModalOpen = useUIStore(
    (state) => state.isInfographicsModalOpen,
  );
  const isThemePickerModalOpen = useUIStore(
    (state) => state.isThemePickerModalOpen,
  );
  const isToastHostEnabled = useUIStore((state) => state.isToastHostEnabled);
  const skinCssVariables = useMemo(
    () => mapSkinToCssVariables(activeSkin),
    [activeSkin],
  );

  if (loading) {
    return (
      <div
        className={`app-loading-state app-loading-state--${activeSkin.id}`}
        style={skinCssVariables}
      >
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
        <Suspense
          fallback={
            <AuthModalFallback
              skinCssVariables={skinCssVariables}
              skinId={activeSkin.id}
            />
          }
        >
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
