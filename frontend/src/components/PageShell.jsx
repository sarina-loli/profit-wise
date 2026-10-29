import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

/** Shared page frame: cinematic backdrop, nav offset, heading. */
export function PageShell({ eyebrow, title, subtitle, actions, children, className }) {
  return (
    <main
      className="relative min-h-screen pb-20 pt-28 sm:pt-32"
      style={{ background: "var(--gradient-void)" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, color-mix(in oklab, var(--primary) 14%, transparent) 0%, transparent 70%)",
        }}
      />
      <div className={cn("relative mx-auto w-full max-w-6xl px-5", className)}>
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {eyebrow ? (
                <p className="text-[0.65rem] uppercase tracking-[0.38em] text-muted-foreground">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        </Reveal>
        <div className="mt-10">{children}</div>
      </div>
    </main>
  );
}

export function PremiumCard({ children, className }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-xl transition-all duration-500 hover:border-[color-mix(in_oklab,var(--primary)_40%,transparent)]",
        className,
      )}
      style={{ boxShadow: "var(--shadow-depth)" }}
    >
      {children}
    </div>
  );
}
