import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getToken } from "@/lib/api/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    // The token is verified by the API on every request; a 401 clears it and
    // sends the user back here.
    if (!getToken()) throw redirect({ to: "/login" });
  },
  component: () => <Outlet />,
});
