import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../../utils/supabase";
import { useAuth } from "../../app/providers/AuthProvider";
import { useUIStore } from "../stores/uiStore";

export type ProfileData = {
  total_xp: number;
  level: number;
};

export function useProfile() {
  const { user } = useAuth();
  const analyticsCounter = useUIStore((state) => state.analyticsCounter);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("total_xp, level")
      .eq("id", user.id)
      .single();
    
    if (!error && data) {
      setProfile(data as ProfileData);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user, fetchProfile, analyticsCounter]);

  return { profile, fetchProfile };
}
