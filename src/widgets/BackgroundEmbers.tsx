import { memo, useMemo, type CSSProperties } from "react";

const EMBER_COUNT = 48;

function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export const BackgroundEmbers = memo(function BackgroundEmbers() {
  const embers = useMemo(() => {
    const random = createSeededRandom(0x1f2e3d4c);
    const colors = [
      "rgba(255, 119, 49, 0.92)",
      "rgba(255, 157, 72, 0.88)",
      "rgba(255, 205, 126, 0.82)",
      "rgba(255, 94, 28, 0.84)",
    ];

    return Array.from({ length: EMBER_COUNT }, (_, index) => {
      const size = 1 + random() * 4;
      const left = random() * 100;
      const duration = 9 + random() * 8;
      const delay = -random() * duration;
      const drift = (random() - 0.5) * 18;
      const sway = 0.65 + random() * 0.9;
      const opacity = 0.34 + random() * 0.48;
      const blur = 0.15 + random() * 0.55;
      const glow = size * (1.8 + random() * 1.6);
      const color = colors[Math.floor(random() * colors.length)];

      return {
        id: `ember-${index}`,
        style: {
          "--ember-left": `${left.toFixed(2)}%`,
          "--ember-size": `${size.toFixed(2)}px`,
          "--ember-duration": `${duration.toFixed(2)}s`,
          "--ember-delay": `${delay.toFixed(2)}s`,
          "--ember-drift": `${drift.toFixed(2)}vw`,
          "--ember-sway": `${sway.toFixed(2)}s`,
          "--ember-opacity": opacity.toFixed(2),
          "--ember-blur": `${blur.toFixed(2)}px`,
          "--ember-glow": `${glow.toFixed(2)}px`,
          "--ember-color": color,
        } as CSSProperties,
      };
    });
  }, []);

  return (
    <div className="dashboard-embers" aria-hidden="true">
      {embers.map((ember) => (
        <span key={ember.id} className="dashboard-ember" style={ember.style} />
      ))}
    </div>
  );
});
