import { memo, type ComponentPropsWithoutRef } from "react";

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
        "themed-button",
        `themed-button--${variant}`,
        active && "is-active",
        className,
      )}
      {...props}
    />
  );
});
