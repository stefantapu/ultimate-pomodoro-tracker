import { memo } from "react";
import { useToolbarClickSound } from "@shared/hooks/useToolbarClickSound";
import { useUIStore } from "@shared/stores/uiStore";
import { ThemedButton } from "./ThemedButton";
import toolbarStyles from "./ToolbarIconButton.module.css";

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export const ThemePickerButton = memo(function ThemePickerButton() {
  const setThemePickerModalOpen = useUIStore(
    (state) => state.setThemePickerModalOpen,
  );
  const playToolbarClick = useToolbarClickSound();
  const buttonClassName = joinClassNames(
    toolbarStyles["toolbar-icon-button"],
    "toolbar-icon-button",
    "toolbar-icon-button--theme",
  );
  const labelClassName = joinClassNames(
    toolbarStyles["toolbar-icon-button__label"],
    "toolbar-icon-button__label",
  );
  const iconClassName = joinClassNames(
    toolbarStyles["toolbar-icon-button__icon"],
    "toolbar-icon-button__icon",
  );

  const handleClick = () => {
    playToolbarClick();
    setThemePickerModalOpen(true);
  };

  return (
    <ThemedButton
      variant="toolbar"
      className={buttonClassName}
      onClick={handleClick}
      aria-label="Open theme picker"
      title="Open theme picker"
    >
      <>
        <span className={labelClassName}>Open theme picker</span>
        <span className={iconClassName} aria-hidden="true" />
      </>
    </ThemedButton>
  );
});
