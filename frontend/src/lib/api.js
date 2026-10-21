import axios from "axios";
import { tokenStore } from "./tokenStore";

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

// Exported so nothing else has to re-derive it from VITE_API_URL. The Google
// login redirect needs it, and it used to interpolate the raw env var -- which
// produced the literal string "undefined/api/..." whenever it was unset.
export const apiBaseURL = baseURL;
// Every data request in the app goes through this instance.
export const api = axios.create({
  baseURL,
  // baseURL: "/api", // relative -> uses your Vite proxy -> same-origin, no CORS
  withCredentials: true, // send the httpOnly refresh cookie
});

// A bare instance for refresh ONLY. If refresh went through `api`, a failing
// refresh would hit the 401 interceptor -> call refresh again -> forever.
const refreshClient = axios.create({
  // baseURL: "/api",
  baseURL,
  withCredentials: true,
});

/* 1. Request interceptor — attach the token to every outgoing request */
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* 2. Single-flight refresh — many 401s share ONE refresh call.
   Critical for you: your backend ROTATES the refresh token, so parallel
   refreshes would send an already-dead cookie and fail. */
let refreshPromise = null;

export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/auth/refresh")
      .then((res) => {
        tokenStore.set(res.data.access_token);
        return res.data.access_token;
      })
      .finally(() => {
        refreshPromise = null; // let a future 401 start a fresh refresh
      });
  }
  return refreshPromise;
}

/* 3. Response interceptor — 401 -> refresh -> retry once, else give up.
   AuthProvider registers what "give up" means (clear React user state). */
// Endpoints where a 401 is a legitimate answer, not an expired token.
// Without this list, a wrong password triggers a refresh attempt whose own
// 401 then (a) replaces the real "Invalid email or password" message and
// (b) fires onSessionExpired, which re-bootstraps and fires a SECOND refresh.
const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
];

let onSessionExpired = () => {};
export function setSessionExpiredHandler(fn) {
  onSessionExpired = fn;
}

api.interceptors.response.use(
  (response) => response, // 2xx passes straight through
  async (error) => {
    const original = error.config;

    // A 401 from the auth endpoints themselves means "those credentials are
    // wrong", so refreshing cannot help -- pass the real error straight back.
    const isAuthRequest = AUTH_ENDPOINTS.some((path) =>
      (original?.url ?? "").startsWith(path),
    );

    // Only handle "token expired", and never twice for the same request.
    if (error.response?.status !== 401 || original._retry || isAuthRequest) {
      return Promise.reject(error);
    }
    original._retry = true; // guard against an infinite refresh loop

    try {
      await refreshAccessToken();
      return api(original); // replay the original request with the new token
    } catch (refreshError) {
      tokenStore.clear();
      onSessionExpired(); // tell React the session is truly over
      return Promise.reject(refreshError);
    }
  },
);

export function getApiErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  // FastAPI returns `detail` as an ARRAY of objects for 422 validation errors.
  // Returning that straight to a component throws "Objects are not valid as a
  // React child", so flatten it to the first readable message.
  if (Array.isArray(detail)) {
    return detail[0]?.msg ?? "Please check the details you entered";
  }

  if (typeof detail === "string") return detail;

  return error?.message ?? "Something went wrong";
}

export async function logoutRequest() {
  await api.post("/auth/logout");
}
