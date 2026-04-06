import { useState, useCallback, useEffect } from "react";
import { getSupabaseClient } from "../../../utils/supabase";
import { useAuth } from "../../app/providers/useAuth";
import { useUIStore } from "../stores/uiStore";

export type ProfileData = {
  total_xp: number;
  level: number;
};

export function useProfile() {
  const { user } = useAuth();
  const analyticsCounter = useUIStore((state) => state.analyticsCounter);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("total_xp, level")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setProfile(data as ProfileData);
      setProfileUserId(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    queueMicrotask(() => {
      void fetchProfile();
    });
  }, [analyticsCounter, fetchProfile, user]);

  return {
    profile: user && profileUserId === user.id ? profile : null,
    fetchProfile,
  };
}
