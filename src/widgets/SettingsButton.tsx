import { memo } from "react";
import { useUIStore } from "@shared/stores/uiStore";
import { ThemedButton } from "./ThemedButton";

export const SettingsButton = memo(function SettingsButton() {
  const setSettingsModalOpen = useUIStore((state) => state.setSettingsModalOpen);

  return (
    <ThemedButton
      variant="toolbar"
      className="toolbar-icon-button toolbar-icon-button--settings"
      onClick={() => setSettingsModalOpen(true)}
      aria-label="Open settings"
      title="Open settings"
    >
      <>
        <span className="toolbar-icon-button__label">Open settings</span>
        <span className="toolbar-icon-button__icon" aria-hidden="true" />
      </>
    </ThemedButton>
  );
});
