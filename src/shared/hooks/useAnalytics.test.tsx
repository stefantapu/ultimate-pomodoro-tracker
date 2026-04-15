import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthContextType } from "@app/providers/auth-context";
import { useAnalytics } from "./useAnalytics";

const { getSupabaseClientMock } = vi.hoisted(() => ({
  getSupabaseClientMock: vi.fn(),
}));

vi.mock("../../../utils/supabase", () => ({
  getSupabaseClient: getSupabaseClientMock,
}));

function createAuthWrapper(auth: AuthContextType) {
  return ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
  );
}

describe("useAnalytics", () => {
  beforeEach(() => {
    getSupabaseClientMock.mockReset();
  });

  it("loads analytics for the current user and hides stale data during user changes", async () => {
    const rpcMock = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          today_focus_time: 100,
          today_break_time: 20,
          focus_cycles_count: 2,
          current_streak: 3,
          heatmap_data: [],
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          today_focus_time: 250,
          today_break_time: 50,
          focus_cycles_count: 4,
          current_streak: 5,
          heatmap_data: [],
        },
        error: null,
      });

    getSupabaseClientMock.mockResolvedValue({
      rpc: rpcMock,
    });

    let currentAuth: AuthContextType = {
      user: { id: "user-1" } as AuthContextType["user"],
      session: null,
      loading: false,
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={currentAuth}>{children}</AuthContext.Provider>
    );

    const { result, rerender } = renderHook(() => useAnalytics(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.data?.today_focus_time).toBe(100);
    });

    currentAuth = {
      user: { id: "user-2" } as AuthContextType["user"],
      session: null,
      loading: false,
    };
    rerender();

    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.data?.today_focus_time).toBe(250);
    });
  });

  it("captures rpc errors", async () => {
    getSupabaseClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: new Error("rpc failed"),
      }),
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useAnalytics(), {
      wrapper: createAuthWrapper({
        user: { id: "user-1" } as AuthContextType["user"],
        session: null,
        loading: false,
      }),
    });

    await waitFor(() => {
      expect(result.current.error?.message).toBe("rpc failed");
    });

    expect(consoleSpy).toHaveBeenCalled();
  });
});
