import { useUIStore } from "@shared/stores/uiStore";
import { ThemedButton } from "./ThemedButton";

export function SettingsButton() {
  const setSettingsModalOpen = useUIStore((state) => state.setSettingsModalOpen);

  return (
    <ThemedButton
      variant="toolbar"
      onClick={() => setSettingsModalOpen(true)}
      aria-label="Open settings"
      title="Open settings"
    >
      Settings
    </ThemedButton>
  );
}
