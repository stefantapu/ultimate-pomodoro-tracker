import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "../../../utils/supabase";
import { useAuth } from "../../app/providers/useAuth";

export type Note = {
  id: string;
  user_id: string;
  content: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesUserId, setNotesUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotes(data);
      setNotesUserId(user.id);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    queueMicrotask(() => {
      void fetchNotes();
    });
  }, [fetchNotes, user]);

  const addNote = useCallback(
    async (content: string): Promise<Note | null> => {
      if (!user || !content.trim()) return null;
      const supabase = await getSupabaseClient();

      const { data, error } = await supabase
        .from("notes")
        .insert([{ user_id: user.id, content }])
        .select()
      .single();

    if (!error && data) {
      setNotes((prev) => [data, ...prev]);
      setNotesUserId(user.id);
      return data;
    }

      return null;
    },
    [user],
  );

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    const supabase = await getSupabaseClient();
    await supabase.from("notes").update(updates).eq("id", id);
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    const supabase = await getSupabaseClient();
    await supabase.from("notes").delete().eq("id", id);
  }, []);

  return {
    notes: user && notesUserId === user.id ? notes : [],
    loading: user ? loading : false,
    addNote,
    updateNote,
    deleteNote,
    fetchNotes,
  };
}
