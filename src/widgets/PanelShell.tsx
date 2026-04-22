import { memo, type ReactNode } from "react";
import styles from "./PanelShell.module.css";

type PanelShellProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export const PanelShell = memo(function PanelShell({
  title,
  children,
  className,
  bodyClassName,
}: PanelShellProps) {
  return (
    <section
      className={joinClassNames(styles["panel-shell"], "panel-shell", className)}
    >
      {title ? (
        <div className={joinClassNames(styles["panel-shell__title"], "panel-shell__title")}>
          {title}
        </div>
      ) : null}
      <div
        className={joinClassNames(
          styles["panel-shell__body"],
          "panel-shell__body",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
});
