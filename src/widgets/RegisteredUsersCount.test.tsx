import { renderWithProviders } from "../test/testUtils";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisteredUsersCount } from "./RegisteredUsersCount";

const rpc = vi.fn();

vi.mock("../../utils/supabase", () => ({
  getSupabaseClient: vi.fn(async () => ({ rpc })),
}));

describe("RegisteredUsersCount", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("shows the registered users count returned by Supabase", async () => {
    rpc.mockResolvedValue({ data: 10, error: null });

    renderWithProviders(<RegisteredUsersCount />);

    expect(screen.getByText("Users: --")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Users: 10")).toBeInTheDocument();
    });
    expect(rpc).toHaveBeenCalledWith("get_registered_users_count");
  });

  it("keeps a neutral placeholder when the request fails", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("Unavailable") });

    renderWithProviders(<RegisteredUsersCount />);

    await waitFor(() => {
      expect(rpc).toHaveBeenCalledWith("get_registered_users_count");
    });
    expect(screen.getByText("Users: --")).toBeInTheDocument();
  });
});
