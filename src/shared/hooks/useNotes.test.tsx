import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthContextType } from "@app/providers/auth-context";
import { useNotes } from "./useNotes";

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

describe("useNotes", () => {
  beforeEach(() => {
    getSupabaseClientMock.mockReset();
  });

  it("fetches notes and applies optimistic update/delete flows", async () => {
    const fetchedNote = {
      id: "note-1",
      user_id: "user-1",
      content: "Initial",
      is_completed: false,
      created_at: "2026-04-15T12:00:00.000Z",
      updated_at: "2026-04-15T12:00:00.000Z",
    };
    const createdNote = {
      ...fetchedNote,
      id: "note-2",
      content: "Created",
    };
    const orderMock = vi.fn().mockResolvedValue({
      data: [fetchedNote],
      error: null,
    });
    const singleMock = vi.fn().mockResolvedValue({
      data: createdNote,
      error: null,
    });
    const updateEqMock = vi.fn().mockResolvedValue({});
    const deleteEqMock = vi.fn().mockResolvedValue({});

    getSupabaseClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: orderMock,
          single: singleMock,
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: singleMock,
          })),
        })),
        update: vi.fn(() => ({
          eq: updateEqMock,
        })),
        delete: vi.fn(() => ({
          eq: deleteEqMock,
        })),
      })),
    });

    const { result } = renderHook(() => useNotes(), {
      wrapper: createAuthWrapper({
        user: { id: "user-1" } as AuthContextType["user"],
        session: null,
        loading: false,
      }),
    });

    await waitFor(() => {
      expect(result.current.notes).toHaveLength(1);
    });

    await act(async () => {
      const note = await result.current.addNote("Created");
      expect(note?.id).toBe("note-2");
    });

    expect(result.current.notes[0].content).toBe("Created");

    await act(async () => {
      await result.current.updateNote("note-1", { content: "Updated" });
    });

    expect(result.current.notes.find((note) => note.id === "note-1")?.content)
      .toBe("Updated");

    await act(async () => {
      await result.current.deleteNote("note-1");
    });

    expect(result.current.notes.some((note) => note.id === "note-1")).toBe(false);
    expect(updateEqMock).toHaveBeenCalledWith("id", "note-1");
    expect(deleteEqMock).toHaveBeenCalledWith("id", "note-1");
  });

  it("returns stable empty state without a user and rejects blank notes", async () => {
    const { result } = renderHook(() => useNotes(), {
      wrapper: createAuthWrapper({
        user: null,
        session: null,
        loading: false,
      }),
    });

    expect(result.current.notes).toEqual([]);
    expect(result.current.loading).toBe(false);

    await act(async () => {
      await expect(result.current.addNote("   ")).resolves.toBeNull();
    });
  });
});
