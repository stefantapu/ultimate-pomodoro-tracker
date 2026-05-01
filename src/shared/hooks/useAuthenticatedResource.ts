import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../../utils/supabase";
import { useAuth } from "../../app/providers/useAuth";
import { useUIStore } from "../stores/uiStore";

export type LoadResourceParams = {
  supabase: SupabaseClient;
  user: User;
};

export type AuthenticatedResourceLoader<TData> = (
  params: LoadResourceParams,
) => Promise<TData>;

type UseAuthenticatedResourceOptions<TData> = {
  load: AuthenticatedResourceLoader<TData>;
  errorMessage: string;
  logMessage: string;
  refreshOnAnalytics?: boolean;
  refreshKey?: unknown;
  enabled?: boolean;
};

type AuthenticatedResourceResult<TData> = {
  data: TData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<TData | null>;
  setData: Dispatch<SetStateAction<TData | null>>;
  user: User | null;
};

export function useAuthenticatedResource<TData>({
  load,
  errorMessage,
  logMessage,
  refreshOnAnalytics = false,
  refreshKey,
  enabled = true,
}: UseAuthenticatedResourceOptions<TData>): AuthenticatedResourceResult<TData> {
  const { user } = useAuth();
  const analyticsCounter = useUIStore((state) => state.analyticsCounter);
  const refreshSignal = refreshOnAnalytics ? analyticsCounter : null;
  const [data, setData] = useState<TData | null>(null);
  const [dataUserId, setDataUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    if (!user || !enabled) {
      return null;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
      const supabase = await getSupabaseClient();
      const result = await load({ supabase, user });

      if (requestIdRef.current === requestId) {
        setData(result);
        setDataUserId(user.id);
      }

      return result;
    } catch (caughtError: unknown) {
      if (requestIdRef.current === requestId) {
        console.error(logMessage, caughtError);
        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error(errorMessage),
        );
      }

      return null;
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [enabled, errorMessage, load, logMessage, user]);

  useEffect(() => {
    if (!user || !enabled) {
      return;
    }

    queueMicrotask(() => {
      void refetch();
    });
  }, [
    enabled,
    refetch,
    refreshKey,
    refreshSignal,
    user,
  ]);

  return {
    data: user && dataUserId === user.id ? data : null,
    loading: user ? loading : false,
    error: user ? error : null,
    refetch,
    setData,
    user,
  };
}
