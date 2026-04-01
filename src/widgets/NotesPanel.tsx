import { useNotes, type Note } from "@shared/hooks/useNotes";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { PanelShell } from "./PanelShell";

type NoteItemProps = {
  note: Note;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
};

function NoteItem({ note, updateNote, deleteNote }: NoteItemProps) {
  const [content, setContent] = useState(note.content);
  const timeoutRef = useRef<number | null>(null);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = event.target;
    setContent(value);

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
        className="notes-panel__textarea"
        value={content}
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
}

export function NotesPanel() {
  const { notes, addNote, updateNote, deleteNote, loading } = useNotes();
  const [newNoteText, setNewNoteText] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newNoteText.trim()) {
      return;
    }

    void addNote(newNoteText);
    setNewNoteText("");
  };

  return (
    <PanelShell title="notes" className="notes-panel" bodyClassName="notes-panel__body">
      <div className="notes-panel__scroll">
        {loading ? (
          <p className="notes-panel__status">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="notes-panel__status">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              updateNote={updateNote}
              deleteNote={deleteNote}
            />
          ))
        )}
      </div>

      <form className="notes-panel__form" onSubmit={handleSubmit}>
        <input
          className="notes-panel__input"
          type="text"
          value={newNoteText}
          onChange={(event) => setNewNoteText(event.target.value)}
          placeholder="Add note"
        />
        <button className="notes-panel__add-button" type="submit">
          Add
        </button>
      </form>
    </PanelShell>
  );
}

