import { useNotes } from "@shared/hooks/useNotes";
import { memo, useEffect, useRef } from "react";
import { PanelShell } from "./PanelShell";

const MAX_NOTEPAD_LENGTH = 340;
const MAX_NOTEPAD_LINES = 10;

function normalizeNotepadContent(value: string) {
  return value.replace(/\r\n/g, "\n").slice(0, MAX_NOTEPAD_LENGTH);
}

function fitNotepadContent(
  textarea: HTMLTextAreaElement | null,
  value: string,
) {
  const normalizedValue = normalizeNotepadContent(value);

  if (!textarea) {
    return normalizedValue;
  }

  const previousValue = textarea.value;
  let fittedValue = normalizedValue;

  textarea.value = fittedValue;

  while (
    fittedValue.length > 0 &&
    textarea.scrollHeight > textarea.clientHeight + 1
  ) {
    fittedValue = fittedValue.slice(0, -1);
    textarea.value = fittedValue;
  }

  textarea.value = previousValue;

  return fittedValue;
}

function NotesPanelBase() {
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeNoteIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const isPersistingRef = useRef(false);
  const contentRef = useRef("");

  const primaryNote = notes[0] ?? null;

  const syncTextareaValue = (nextValue: string) => {
    const fittedValue = fitNotepadContent(textareaRef.current, nextValue);
    const textarea = textareaRef.current;

    contentRef.current = fittedValue;

    if (textarea && textarea.value !== fittedValue) {
      textarea.value = fittedValue;
    }

    return fittedValue;
  };

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

  useEffect(() => {
    if (isPersistingRef.current) {
      return;
    }

    activeNoteIdRef.current = primaryNote?.id ?? null;
    syncTextareaValue(primaryNote?.content ?? "");
  }, [primaryNote?.content, primaryNote?.id]);

  useEffect(() => {
    const nextContent = fitNotepadContent(
      textareaRef.current,
      primaryNote?.content ?? "",
    );

    if (!primaryNote?.id || primaryNote.content === nextContent) {
      return;
    }

    updateNote(primaryNote.id, { content: nextContent });
  }, [primaryNote?.content, primaryNote?.id, updateNote]);

  useEffect(() => {
    const handleResize = () => {
      const previousValue = contentRef.current;
      const fittedValue = syncTextareaValue(previousValue);

      if (fittedValue === previousValue) {
        return;
      }

      schedulePersist(fittedValue);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
            const nextValue = fitNotepadContent(
              event.currentTarget,
              event.currentTarget.value,
            );

            contentRef.current = nextValue;

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
