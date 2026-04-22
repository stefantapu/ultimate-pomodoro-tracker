import { render, screen } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSkinById } from "@shared/skins/catalog";
import { useSkinStore } from "@shared/stores/skinStore";
import { useUIStore } from "@shared/stores/uiStore";
import App from "./App";

const useAuthMock = vi.fn();
let shouldSuspendAuthBlock = false;

vi.mock("./providers/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("../widgets/DashboardLayout", () => ({
  DashboardLayout: ({ user }: { user: { id?: string } | null }) => (
    <div>Dashboard for {user?.id ?? "guest"}</div>
  ),
}));

vi.mock("../widgets/AuthBlock", () => ({
  AuthBlock: () => {
    if (shouldSuspendAuthBlock) {
      throw new Promise(() => {});
    }

    return <div>Auth modal</div>;
  },
}));

vi.mock("../widgets/InfographicsModal", () => ({
  InfographicsModal: () => <div>Infographics modal</div>,
}));

vi.mock("../widgets/ThemePickerModal", () => ({
  ThemePickerModal: () => <div>Theme picker modal</div>,
}));

vi.mock("sonner", () => ({
  Toaster: () => <div>Toast host</div>,
}));

describe("App", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    shouldSuspendAuthBlock = false;
    useSkinStore.setState({
      activeSkinId: "warm",
      activeSkin: getSkinById("warm"),
      setActiveSkinId: useSkinStore.getState().setActiveSkinId,
    });
    useUIStore.setState((state) => ({
        ...state,
        isAuthModalOpen: false,
        isInfographicsModalOpen: false,
        isThemePickerModalOpen: false,
        isToastHostEnabled: false,
      }));
  });

  it("renders the loading screen while auth is bootstrapping", () => {
    useAuthMock.mockReturnValue({
      user: null,
      loading: true,
    });

    render(<App />);

    const loadingState = screen.getByText("Loading Realm...");
    expect(loadingState).toBeInTheDocument();
    expect(loadingState).toHaveClass("app-loading-state");
    expect(loadingState.getAttribute("style")).toContain("--dashboard-bg");
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
        isThemePickerModalOpen: true,
        isToastHostEnabled: true,
      }));
    });

    render(<App />);

    expect(screen.getByText("Dashboard for user-1")).toBeInTheDocument();
    expect(await screen.findByText("Auth modal")).toBeInTheDocument();
    expect(await screen.findByText("Infographics modal")).toBeInTheDocument();
    expect(await screen.findByText("Theme picker modal")).toBeInTheDocument();
    expect(await screen.findByText("Toast host")).toBeInTheDocument();
  });

  it("keeps auth fallback rendering with theme variables while auth modal chunk is pending", () => {
    shouldSuspendAuthBlock = true;
    useAuthMock.mockReturnValue({
      user: { id: "user-1" },
      loading: false,
    });

    act(() => {
      useUIStore.setState((state) => ({
        ...state,
        isAuthModalOpen: true,
      }));
    });

    render(<App />);

    const fallbackCopy = screen.getByText("Loading sign in...");
    const fallbackRoot = fallbackCopy.closest(".app-auth-fallback");

    expect(fallbackRoot).not.toBeNull();
    expect(fallbackRoot?.getAttribute("style")).toContain("--dashboard-bg");
  });
});
