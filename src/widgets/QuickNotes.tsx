import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Note } from "../shared/hooks/useNotes";
import { useNotes } from "../shared/hooks/useNotes";
import styles from "./QuickNotes.module.css";

type NoteItemProps = {
  note: Note;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
};

function NoteItem({ note, updateNote, deleteNote }: NoteItemProps) {
  const [content, setContent] = useState(note.content);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      void updateNote(note.id, { content: event.target.value });
    }, 1000);
  };

  return (
    <article className={styles.note}>
      <textarea
        value={content}
        onChange={handleChange}
        className={`${styles.textarea} ${note.is_completed ? styles.textareaCompleted : ""}`}
      />
      <div className={styles.noteActions}>
        <button
          type="button"
          className={`${styles.textButton} ${note.is_completed ? styles.completed : ""}`}
          onClick={() => void updateNote(note.id, { is_completed: !note.is_completed })}
        >
          {note.is_completed ? "Completed" : "Mark complete"}
        </button>
        <button
          type="button"
          className={`${styles.textButton} ${styles.danger}`}
          onClick={() => void deleteNote(note.id)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export function QuickNotes() {
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const [newNoteText, setNewNoteText] = useState("");

  const handleAdd = (event: FormEvent) => {
    event.preventDefault();

    if (!newNoteText.trim()) {
      return;
    }

    void addNote(newNoteText);
    setNewNoteText("");
  };

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.subtitle}>Capture Queue</div>
          <h3 className={styles.title}>Quick Notes</h3>
        </div>
      </div>

      <div className={styles.list}>
        {notes.length === 0 ? (
          <p className={styles.empty}>No notes yet. Drop the next idea here.</p>
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

      <form onSubmit={handleAdd} className={styles.form}>
        <input
          type="text"
          value={newNoteText}
          onChange={(event) => setNewNoteText(event.target.value)}
          placeholder="New sticky note..."
          className={styles.input}
        />
        <button type="submit" className={styles.submit}>
          +
        </button>
      </form>
    </section>
  );
}
