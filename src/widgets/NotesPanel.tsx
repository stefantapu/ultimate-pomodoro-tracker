import { useNotes } from "@shared/hooks/useNotes";
import { useEffect, useRef, useState } from "react";
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

export function NotesPanel() {
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeNoteIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const isPersistingRef = useRef(false);

  const primaryNote = notes[0] ?? null;
  const [content, setContent] = useState("");

  useEffect(() => {
    if (isPersistingRef.current) {
      return;
    }

    const nextContent = fitNotepadContent(
      textareaRef.current,
      primaryNote?.content ?? "",
    );

    activeNoteIdRef.current = primaryNote?.id ?? null;
    setContent(nextContent);
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
      const textarea = textareaRef.current;

      if (!textarea) {
        return;
      }

      const fittedValue = fitNotepadContent(textarea, content);

      if (fittedValue === content) {
        return;
      }

      setContent(fittedValue);
      schedulePersist(fittedValue);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [content]);

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
          id="notes-notepad"
          ref={textareaRef}
          className="notes-panel__notepad"
          value={content}
          rows={MAX_NOTEPAD_LINES}
          maxLength={MAX_NOTEPAD_LENGTH}
          aria-label="Notes notepad"
          onChange={(event) => {
            const nextValue = fitNotepadContent(
              event.currentTarget,
              event.currentTarget.value,
            );

            setContent(nextValue);
            schedulePersist(nextValue);
          }}
          placeholder="Write notes..."
          spellCheck={false}
        />
      )}
    </PanelShell>
  );
}
