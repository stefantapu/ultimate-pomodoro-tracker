import React, { useRef, useState } from "react";
import { useNotes } from "../shared/hooks/useNotes";
import type { Note } from "../shared/hooks/useNotes";

type NoteUpdate = (id: string, updates: Partial<Note>) => Promise<void>;
type NoteDelete = (id: string) => Promise<void>;

function NoteItem({
  note,
  updateNote,
  deleteNote,
}: {
  note: Note;
  updateNote: NoteUpdate;
  deleteNote: NoteDelete;
}) {
  const [content, setContent] = useState(note.content);
  const timeoutRef = useRef<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value;
    setContent(nextValue);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      void updateNote(note.id, { content: nextValue });
    }, 1000);
  };

  return (
    <div
      style={{
        background: "#2a2a35",
        padding: "10px",
        borderRadius: "8px",
        marginBottom: "10px",
        position: "relative",
      }}
    >
      <textarea
        value={content}
        onChange={handleChange}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          color: note.is_completed ? "#888" : "#fff",
          textDecoration: note.is_completed ? "line-through" : "none",
          resize: "vertical",
          minHeight: "40px",
          outline: "none",
          fontFamily: "inherit",
          fontSize: "0.95rem",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "5px",
          alignItems: "center",
        }}
      >
        <button
          onClick={() =>
            void updateNote(note.id, { is_completed: !note.is_completed })
          }
          style={{
            background: "none",
            border: "none",
            color: note.is_completed ? "#a777e3" : "#888",
            cursor: "pointer",
            fontSize: "0.85rem",
            padding: 0,
          }}
        >
          {note.is_completed ? "Completed" : "Mark Complete"}
        </button>
        <button
          onClick={() => void deleteNote(note.id)}
          style={{
            background: "none",
            border: "none",
            color: "#e37777",
            cursor: "pointer",
            fontSize: "0.85rem",
            padding: 0,
          }}
        >
          Trash
        </button>
      </div>
    </div>
  );
}

export function QuickNotes() {
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const [newNoteText, setNewNoteText] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();

    if (newNoteText.trim()) {
      void addNote(newNoteText);
      setNewNoteText("");
    }
  };

  return (
    <div
      style={{
        width: "320px",
        background: "rgba(255,255,255,0.05)",
        padding: "1.2rem",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        flexDirection: "column",
        maxHeight: "100%",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Quick Notes
      </h3>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: "1rem",
          paddingRight: "5px",
        }}
      >
        {notes.length === 0 ? (
          <p
            style={{
              color: "#aaa",
              fontSize: "0.9rem",
              textAlign: "center",
              fontStyle: "italic",
              marginTop: "2rem",
            }}
          >
            No notes yet. Start writing!
          </p>
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

      <form
        onSubmit={handleAdd}
        style={{ display: "flex", gap: "8px", marginTop: "auto" }}
      >
        <input
          type="text"
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="New sticky note..."
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(0,0,0,0.2)",
            color: "#fff",
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            background: "#a777e3",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          +
        </button>
      </form>
    </div>
  );
}
