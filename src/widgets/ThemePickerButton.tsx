import { memo } from "react";
import { useToolbarClickSound } from "@shared/hooks/useToolbarClickSound";
import { useUIStore } from "@shared/stores/uiStore";
import { ThemedButton } from "./ThemedButton";

export const ThemePickerButton = memo(function ThemePickerButton() {
  const setThemePickerModalOpen = useUIStore(
    (state) => state.setThemePickerModalOpen,
  );
  const playToolbarClick = useToolbarClickSound();

  const handleClick = () => {
    playToolbarClick();
    setThemePickerModalOpen(true);
  };

  return (
    <ThemedButton
      variant="toolbar"
      className="toolbar-icon-button toolbar-icon-button--theme"
      onClick={handleClick}
      aria-label="Open theme picker"
      title="Open theme picker"
    >
      <>
        <span className="toolbar-icon-button__label">Open theme picker</span>
        <span className="toolbar-icon-button__icon" aria-hidden="true" />
      </>
    </ThemedButton>
  );
});
