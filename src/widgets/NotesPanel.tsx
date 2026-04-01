import { useNotes, type Note } from "@shared/hooks/useNotes";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { PanelShell } from "./PanelShell";

type NoteItemProps = {
  note: Note;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
};

const NoteItem = memo(function NoteItem({
  note,
  updateNote,
  deleteNote,
}: NoteItemProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (textareaRef.current && textareaRef.current.value !== note.content) {
      textareaRef.current.value = note.content;
    }
  }, [note.content]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = event.target;

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      void updateNote(note.id, { content: value });
    }, 500);
  };

  return (
    <article className="notes-panel__item">
      <textarea
        ref={textareaRef}
        className="notes-panel__textarea"
        defaultValue={note.content}
        onChange={handleChange}
      />
      <div className="notes-panel__item-actions">
        <button
          type="button"
          className="notes-panel__text-button"
          onClick={() =>
            void updateNote(note.id, { is_completed: !note.is_completed })
          }
        >
          {note.is_completed ? "Completed" : "Mark complete"}
        </button>
        <button
          type="button"
          className="notes-panel__text-button notes-panel__text-button--danger"
          onClick={() => void deleteNote(note.id)}
        >
          Delete
        </button>
      </div>
    </article>
  );
});

type NotesListProps = {
  notes: Note[];
  loading: boolean;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
};

const NotesList = memo(function NotesList({
  notes,
  loading,
  updateNote,
  deleteNote,
}: NotesListProps) {
  if (loading) {
    return <p className="notes-panel__status">Loading notes...</p>;
  }

  if (notes.length === 0) {
    return <p className="notes-panel__status">No notes yet.</p>;
  }

  return (
    <>
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          updateNote={updateNote}
          deleteNote={deleteNote}
        />
      ))}
    </>
  );
});

type AddNoteFormProps = {
  addNote: (content: string) => Promise<void>;
};

const AddNoteForm = memo(function AddNoteForm({ addNote }: AddNoteFormProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const nextNoteText = inputRef.current?.value ?? "";

      if (!nextNoteText.trim()) {
        return;
      }

      void addNote(nextNoteText);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [addNote],
  );

  return (
    <form className="notes-panel__form" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        className="notes-panel__input"
        type="text"
        placeholder="Add note"
      />
      <button className="notes-panel__add-button" type="submit">
        Add
      </button>
    </form>
  );
});

export function NotesPanel() {
  const { notes, addNote, updateNote, deleteNote, loading } = useNotes();

  return (
    <PanelShell
      title="notes"
      className="notes-panel"
      bodyClassName="notes-panel__body"
    >
      <div className="notes-panel__scroll">
        <NotesList
          notes={notes}
          loading={loading}
          updateNote={updateNote}
          deleteNote={deleteNote}
        />
      </div>

      <AddNoteForm addNote={addNote} />
    </PanelShell>
  );
}
