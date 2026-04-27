import { memo, type ComponentPropsWithoutRef } from "react";
import styles from "./ThemedButton.module.css";

type ButtonVariant = "tab" | "action" | "square" | "auth" | "toolbar";

type ThemedButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  active?: boolean;
};

function joinClassNames(...classNames: Array<string | false | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export const ThemedButton = memo(function ThemedButton({
  variant = "action",
  active = false,
  className,
  type = "button",
  ...props
}: ThemedButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        styles["themed-button"],
        "themed-button",
        `themed-button--${variant}`,
        active && styles["is-active"],
        active && "is-active",
        className,
      )}
      {...props}
    />
  );
});
