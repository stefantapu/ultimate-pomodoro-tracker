import { memo } from "react";
import { useToolbarClickSound } from "@shared/hooks/useToolbarClickSound";
import { SUPPORT_KOFI_URL } from "@shared/config/support";
import toolbarStyles from "./ToolbarIconButton.module.css";

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export const KoFiButton = memo(function KoFiButton() {
  const playToolbarClick = useToolbarClickSound();
  const buttonClassName = joinClassNames(
    "themed-button",
    "themed-button--toolbar",
    toolbarStyles["toolbar-icon-button"],
    "toolbar-icon-button",
    "toolbar-icon-button--kofi",
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
  };

  return (
    <a
      href={SUPPORT_KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClassName}
      onClick={handleClick}
      aria-label="Support on Ko-fi"
      title="Support on Ko-fi"
    >
      <span className={labelClassName}>Support on Ko-fi</span>
      <span className={iconClassName} aria-hidden="true" />
    </a>
  );
});
