import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

async function fetchAuthConfig() {
  const res = await api.get("/auth/config");
  return res.data;
}

/* Which sign-in methods this deployment offers.
   Asked at runtime rather than baked in at build time, so the same built
   frontend works on localhost (Google works) and on EC2 (it cannot). */
export function useAuthConfig() {
  const { data } = useQuery({
    queryKey: ["auth-config"],
    queryFn: fetchAuthConfig,
    staleTime: Infinity,
    retry: false,
  });

  // Default both to ON. If the probe fails we would rather show a button that
  // errors when clicked than a login page with no way in at all.
  return {
    googleEnabled: data?.google_enabled ?? true,
    passwordEnabled: data?.password_enabled ?? true,
  };
}
