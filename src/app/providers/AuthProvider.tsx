import React, { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../../utils/supabase";
import { AuthContext } from "./auth-context";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const bootstrapAuth = async () => {
      const supabase = await getSupabaseClient();
      const { data: { session: nextSession } } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, activeSession) => {
          if (!isMounted) {
            return;
          }

          setSession(activeSession);
          setUser(activeSession?.user ?? null);
          setLoading(false);
        },
      );

      unsubscribe = () => {
        subscription.unsubscribe();
      };
    };

    void bootstrapAuth();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
