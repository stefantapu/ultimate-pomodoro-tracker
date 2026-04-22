import { getSkinById } from "@shared/skins/catalog";
import { useSkinStore } from "@shared/stores/skinStore";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TimerCard } from "./TimerCard";

describe("TimerCard", () => {
  afterEach(() => {
    useSkinStore.setState({
      activeSkinId: "warm",
      activeSkin: getSkinById("warm"),
    });
  });

  it("preserves legacy class contracts and time accessibility structure", () => {
    const { container } = render(
      <TimerCard
        mode="focus"
        status="running"
        timeLeft={90}
        targetTimestamp={null}
      />,
    );

    const card = container.querySelector(".timer-card");
    const body = container.querySelector(".timer-card .panel-shell__body");
    const time = container.querySelector(".timer-card__time");
    const digits = container.querySelectorAll(".timer-card__digit");
    const separators = container.querySelectorAll(".timer-card__separator");

    expect(card).not.toBeNull();
    expect(card).toHaveClass("timer-card");
    expect(card).toHaveClass("is-running");
    expect(body).not.toBeNull();
    expect(time).not.toBeNull();
    expect(time).toHaveAttribute("dateTime", "PT1M30S");
    expect(screen.getByText("01:30")).toHaveClass("visually-hidden");
    expect(digits).toHaveLength(4);
    expect(separators).toHaveLength(1);
  });

  it("renders timer art markup when skin assets are present", () => {
    const warmSkin = getSkinById("warm");
    useSkinStore.setState({
      activeSkinId: "warm",
      activeSkin: {
        ...warmSkin,
        assets: {
          ...warmSkin.assets,
          timerPanel: {
            src: "/assets/test/timer-panel.webp",
            width: 1047,
            height: 390,
            aspectRatio: 1047 / 390,
          },
          timerPanelMobile: {
            src: "/assets/test/timer-panel-mobile.webp",
            width: 640,
            height: 360,
            aspectRatio: 640 / 360,
          },
        },
      },
    });

    const { container } = render(
      <TimerCard
        mode="focus"
        status="paused"
        timeLeft={1500}
        targetTimestamp={null}
      />,
    );

    const panelArt = container.querySelector(".timer-card__panel-art");
    const source = panelArt?.querySelector("source");
    const image = panelArt?.querySelector("img.timer-card__panel-image");

    expect(panelArt).not.toBeNull();
    expect(source).not.toBeNull();
    expect(source).toHaveAttribute("media", "(max-width: 640px)");
    expect(source?.getAttribute("srcset")).toContain("timer-panel-mobile.webp");
    expect(image).not.toBeNull();
    expect(image).toHaveAttribute("width", "1047");
    expect(image).toHaveAttribute("height", "390");
    expect(image?.getAttribute("src")).toContain("timer-panel.webp");
  });
});
