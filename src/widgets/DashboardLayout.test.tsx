import { renderWithProviders } from "../test/testUtils";
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

vi.mock("./LogoutButton", () => ({
  LogoutButton: () => <button type="button">Logout</button>,
}));

describe("DashboardLayout", () => {
  it("shows guest placeholders and locked overlays when no user is present", () => {
    const LockedOverlayComponent = () => <div>LOCKED</div>;

    renderWithProviders(
      <DashboardLayout user={null} LockedOverlayComponent={LockedOverlayComponent} />,
    );

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
});
