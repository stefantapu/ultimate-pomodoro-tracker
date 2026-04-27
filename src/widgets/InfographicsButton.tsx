import { memo } from "react";
import { useUIStore } from "@shared/stores/uiStore";
import { useToolbarClickSound } from "@shared/hooks/useToolbarClickSound";
import { ThemedButton } from "./ThemedButton";
import toolbarStyles from "./ToolbarIconButton.module.css";

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export const InfographicsButton = memo(function InfographicsButton() {
  const setInfographicsModalOpen = useUIStore(
    (state) => state.setInfographicsModalOpen,
  );
  const playToolbarClick = useToolbarClickSound();
  const buttonClassName = joinClassNames(
    toolbarStyles["toolbar-icon-button"],
    "toolbar-icon-button",
    "toolbar-icon-button--history",
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
    setInfographicsModalOpen(true);
  };

  return (
    <ThemedButton
      variant="toolbar"
      className={buttonClassName}
      onClick={handleClick}
      aria-label="Open history dashboard"
      title="Open history dashboard"
    >
      <>
        <span className={labelClassName}>Open history dashboard</span>
        <span className={iconClassName} aria-hidden="true" />
      </>
    </ThemedButton>
  );
});
