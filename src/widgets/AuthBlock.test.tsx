import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../test/testUtils";
import { AuthBlock } from "./AuthBlock";

const signInWithOAuth = vi.fn();
const signInWithPassword = vi.fn();
const signUp = vi.fn();

vi.mock("../../utils/supabase", () => ({
  getSupabaseClient: vi.fn(async () => ({
    auth: {
      signInWithOAuth,
      signInWithPassword,
      signUp,
    },
  })),
}));

describe("AuthBlock", () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
    signInWithPassword.mockReset();
    signUp.mockReset();
    signInWithOAuth.mockResolvedValue({ data: { url: "https://accounts.google.com" }, error: null });
    signInWithPassword.mockResolvedValue({ data: {}, error: null });
    signUp.mockResolvedValue({ data: {}, error: null });
    window.history.pushState({}, "", "/app");
  });

  it("renders Google auth in both log in and sign up modes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthBlock />);

    expect(screen.getByRole("heading", { name: "Welcome Back" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/privacy");
    expect(screen.getByText("or enter manually")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(screen.getByRole("heading", { name: "Join the Quest" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
  });

  it("starts Google OAuth with a root redirect derived from window origin", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthBlock />);

    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
    });
  });

  it("keeps the modal locked while Google OAuth is starting", async () => {
    const user = userEvent.setup();
    let resolveOAuth: (value: { data: Record<string, never>; error: null }) => void;
    signInWithOAuth.mockReturnValue(
      new Promise((resolve) => {
        resolveOAuth = resolve;
      }),
    );

    renderWithProviders(<AuthBlock />);

    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(screen.getByRole("button", { name: "Redirecting..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Enter Realm" })).toBeDisabled();

    resolveOAuth!({ data: {}, error: null });
  });

  it("shows the normal manual auth error with the Google recovery action", async () => {
    const user = userEvent.setup();
    signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: "Invalid login credentials" },
    });

    renderWithProviders(<AuthBlock />);

    await user.type(screen.getByPlaceholderText("Hero Email"), "hero@example.com");
    await user.type(screen.getByPlaceholderText("Secret Passcode"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Enter Realm" }));

    expect(await screen.findByText("Invalid login credentials")).toBeInTheDocument();
    expect(
      screen.getByLabelText("If you signed up with Google, continue with Google."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Google" }));

    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
    });
  });
});
