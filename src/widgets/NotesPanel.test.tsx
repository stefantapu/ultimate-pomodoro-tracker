import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotesPanel } from "./NotesPanel";

const addNoteMock = vi.fn();
const updateNoteMock = vi.fn();
const deleteNoteMock = vi.fn();

vi.mock("@shared/hooks/useNotes", () => ({
  useNotes: () => ({
    notes: [],
    loading: false,
    addNote: addNoteMock,
    updateNote: updateNoteMock,
    deleteNote: deleteNoteMock,
  }),
}));

describe("NotesPanel", () => {
  beforeEach(() => {
    addNoteMock.mockReset();
    updateNoteMock.mockReset();
    deleteNoteMock.mockReset();
  });

  it("keeps notes scrollable up to the 1000 character cap", () => {
    render(<NotesPanel />);

    const notepad = screen.getByLabelText("Notes notepad");
    const longNote = "a".repeat(1000);

    fireEvent.change(notepad, { target: { value: longNote } });

    expect(notepad).toHaveValue(longNote);
    expect(notepad).toHaveAttribute("maxlength", "1000");
  });

  it("trims pasted notes to the 1000 character cap", () => {
    render(<NotesPanel />);

    const notepad = screen.getByLabelText("Notes notepad");

    fireEvent.change(notepad, { target: { value: "a".repeat(1001) } });

    expect(notepad).toHaveValue("a".repeat(1000));
  });
});
