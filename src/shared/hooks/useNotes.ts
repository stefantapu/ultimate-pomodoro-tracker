import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../utils/supabase";
import { useAuth } from "../../app/providers/AuthProvider";

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
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setNotes(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = useCallback(async (content: string) => {
    if (!user || !content.trim()) return;
    const { data, error } = await supabase
      .from("notes")
      .insert([{ user_id: user.id, content }])
      .select()
      .single();
    if (!error && data) {
      setNotes((prev) => [data, ...prev]);
    }
  }, [user]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
    await supabase.from("notes").update(updates).eq("id", id);
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notes").delete().eq("id", id);
  }, []);

  return { notes, loading, addNote, updateNote, deleteNote, fetchNotes };
}
