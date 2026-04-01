import type { ReactNode } from "react";

type PanelShellProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function PanelShell({
  title,
  children,
  className,
  bodyClassName,
}: PanelShellProps) {
  return (
    <section className={joinClassNames("panel-shell", className)}>
      {title ? <div className="panel-shell__title">{title}</div> : null}
      <div className={joinClassNames("panel-shell__body", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

