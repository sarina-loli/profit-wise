import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { logoutAccount } from "@/lib/api/auth";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";

const PUBLIC_LINKS = [{ to: "/", label: "Home" }];
const PRIVATE_LINKS = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/history", label: "History" },
  { to: "/profile", label: "Profile" },
];

export function AppNav() {
  const { session } = useSession();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await logoutAccount();
    await router.invalidate();
    navigate({ to: "/login", replace: true });
  }

  const links = session ? PRIVATE_LINKS : PUBLIC_LINKS;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link to="/" className="group flex items-center gap-2" onClick={() => setOpen(false)}>
          <span
            className="h-6 w-6 rounded-md transition-transform duration-500 group-hover:rotate-12"
            style={{ background: "var(--gradient-amber)", boxShadow: "var(--glow-amber)" }}
          />
          <span className="font-display text-sm font-semibold tracking-tight sm:text-base">
            ProfitWise 
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors duration-300 hover:bg-secondary hover:text-foreground [&.active]:text-primary"
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          {session ? (
            <button
              onClick={handleSignOut}
              className="ml-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors duration-300 hover:border-primary hover:text-primary"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="ml-2 rounded-full px-5 py-2 font-display text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.04]"
              style={{ background: "var(--gradient-amber)" }}
            >
              Login
            </Link>
          )}
        </div>

        <button
          className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <div
        className={cn(
          "overflow-hidden border-border bg-background/95 backdrop-blur-xl transition-[max-height,opacity] duration-500 md:hidden",
          open ? "max-h-80 border-t opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:text-primary"
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          {session ? (
            <button
              onClick={handleSignOut}
              className="rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg px-3 py-2.5 text-center font-display text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-amber)" }}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
