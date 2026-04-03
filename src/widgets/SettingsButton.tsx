import { useUIStore } from "@shared/stores/uiStore";
import { useSkinStore } from "@shared/stores/skinStore";
import { ThemedButton } from "./ThemedButton";

export function SettingsButton() {
  const setSettingsModalOpen = useUIStore((state) => state.setSettingsModalOpen);
  const activeSkinId = useSkinStore((state) => state.activeSkinId);
  const isWarmSkin = activeSkinId === "warm";

  return (
    <ThemedButton
      variant="toolbar"
      className={
        isWarmSkin ? "toolbar-icon-button toolbar-icon-button--settings" : undefined
      }
      onClick={() => setSettingsModalOpen(true)}
      aria-label="Open settings"
      title="Open settings"
    >
      {isWarmSkin ? (
        <span className="toolbar-icon-button__label">Open settings</span>
      ) : (
        "Settings"
      )}
    </ThemedButton>
  );
}
