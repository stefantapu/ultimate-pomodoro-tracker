import { useCallback } from "react";
import {
  useAuthenticatedResource,
  type AuthenticatedResourceLoader,
} from "./useAuthenticatedResource";

export type ProfileData = {
  total_xp: number;
  level: number;
};

export function useProfile() {
  const loadProfile = useCallback<AuthenticatedResourceLoader<ProfileData>>(
    async ({ supabase, user }) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("total_xp, level")
        .eq("id", user.id)
        .single();

      if (error) {
        throw error;
      }

      return data as ProfileData;
    },
    [],
  );
  const profile = useAuthenticatedResource<ProfileData>({
    load: loadProfile,
    errorMessage: "Failed to fetch profile",
    logMessage: "Failed to fetch profile",
    refreshOnAnalytics: true,
  });

  return {
    profile: profile.data,
    fetchProfile: profile.refetch,
  };
}
