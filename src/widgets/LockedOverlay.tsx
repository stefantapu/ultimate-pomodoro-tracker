import { useToolbarClickSound } from "../shared/hooks/useToolbarClickSound";
import { useUIStore } from "../shared/stores/uiStore";

export function LockedOverlay() {
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);
  const playToolbarClick = useToolbarClickSound();
  const openAuthModal = () => {
    playToolbarClick();
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
