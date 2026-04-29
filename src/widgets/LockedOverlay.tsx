import { useUIStore } from "../shared/stores/uiStore";

export function LockedOverlay() {
  const setAuthModalOpen = useUIStore((state) => state.setAuthModalOpen);

  return (
    <div
      className="locked-overlay"
      role="button"
      tabIndex={0}
      aria-label="Sign in"
      onClick={() => setAuthModalOpen(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setAuthModalOpen(true);
        }
      }}
    />
  );
}
