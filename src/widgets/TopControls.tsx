import type { Mode } from "@shared/lib/timerTypes";
import {
  memo,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { ThemedButton } from "./ThemedButton";

type TopControlsProps = {
  mode: Mode;
  onSelectMode: (mode: Mode) => void;
};

const STONE_IMPACT_DURATION_MS = 1000;

export const TopControls = memo(function TopControls({
  mode,
  onSelectMode,
}: TopControlsProps) {
  const [impactMode, setImpactMode] = useState<Mode | null>(null);
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

  const triggerStoneImpact = (nextMode: Mode) => {
    if (impactTimerRef.current !== null) {
      window.clearTimeout(impactTimerRef.current);
      impactTimerRef.current = null;
    }

    if (impactFrameRef.current !== null) {
      window.cancelAnimationFrame(impactFrameRef.current);
      impactFrameRef.current = null;
    }

    setImpactMode(null);
    impactFrameRef.current = window.requestAnimationFrame(() => {
      setImpactMode(nextMode);
      impactFrameRef.current = null;

      impactTimerRef.current = window.setTimeout(() => {
        setImpactMode(null);
        impactTimerRef.current = null;
      }, STONE_IMPACT_DURATION_MS);
    });
  };

  const handleStoneImpact = (
    event: PointerEvent<HTMLButtonElement>,
    nextMode: Mode,
  ) => {
    if (event.button !== 0) {
      return;
    }

    triggerStoneImpact(nextMode);
  };

  const getTabClassName = (nextMode: Mode) =>
    impactMode === nextMode ? "is-stone-impacting" : undefined;

  return (
    <div className="top-controls">
      <ThemedButton
        variant="tab"
        active={mode === "focus"}
        className={getTabClassName("focus")}
        onClick={() => onSelectMode("focus")}
        onPointerDown={(event) => handleStoneImpact(event, "focus")}
      >
        Focus
      </ThemedButton>
      <ThemedButton
        variant="tab"
        active={mode === "break"}
        className={getTabClassName("break")}
        onClick={() => onSelectMode("break")}
        onPointerDown={(event) => handleStoneImpact(event, "break")}
      >
        Break
      </ThemedButton>
    </div>
  );
});
