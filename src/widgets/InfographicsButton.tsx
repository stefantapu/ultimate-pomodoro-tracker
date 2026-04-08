import { memo } from "react";
import { useUIStore } from "@shared/stores/uiStore";
import { ThemedButton } from "./ThemedButton";

export const InfographicsButton = memo(function InfographicsButton() {
  const setInfographicsModalOpen = useUIStore(
    (state) => state.setInfographicsModalOpen,
  );

  return (
    <ThemedButton
      variant="toolbar"
      className="toolbar-icon-button toolbar-icon-button--history"
      onClick={() => setInfographicsModalOpen(true)}
      aria-label="Open history dashboard"
      title="Open history dashboard"
    >
      <span className="toolbar-history-button__text">History</span>
    </ThemedButton>
  );
});
