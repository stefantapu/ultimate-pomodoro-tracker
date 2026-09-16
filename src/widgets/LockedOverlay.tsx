import { useToolbarClickSound } from "../shared/hooks/useToolbarClickSound";
import { trackProductEvent } from "../shared/lib/productAnalytics";
import { useUIStore } from "../shared/stores/uiStore";

export function LockedOverlay() {
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);
  const playToolbarClick = useToolbarClickSound();
  const openAuthModal = () => {
    playToolbarClick();
    trackProductEvent({ name: "signup_start", source: "locked_feature" });
    setAuthModalOpen(true);
  };

  return (
    <div
      className="locked-overlay"
      role="button"
      tabIndex={0}
      aria-label="Sign in"
      onClick={openAuthModal}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openAuthModal();
        }
      }}
    />
  );
}
