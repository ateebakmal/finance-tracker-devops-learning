import {
  api,
  apiBaseURL,
  logoutRequest,
  refreshAccessToken,
  setSessionExpiredHandler,
} from "@/lib/api";
import { tokenStore } from "@/lib/tokenStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext } from "react";
import { useContext, useEffect } from "react";

const AuthContext = createContext(null);

async function bootstrap() {
  await refreshAccessToken();
  const result = await api.get("/auth/me");
  return result.data;
}

export function AuthProvider({ children }) {
  // const [user, setUser] = useState(null);
  // const [loading, setIsLoading] = useState(true);

  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: bootstrap,
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    // The deps array belongs to useEffect, not to setSessionExpiredHandler --
    // it was being passed as a second argument to the wrong function, so this
    // re-registered the handler on every single render.
    setSessionExpiredHandler(() => {
      tokenStore.clear();
      queryClient.invalidateQueries({ queryKey: ["me"] });
    });
  }, [queryClient]);
  // useEffect(() => {
  //   // Let the axios layer knock on React's door when refresh dies mid-session.
  //   setSessionExpiredHandler(() => setUser(null));

  //   async function bootstrap() {
  //     try {
  //       await refreshAccessToken();
  //       const { data } = await api.get("/auth/me");
  //       setUser(data);
  //     } catch {
  //       setUser(null);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }
  //   bootstrap();
  // }, []);

  function login() {
    // Full navigation, not a fetch — the browser must follow Google's
    // redirect chain and receive the Set-Cookie at the end.
    window.location.href = `${apiBaseURL}/auth/google/login`;
  }

  /* Email + password. Both endpoints do exactly what /google/callback does:
     set the httpOnly refresh cookie and hand back an access token. So all we
     do here is stash the token and let the ["me"] query re-bootstrap, which
     is the same path a page reload takes. */
  async function loginWithPassword({ email, password }) {
    const res = await api.post("/auth/login", { email, password });
    tokenStore.set(res.data.access_token);
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  }

  async function signup({ email, password }) {
    const res = await api.post("/auth/register", { email, password });
    tokenStore.set(res.data.access_token);
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  }

  async function logout() {
    // TODO later: POST /auth/logout to delete the session server-side.
    await logoutRequest();
    tokenStore.clear();
    queryClient.setQueryData(["me"], null);
    // setUser(null); // ProtectedRoutes sees null -> redirects to /login
  }

  // TODO: access token is only used for console.log to test api.
  const accessToken = tokenStore.get();
  const value = {
    user: user ?? null,
    loading: isLoading,
    login,
    loginWithPassword,
    signup,
    logout,
    accessToken,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
