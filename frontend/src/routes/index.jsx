import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { getToken } from "@/lib/api/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProfitWise  — Profit Management" },
      {
        name: "description",
        content:
          "ProfitWise Manufacturing turns production data into clear, controlled profit. Scroll into the story and get started.",
      },
      { property: "og:title", content: "ProfitWise Manufacturing — Profit Management" },
      {
        property: "og:description",
        content:
          "Cinematic profit management for manufacturers. See margin, cost and output in one clear view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  // Static values: the home page is one complete screen, not scroll-driven.
  const p = 0;
  const intro = 1;
  const focus = 0;

  // Logged in -> dashboard, otherwise -> login.
  const onGetStarted = () => navigate({ to: getToken() ? "/dashboard" : "/login" });

  const particles = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: (i * 37.6) % 100,
        bottom: -((i * 53) % 40),
        size: 1 + ((i * 7) % 3),
        delay: (i * 0.73) % 9,
        duration: 9 + ((i * 3.1) % 9),
        depth: -180 + ((i * 61) % 340),
      })),
    [],
  );

  return (
    <main className="relative min-h-screen" style={{ background: "var(--gradient-void)" }}>
      {/* Fixed cinematic stage */}
      <div
        className="stage-3d pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Deep horizon glow */}
        <div
          className="layer-3d absolute left-1/2 top-1/2 h-[120vmax] w-[120vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--primary) 22%, transparent) 0%, transparent 60%)",
            opacity: 0.35 + focus * 0.45,
            transform: `translate(-50%,-50%) translate3d(0, ${-p * 60}px, 0) scale(${0.75 + intro * 0.25 + focus * 0.25})`,
            filter: `blur(${40 - focus * 10}px)`,
          }}
        />

        {/* Perspective grid floor — factory plane */}
        <div
          className="layer-3d absolute inset-x-[-40%] bottom-[-10%] h-[70vh] origin-bottom"
          style={{
            transform: `rotateX(${72 - intro * 10}deg) translate3d(0, ${-p * 140}px, 0)`,
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklab, var(--primary) 26%, transparent) 1px, transparent 1px), linear-gradient(to top, color-mix(in oklab, var(--primary) 20%, transparent) 1px, transparent 1px)",
            backgroundSize: "7% 12%",
            backgroundPosition: `0 ${p * 400}px`,
            maskImage: "linear-gradient(to top, black, transparent 78%)",
            WebkitMaskImage: "linear-gradient(to top, black, transparent 78%)",
            opacity: 0.35 + intro * 0.25,
          }}
        />

        {/* Floating profit slabs */}
        {[
          { x: -34, y: -18, z: -260, r: -14, s: 1.15 },
          { x: 33, y: -26, z: -190, r: 12, s: 0.95 },
          { x: -26, y: 22, z: -120, r: 9, s: 0.8 },
          { x: 29, y: 20, z: -320, r: -8, s: 1.3 },
        ].map((s, i) => (
          <div
            key={i}
            className="pw-float layer-3d absolute left-1/2 top-1/2"
            style={{
              animationDelay: `${i * 1.6}s`,
              transform: `translate3d(calc(-50% + ${s.x}vw), calc(-50% + ${s.y}vh + ${-p * (90 + i * 50)}px), ${s.z + intro * 160}px)`,
              opacity: 0.5 - focus * 0.35,
            }}
          >
            <div
              className="rounded-2xl border backdrop-blur-sm"
              style={{
                width: `${9 * s.s}rem`,
                height: `${5.5 * s.s}rem`,
                transform: `rotate(${s.r}deg)`,
                background:
                  "linear-gradient(140deg, color-mix(in oklab, var(--card) 80%, transparent), transparent)",
                boxShadow: "var(--shadow-depth)",
              }}
            />
          </div>
        ))}

        {/* Particles */}
        {particles.map((s, i) => (
          <span
            key={i}
            className="pw-particle absolute rounded-full"
            style={{
              left: `${s.left}%`,
              bottom: `${s.bottom}%`,
              width: s.size,
              height: s.size,
              background: "color-mix(in oklab, var(--primary) 80%, white)",
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
              transform: `translate3d(0, 0, ${s.depth}px)`,
              opacity: 0.5,
            }}
          />
        ))}

        {/* Vignette / light transition */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 60% at 50% 50%, transparent 30%, oklch(0.1 0.02 295 / 0.85) 100%)",
            opacity: 0.6 + focus * 0.3,
          }}
        />
      </div>

      {/* Home content: title, headline, copy and button together */}
      <div className="relative flex min-h-screen items-center justify-center px-6 py-28">
        <div className="w-full max-w-2xl text-center">
          <p className="text-[0.7rem] uppercase tracking-[0.42em] text-muted-foreground sm:text-xs">
            ProfitWise 
          </p>

          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Every unit you make,
            <br />
            <span className="text-amber-gradient">measured in profit.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
           ProfitWise gives businesses a clear view of costs, pricing, and profit — so every decision is guided by real numbers instead of guesswork.  </p>

          {/* Get Started */}
          <div className="relative mt-12 inline-flex">
            <span
              className="pw-ring absolute inset-0 rounded-full"
              style={{ background: "var(--gradient-amber)", opacity: 0.6, filter: "blur(2px)" }}
            />
            <button
              type="button"
              onClick={onGetStarted}
              className="pw-sweep relative overflow-hidden rounded-full px-9 py-4 font-display text-base font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.05] active:scale-[0.98] sm:text-lg"
              style={{ background: "var(--gradient-amber)", boxShadow: "var(--glow-amber)" }}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
