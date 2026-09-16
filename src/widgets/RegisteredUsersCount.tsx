import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../utils/supabase";

export function RegisteredUsersCount() {
  const [usersCount, setUsersCount] = useState<number | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadUsersCount() {
      try {
        const supabase = await getSupabaseClient();
        const { data, error } = await supabase.rpc("get_registered_users_count");
        const count = Number(data);

        if (!isActive || error || !Number.isFinite(count)) {
          return;
        }

        setUsersCount(count);
      } catch {
        // Keep the neutral placeholder when the public count is unavailable.
      }
    }

    void loadUsersCount();

    return () => {
      isActive = false;
    };
  }, []);

  return <span aria-live="polite">Users: {usersCount ?? "--"}</span>;
}
