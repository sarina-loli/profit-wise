import { apiFetch, setToken } from "@/lib/api/client";

export async function registerAccount({ companyName, email, password }) {
  const data = await apiFetch("/auth/register/", {
    method: "POST",
    auth: false,
    body: { company_name: companyName, email, password },
  });
  setToken(data.token);
  return data.profile;
}

export async function loginAccount({ email, password }) {
  const data = await apiFetch("/auth/login/", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
  setToken(data.token);
  return data.profile;
}

export async function logoutAccount() {
  try {
    await apiFetch("/auth/logout/", { method: "POST" });
  } catch {
    /* even if the server call fails, sign out locally */
  }
  setToken(null);
}

export async function changePassword(newPassword) {
  const data = await apiFetch("/auth/change-password/", {
    method: "POST",
    body: { new_password: newPassword },
  });
  setToken(data.token); // server rotates the token after a password change
}
