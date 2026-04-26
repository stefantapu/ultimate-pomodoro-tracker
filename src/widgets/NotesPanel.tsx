import { useNotes } from "@shared/hooks/useNotes";
import { memo, useCallback, useEffect, useRef } from "react";
import { PanelShell } from "./PanelShell";

const MAX_NOTEPAD_LENGTH = 1000;
const MAX_NOTEPAD_LINES = 10;

function normalizeNotepadContent(value: string) {
  return value.replace(/\r\n/g, "\n").slice(0, MAX_NOTEPAD_LENGTH);
}

function NotesPanelBase() {
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeNoteIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const isPersistingRef = useRef(false);

  const primaryNote = notes[0] ?? null;

  const syncTextareaValue = useCallback((nextValue: string) => {
    const normalizedValue = normalizeNotepadContent(nextValue);
    const textarea = textareaRef.current;

    if (textarea && textarea.value !== normalizedValue) {
      textarea.value = normalizedValue;
    }
  }, []);

  const schedulePersist = useCallback((nextValue: string) => {
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
  }, [addNote, deleteNote, updateNote]);

  useEffect(() => {
    if (isPersistingRef.current) {
      return;
    }

    activeNoteIdRef.current = primaryNote?.id ?? null;
    syncTextareaValue(primaryNote?.content ?? "");
  }, [primaryNote?.content, primaryNote?.id, syncTextareaValue]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <PanelShell
      className="notes-panel"
      bodyClassName="notes-panel__body notes-panel__body--notepad"
    >
      {loading && notes.length === 0 ? (
        <p className="notes-panel__status">Loading notes...</p>
      ) : (
        <textarea
          id="notes-notepad"
          ref={textareaRef}
          className="notes-panel__notepad"
          defaultValue={normalizeNotepadContent(primaryNote?.content ?? "")}
          rows={MAX_NOTEPAD_LINES}
          maxLength={MAX_NOTEPAD_LENGTH}
          aria-label="Notes notepad"
          onChange={(event) => {
            const nextValue = normalizeNotepadContent(event.currentTarget.value);

            if (event.currentTarget.value !== nextValue) {
              event.currentTarget.value = nextValue;
            }

            schedulePersist(nextValue);
          }}
          placeholder="Write notes..."
          spellCheck={false}
        />
      )}
    </PanelShell>
  );
}

export const NotesPanel = memo(NotesPanelBase);
