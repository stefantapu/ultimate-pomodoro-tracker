import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthContextType } from "@app/providers/auth-context";
import { useUIStore } from "../stores/uiStore";
import { useSyncSession, type SessionPayload } from "./useSyncSession";

const { getSupabaseClientMock } = vi.hoisted(() => ({
  getSupabaseClientMock: vi.fn(),
}));

vi.mock("../../../utils/supabase", () => ({
  getSupabaseClient: getSupabaseClientMock,
}));

function wrapperFactory(auth: AuthContextType) {
  return ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
  );
}

function createSyncClient(error: unknown = null) {
  const insertMock = vi.fn().mockResolvedValue({ error });

  return {
    client: {
      from: vi.fn(() => ({
        insert: insertMock,
      })),
    },
    insertMock,
  };
}

const payload: SessionPayload = {
  mode: "focus",
  status: "completed",
  duration_seconds: 1500,
  accumulated_seconds: 1500,
  started_at: "2026-04-15T12:00:00.000Z",
  finished_at: "2026-04-15T12:25:00.000Z",
};

describe("useSyncSession", () => {
  beforeEach(() => {
    getSupabaseClientMock.mockReset();
    useUIStore.setState((state) => ({ ...state, analyticsCounter: 0 }));
    localStorage.clear();
  });

  it("queues a session, flushes it, and refreshes analytics on success", async () => {
    const { client, insertMock } = createSyncClient();
    getSupabaseClientMock.mockResolvedValue(client);

    const { result } = renderHook(() => useSyncSession(), {
      wrapper: wrapperFactory({
        user: { id: "user-1" } as AuthContextType["user"],
        session: null,
        loading: false,
      }),
    });

    await act(async () => {
      await result.current.syncSession(payload);
    });

    expect(insertMock).toHaveBeenCalledWith([
      {
        ...payload,
        user_id: "user-1",
      },
    ]);
    expect(localStorage.getItem("pomodoro_sync_queue:user-1")).toBe("[]");
    expect(useUIStore.getState().analyticsCounter).toBe(1);
  });

  it("flushes an existing queue when a user is already signed in", async () => {
    const { client, insertMock } = createSyncClient();
    getSupabaseClientMock.mockResolvedValue(client);
    localStorage.setItem(
      "pomodoro_sync_queue:user-1",
      JSON.stringify([payload]),
    );

    renderHook(() => useSyncSession(), {
      wrapper: wrapperFactory({
        user: { id: "user-1" } as AuthContextType["user"],
        session: null,
        loading: false,
      }),
    });

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalled();
    });

    expect(localStorage.getItem("pomodoro_sync_queue:user-1")).toBe("[]");
  });

  it("keeps the queue when Supabase returns an insert error", async () => {
    const error = new Error("insert failed");
    const { client } = createSyncClient(error);
    getSupabaseClientMock.mockResolvedValue(client);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useSyncSession(), {
      wrapper: wrapperFactory({
        user: { id: "user-1" } as AuthContextType["user"],
        session: null,
        loading: false,
      }),
    });

    await act(async () => {
      await result.current.syncSession(payload);
    });

    expect(JSON.parse(localStorage.getItem("pomodoro_sync_queue:user-1") ?? "[]"))
      .toEqual([payload]);
    expect(useUIStore.getState().analyticsCounter).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
