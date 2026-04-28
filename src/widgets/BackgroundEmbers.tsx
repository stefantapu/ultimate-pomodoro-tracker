import type { SkinAmbientEffect } from "@shared/skins/types";
import { memo, useMemo, type CSSProperties } from "react";

type BackgroundParticlesProps = {
  effect: SkinAmbientEffect;
};

function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function interpolate(
  randomValue: number,
  range: readonly [number, number],
) {
  return range[0] + randomValue * (range[1] - range[0]);
}

export const BackgroundParticles = memo(function BackgroundParticles({
  effect,
}: BackgroundParticlesProps) {
  const particles = useMemo(() => {
    const random = createSeededRandom(effect.seed);

    return Array.from({ length: effect.count }, (_, index) => {
      const size = interpolate(random(), effect.sizeRangePx);
      const duration = interpolate(random(), effect.durationRangeSec);
      const delay = interpolate(random(), effect.delayRangeSec);
      const opacity = interpolate(random(), effect.opacityRange);
      const startX = interpolate(random(), effect.startXRangePercent);
      const startY = interpolate(random(), effect.startYRangePercent);
      const travelX = interpolate(random(), effect.travelXRangeVw);
      const travelY = interpolate(random(), effect.travelYRangeSvh);
      const drift = interpolate(random(), effect.driftRangeVw);
      const color = effect.colors[Math.floor(random() * effect.colors.length)];

      return {
        id: `${effect.kind}-${index}`,
        style: {
          "--particle-left": `${startX.toFixed(2)}%`,
          "--particle-top": `${startY.toFixed(2)}%`,
          "--particle-size": `${size.toFixed(2)}px`,
          "--particle-duration": `${duration.toFixed(2)}s`,
          "--particle-delay": `${delay.toFixed(2)}s`,
          "--particle-opacity": opacity.toFixed(2),
          "--particle-travel-x": `${travelX.toFixed(2)}vw`,
          "--particle-travel-y": `${travelY.toFixed(2)}svh`,
          "--particle-drift": `${drift.toFixed(2)}vw`,
          "--particle-color": color,
        } as CSSProperties,
      };
    });
  }, [effect]);

  return (
    <div
      className={[
        "dashboard-particles",
        `dashboard-particles--${effect.kind}`,
        effect.kind === "embers" ? "dashboard-embers" : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={[
            "dashboard-particle",
            `dashboard-particle--${effect.kind}`,
            effect.kind === "embers" ? "dashboard-ember" : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
          style={particle.style}
        />
      ))}
    </div>
  );
});

export const BackgroundEmbers = BackgroundParticles;
