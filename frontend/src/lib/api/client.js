/**
 * Tiny fetch wrapper for the Django REST API.
 *
 * - Base URL comes from VITE_API_URL (see .env.example).
 * - The auth token lives in localStorage and is sent as `Authorization: Token <key>`.
 * - Every failure becomes an ApiError with a readable `message` and a field `errors` map.
 */
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/+$/, "");
const TOKEN_KEY = "profitwise.token";
const AUTH_EVENT = "profitwise:auth-change";

export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

const hasWindow = () => typeof window !== "undefined";

export function getToken() {
  if (!hasWindow()) return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  if (!hasWindow()) return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked — user simply stays signed out */
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/** Subscribe to sign-in / sign-out (this tab and other tabs). Returns an unsubscribe fn. */
export function onAuthChange(callback) {
  if (!hasWindow()) return () => {};
  const onStorage = (e) => {
    if (e.key === TOKEN_KEY || e.key === null) callback();
  };
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export async function apiFetch(path, { method = "GET", body, auth = true } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (auth && token) headers["Authorization"] = `Token ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and try again.", 0);
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    /* non-JSON body */
  }

  if (!response.ok) {
    // An expired/invalid token on a protected call signs the user out.
    if (response.status === 401 && auth && token) setToken(null);
    const message =
      data?.detail ||
      (response.status === 429
        ? "Too many requests. Please wait a moment and try again."
        : "Something went wrong. Please try again.");
    throw new ApiError(message, response.status, data?.errors ?? {});
  }
  return data;
}
