import { useCallback } from "react";
import { getSupabaseClient } from "../../../utils/supabase";
import {
  useAuthenticatedResource,
  type AuthenticatedResourceLoader,
} from "./useAuthenticatedResource";

export type Note = {
  id: string;
  user_id: string;
  content: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export function useNotes() {
  const loadNotes = useCallback<AuthenticatedResourceLoader<Note[]>>(
    async ({ supabase }) => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data as Note[];
    },
    [],
  );
  const notesResource = useAuthenticatedResource<Note[]>({
    load: loadNotes,
    errorMessage: "Failed to fetch notes",
    logMessage: "Failed to fetch notes",
  });

  const addNote = useCallback(
    async (content: string): Promise<Note | null> => {
      if (!notesResource.user || !content.trim()) return null;
      const supabase = await getSupabaseClient();

      const { data, error } = await supabase
        .from("notes")
        .insert([{ user_id: notesResource.user.id, content }])
        .select()
        .single();

      if (!error && data) {
        notesResource.setData((previous) => [data, ...(previous ?? [])]);
        return data as Note;
      }

      return null;
    },
    [notesResource],
  );

  const updateNote = useCallback(
    async (id: string, updates: Partial<Note>) => {
      notesResource.setData((previous) =>
        previous
          ? previous.map((note) =>
              note.id === id ? { ...note, ...updates } : note,
            )
          : previous,
      );
      const supabase = await getSupabaseClient();
      await supabase.from("notes").update(updates).eq("id", id);
    },
    [notesResource],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      notesResource.setData((previous) =>
        previous ? previous.filter((note) => note.id !== id) : previous,
      );
      const supabase = await getSupabaseClient();
      await supabase.from("notes").delete().eq("id", id);
    },
    [notesResource],
  );

  return {
    notes: notesResource.data ?? [],
    loading: notesResource.loading,
    addNote,
    updateNote,
    deleteNote,
    fetchNotes: notesResource.refetch,
  };
}
