import { getSkinById } from "@shared/skins/catalog";
import { useSkinStore } from "@shared/stores/skinStore";
import { useUIStore } from "@shared/stores/uiStore";
import { renderWithProviders } from "../test/testUtils";
import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardLayout } from "./DashboardLayout";

vi.mock("./StatsDashboard", () => ({
  AuthenticatedAnalyticsPanels: () => <div>Authenticated analytics</div>,
}));

vi.mock("./NotesPanel", () => ({
  NotesPanel: () => <div>Notes panel</div>,
}));

vi.mock("./DragonCard", () => ({
  DragonCard: () => <div>Dragon card</div>,
}));

vi.mock("./TimerBlock", () => ({
  TimerBlock: () => <div>Timer block</div>,
}));

vi.mock("./SettingsButton", () => ({
  SettingsButton: () => <button type="button">Open settings</button>,
}));

vi.mock("./InfographicsButton", () => ({
  InfographicsButton: () => <button type="button">Open infographics</button>,
}));

vi.mock("./ThemePickerButton", () => ({
  ThemePickerButton: () => <button type="button">Open theme picker</button>,
}));

vi.mock("./LogoutButton", () => ({
  LogoutButton: () => <button type="button">Logout</button>,
}));

afterEach(() => {
  useSkinStore.setState({
    activeSkinId: "warm",
    activeSkin: getSkinById("warm"),
  });
  useUIStore.setState((state) => ({
    ...state,
    isSettingsModalOpen: false,
    isInfographicsModalOpen: false,
    isThemePickerModalOpen: false,
  }));
  window.localStorage.clear();
});

describe("DashboardLayout", () => {
  it("shows guest placeholders and locked overlays when no user is present", () => {
    const LockedOverlayComponent = () => <div>LOCKED</div>;

    renderWithProviders(
      <DashboardLayout user={null} LockedOverlayComponent={LockedOverlayComponent} />,
    );

    expect(screen.getByRole("button", { name: "Open theme picker" })).toBeInTheDocument();
    expect(screen.getByText("Sign in to view focus history.")).toBeInTheDocument();
    expect(screen.getAllByText("LOCKED")).toHaveLength(4);
  });

  it("renders the authenticated panels when a user is present", async () => {
    renderWithProviders(
      <DashboardLayout
        user={{ id: "user-1" } as never}
        LockedOverlayComponent={() => null}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Authenticated analytics")).toBeInTheDocument();
    });

    expect(screen.getByText("Notes panel")).toBeInTheDocument();
    expect(screen.getByText("Dragon card")).toBeInTheDocument();
  });

  it("keeps the same bottom-row wrapper structure across themes", () => {
    const expectedClasses = [
      "dashboard-lock-wrap dashboard-lock-wrap--heatmap",
      "dashboard-lock-wrap dashboard-lock-wrap--stats",
      "dashboard-lock-wrap dashboard-lock-wrap--dragon",
    ];

    const renderBottomRowClasses = (skinId: "warm" | "soft-form") => {
      useSkinStore.getState().setActiveSkinId(skinId);

      const { container, unmount } = renderWithProviders(
        <DashboardLayout user={null} LockedOverlayComponent={() => null} />,
      );
      const shell = container.querySelector(".dashboard-shell");
      const bottomRow = container.querySelector(".dashboard-bottom-row");

      expect(shell).toHaveClass(`dashboard-shell--${skinId}`);
      expect(bottomRow).not.toBeNull();

      const classes = Array.from(bottomRow?.children ?? []).map((node) =>
        node.className.toString(),
      );

      unmount();
      return classes;
    };

    expect(renderBottomRowClasses("warm")).toEqual(expectedClasses);
    expect(renderBottomRowClasses("soft-form")).toEqual(expectedClasses);
  });

  it("keeps required shell anchor class contracts after layout cleanup", () => {
    const { container } = renderWithProviders(
      <DashboardLayout user={null} LockedOverlayComponent={() => null} />,
    );

    expect(container.querySelector(".dashboard-toolbar")).toHaveClass(
      "dashboard-toolbar",
    );
    expect(container.querySelector(".dashboard-bottom-row")).toHaveClass(
      "dashboard-bottom-row",
    );

    const notesWrap = container.querySelector(".dashboard-lock-wrap--notes");
    expect(notesWrap).toHaveClass("dashboard-lock-wrap", "dashboard-lock-wrap--notes");
    expect(notesWrap).not.toHaveClass("dashboard-notes-wrap");

    expect(container.querySelector(".dashboard-content")).toBeNull();
    expect(container.querySelector(".dashboard-main")).toBeNull();
    expect(container.querySelector(".dashboard-section")).toBeNull();
    expect(container.querySelector(".dashboard-section--primary")).toBeNull();
    expect(container.querySelector(".dashboard-section--secondary")).toBeNull();
    expect(container.querySelector(".dashboard-section--bottom")).toBeNull();
  });

  it("renders embers from skin capability, not just skin id", () => {
    const warmSkin = getSkinById("warm");
    useSkinStore.setState({
      activeSkinId: "warm",
      activeSkin: {
        ...warmSkin,
        capabilities: {
          ...warmSkin.capabilities,
          effects: {
            ...warmSkin.capabilities.effects,
            embers: false,
          },
        },
      },
    });

    const { container, unmount } = renderWithProviders(
      <DashboardLayout user={null} LockedOverlayComponent={() => null} />,
    );

    expect(container.querySelector(".dashboard-shell")).toHaveClass(
      "dashboard-shell--warm",
    );
    expect(container.querySelector(".dashboard-embers")).toBeNull();

    unmount();

    const softSkin = getSkinById("soft-form");
    useSkinStore.setState({
      activeSkinId: "soft-form",
      activeSkin: {
        ...softSkin,
        capabilities: {
          ...softSkin.capabilities,
          effects: {
            ...softSkin.capabilities.effects,
            embers: true,
          },
        },
      },
    });

    const { container: secondContainer } = renderWithProviders(
      <DashboardLayout user={null} LockedOverlayComponent={() => null} />,
    );

    expect(secondContainer.querySelector(".dashboard-shell")).toHaveClass(
      "dashboard-shell--soft-form",
    );
    expect(secondContainer.querySelector(".dashboard-embers")).not.toBeNull();
  });
});
