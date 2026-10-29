import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Boxes, Coins, Tag, TrendingUp } from "lucide-react";
import { PageShell, PremiumCard } from "@/components/PageShell";
import { Reveal } from "@/components/Reveal";
import { getMyProfile } from "@/lib/api/profiles";
import { CALCULATOR_META } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ProfitWise Manufacturing" },
      {
        name: "description",
        content:
          "Choose a manufacturing calculation: profit, units, input cost or price per unit for a target profit.",
      },
      { property: "og:title", content: "Dashboard — ProfitWise Manufacturing" },
      {
        property: "og:description",
        content: "Pick one of four calculators to work out your manufacturing profit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

// Order and icons for the four calculation buttons; titles/descriptions come from CALCULATOR_META.
const CALCULATOR_BUTTONS = [
  { type: "profit", icon: TrendingUp },
  { type: "units", icon: Boxes },
  { type: "input_cost", icon: Coins },
  { type: "price_per_unit", icon: Tag },
];

function Dashboard() {
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });

  return (
    <PageShell
      eyebrow="Dashboard"
      title={`Welcome back${profileQuery.data?.company_name ? `, ${profileQuery.data.company_name}` : ""}.`}
      subtitle="Choose a calculation to get started."
      actions={
        <Link
          to="/history"
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors duration-300 hover:border-primary hover:text-primary"
        >
          View history <ArrowRight className="size-4" />
        </Link>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {CALCULATOR_BUTTONS.map(({ type, icon: Icon }, i) => {
          const meta = CALCULATOR_META[type];
          return (
            <Reveal key={type} delay={i * 80}>
              <Link
                to="/calculator/$slug"
                params={{ slug: meta.slug }}
                className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <PremiumCard className="flex h-full flex-col gap-5 p-6 sm:p-7">
                  <span
                    className="flex size-11 items-center justify-center rounded-xl text-primary-foreground transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                    style={{ background: "var(--gradient-amber)", boxShadow: "var(--glow-amber)" }}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="flex-1">
                    <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                      {meta.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                    Open calculator
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </PremiumCard>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </PageShell>
  );
}
