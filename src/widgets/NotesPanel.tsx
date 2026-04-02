import { useNotes } from "@shared/hooks/useNotes";
import { useEffect, useRef } from "react";
import { PanelShell } from "./PanelShell";

export function NotesPanel() {
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeNoteIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const isPersistingRef = useRef(false);

  const primaryNote = notes[0] ?? null;

  useEffect(() => {
    if (isPersistingRef.current) {
      return;
    }

    activeNoteIdRef.current = primaryNote?.id ?? null;
    if (textareaRef.current) {
      textareaRef.current.value = primaryNote?.content ?? "";
    }
  }, [primaryNote?.content, primaryNote?.id]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const schedulePersist = (nextValue: string) => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      const trimmedValue = nextValue.trim();
      const activeId = activeNoteIdRef.current;
      isPersistingRef.current = true;

      try {
        if (!trimmedValue) {
          if (activeId) {
            await deleteNote(activeId);
            activeNoteIdRef.current = null;
          }
          return;
        }

        if (activeId) {
          await updateNote(activeId, { content: nextValue });
          return;
        }

        const createdNote = await addNote(nextValue);
        activeNoteIdRef.current = createdNote?.id ?? null;
      } finally {
        isPersistingRef.current = false;
      }
    }, 450);
  };

  return (
    <PanelShell
      className="notes-panel"
      bodyClassName="notes-panel__body notes-panel__body--notepad"
    >
      {loading && notes.length === 0 ? (
        <p className="notes-panel__status">Loading notes...</p>
      ) : (
        <textarea
          ref={textareaRef}
          className="notes-panel__notepad"
          defaultValue={primaryNote?.content ?? ""}
          onChange={(event) => schedulePersist(event.target.value)}
          placeholder="Write notes..."
          spellCheck={false}
        />
      )}
    </PanelShell>
  );
}
