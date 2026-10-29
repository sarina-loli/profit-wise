import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Calculator } from "@/components/Calculator";
import { CALCULATOR_META, SLUG_TO_TYPE } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/calculator/$slug")({
  beforeLoad: ({ params }) => {
    if (!SLUG_TO_TYPE[params.slug]) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Calculator — ProfitWise Manufacturing" },
      {
        name: "description",
        content:
          "Run a manufacturing profit calculation and save the result to your company history.",
      },
      { property: "og:title", content: "Calculator — ProfitWise Manufacturing" },
      {
        property: "og:description",
        content: "Calculate profit, units, input cost or price per unit in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  const { slug } = useParams({ from: "/_authenticated/calculator/$slug" });
  const type = SLUG_TO_TYPE[slug];
  const meta = CALCULATOR_META[type];

  return (
    <PageShell
      eyebrow="Calculator"
      title={meta.title}
      subtitle={meta.description}
      actions={
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors duration-300 hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Dashboard
        </Link>
      }
    >
      <Calculator key={type} type={type} />
    </PageShell>
  );
}
