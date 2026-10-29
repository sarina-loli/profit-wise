import { apiFetch, getToken } from "@/lib/api/client";

export async function getMyProfile() {
  if (!getToken()) return null;
  return apiFetch("/profile/");
}

export function updateMyProfile(patch) {
  return apiFetch("/profile/", { method: "PATCH", body: patch });
}
