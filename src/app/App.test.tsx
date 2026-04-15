import { render, screen } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUIStore } from "@shared/stores/uiStore";
import App from "./App";

const useAuthMock = vi.fn();

vi.mock("./providers/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("../widgets/DashboardLayout", () => ({
  DashboardLayout: ({ user }: { user: { id?: string } | null }) => (
    <div>Dashboard for {user?.id ?? "guest"}</div>
  ),
}));

vi.mock("../widgets/AuthBlock", () => ({
  AuthBlock: () => <div>Auth modal</div>,
}));

vi.mock("../widgets/InfographicsModal", () => ({
  InfographicsModal: () => <div>Infographics modal</div>,
}));

vi.mock("sonner", () => ({
  Toaster: () => <div>Toast host</div>,
}));

describe("App", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    useUIStore.setState((state) => ({
      ...state,
      isAuthModalOpen: false,
      isInfographicsModalOpen: false,
      isToastHostEnabled: false,
    }));
  });

  it("renders the loading screen while auth is bootstrapping", () => {
    useAuthMock.mockReturnValue({
      user: null,
      loading: true,
    });

    render(<App />);

    expect(screen.getByText("Loading Realm...")).toBeInTheDocument();
  });

  it("renders the dashboard and lazy modals based on store state", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "user-1" },
      loading: false,
    });

    act(() => {
      useUIStore.setState((state) => ({
        ...state,
        isAuthModalOpen: true,
        isInfographicsModalOpen: true,
        isToastHostEnabled: true,
      }));
    });

    render(<App />);

    expect(screen.getByText("Dashboard for user-1")).toBeInTheDocument();
    expect(await screen.findByText("Auth modal")).toBeInTheDocument();
    expect(await screen.findByText("Infographics modal")).toBeInTheDocument();
    expect(await screen.findByText("Toast host")).toBeInTheDocument();
  });
});
