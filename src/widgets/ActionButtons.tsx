import type { TimerStatus } from "@shared/lib/timerTypes";
import {
  memo,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import styles from "./ActionButtons.module.css";
import { ThemedButton } from "./ThemedButton";

type ActionButtonsProps = {
  status: TimerStatus;
  onPrimaryAction: () => void;
  onReset: () => void;
};

type StoneButton = "primary" | "reset";

const STONE_IMPACT_DURATION_MS = 1000;

function joinClassNames(...classNames: Array<string | false | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export const ActionButtons = memo(function ActionButtons({
  status,
  onPrimaryAction,
  onReset,
}: ActionButtonsProps) {
  const [impactButton, setImpactButton] = useState<StoneButton | null>(null);
  const impactTimerRef = useRef<number | null>(null);
  const impactFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (impactTimerRef.current !== null) {
        window.clearTimeout(impactTimerRef.current);
      }

      if (impactFrameRef.current !== null) {
        window.cancelAnimationFrame(impactFrameRef.current);
      }
    };
  }, []);

  const triggerStoneImpact = (button: StoneButton) => {
    if (impactTimerRef.current !== null) {
      window.clearTimeout(impactTimerRef.current);
      impactTimerRef.current = null;
    }

    if (impactFrameRef.current !== null) {
      window.cancelAnimationFrame(impactFrameRef.current);
      impactFrameRef.current = null;
    }

    setImpactButton(null);
    impactFrameRef.current = window.requestAnimationFrame(() => {
      setImpactButton(button);
      impactFrameRef.current = null;

      impactTimerRef.current = window.setTimeout(() => {
        setImpactButton(null);
        impactTimerRef.current = null;
      }, STONE_IMPACT_DURATION_MS);
    });
  };

  const handleStoneImpact = (
    event: PointerEvent<HTMLButtonElement>,
    button: StoneButton,
  ) => {
    if (event.button !== 0) {
      return;
    }

    triggerStoneImpact(button);
  };

  const getStoneButtonClassName = (
    legacyClassName: string,
    moduleClassName: string,
    button: StoneButton,
  ) =>
    joinClassNames(
      moduleClassName,
      legacyClassName,
      impactButton === button && "is-stone-impacting",
    );

  const primaryButtonClassName = getStoneButtonClassName(
    "action-buttons__button--start",
    styles["action-buttons__button--start"],
    "primary",
  );
  const resetButtonClassName = getStoneButtonClassName(
    "action-buttons__button--reset",
    styles["action-buttons__button--reset"],
    "reset",
  );

  const handlePrimaryPointerDown = (
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    handleStoneImpact(event, "primary");
  };

  const handleResetPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    handleStoneImpact(event, "reset");
  };

  return (
    <div className={joinClassNames(styles["action-buttons"], "action-buttons")}>
      <ThemedButton
        variant="action"
        className={primaryButtonClassName}
        onClick={onPrimaryAction}
        onPointerDown={handlePrimaryPointerDown}
      >
        {status === "running" ? "Pause" : "Start"}
      </ThemedButton>
      <ThemedButton
        variant="action"
        className={resetButtonClassName}
        onClick={onReset}
        onPointerDown={handleResetPointerDown}
      >
        Reset
      </ThemedButton>
    </div>
  );
});
