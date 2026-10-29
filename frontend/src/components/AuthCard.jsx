import { Loader2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

export function AuthCard({ eyebrow, title, subtitle, children, footer, onSubmit }) {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center px-5 py-28"
      style={{ background: "var(--gradient-void)" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 45% at 50% 25%, color-mix(in oklab, var(--primary) 15%, transparent) 0%, transparent 70%)",
        }}
      />
      <Reveal className="relative w-full max-w-md">
        <div
          className="rounded-3xl border border-border bg-card/80 p-7 backdrop-blur-2xl sm:p-9"
          style={{ boxShadow: "var(--shadow-depth)" }}
        >
          <p className="text-[0.62rem] uppercase tracking-[0.4em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
            {children}
          </form>

          <div className="mt-6 text-center">{footer}</div>
        </div>
      </Reveal>
    </main>
  );
}

export function AuthField({ label, value, onChange, error, type = "text", autoComplete }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "mt-2 w-full rounded-xl border bg-secondary/60 px-4 py-3 text-sm outline-none transition-all duration-300 placeholder:text-muted-foreground/60 focus:border-primary focus:bg-secondary",
          error ? "border-destructive" : "border-input",
        )}
      />
      {error ? <span className="mt-1.5 block text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

export function AuthSubmit({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-display text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70"
      style={{ background: "var(--gradient-amber)", boxShadow: "var(--glow-amber)" }}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
