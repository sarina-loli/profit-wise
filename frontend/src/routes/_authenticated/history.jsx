import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Eye, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell, PremiumCard } from "@/components/PageShell";
import { Reveal } from "@/components/Reveal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteCalculation, listCalculations } from "@/lib/api/calculations";
import { CALCULATOR_META, CALC_FIELDS, compute, describeInputs, formatResult } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — ProfitWise Manufacturing" },
      {
        name: "description",
        content:
          "Every saved calculation with its date, type, inputs and result — view or delete any record.",
      },
      { property: "og:title", content: "History — ProfitWise Manufacturing" },
      {
        property: "og:description",
        content: "Review and manage your saved manufacturing profit calculations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: History,
});

function History() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["calculations"], queryFn: listCalculations });
  const [viewing, setViewing] = useState(null);

  const removeMutation = useMutation({
    mutationFn: deleteCalculation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculations"] });
      toast.success("Calculation deleted.");
    },
    onError: () => toast.error("Could not delete that calculation."),
  });

  const rows = data ?? [];

  return (
    <PageShell
      eyebrow="History"
      title="Saved calculations"
      subtitle="A complete record of every result you've saved."
    >
      <Reveal>
        <PremiumCard className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary/60" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
              <p className="font-display text-lg font-semibold">No calculations yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Run one of the four calculators and save the result — it will appear here.
              </p>
              <Link
                to="/dashboard"
                className="rounded-full px-5 py-2.5 font-display text-sm font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-amber)" }}
              >
                Open calculators
              </Link>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Date", "Calculation Type", "Inputs", "Result", ""].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-4 text-[0.6rem] font-medium uppercase tracking-[0.28em] text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/60 transition-colors duration-300 last:border-0 hover:bg-secondary/40"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                        {new Date(row.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-medium">
                        {CALCULATOR_META[row.type].short}
                      </td>
                      <td className="max-w-xs truncate px-5 py-4 text-muted-foreground">
                        {describeInputs(row.type, row.inputs)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-display font-semibold text-primary">
                        {formatResult(row.type, Number(row.result))}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewing(row)}
                            aria-label="View calculation"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs transition-colors duration-300 hover:border-primary hover:text-primary"
                          >
                            <Eye className="size-3.5" /> View
                          </button>
                          <button
                            onClick={() => removeMutation.mutate(row.id)}
                            disabled={removeMutation.isPending}
                            aria-label="Delete calculation"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-300 hover:border-destructive hover:text-destructive disabled:opacity-60"
                          >
                            {removeMutation.isPending && removeMutation.variables === row.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PremiumCard>
      </Reveal>

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewing ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">
                  {CALCULATOR_META[viewing.type].title}
                </DialogTitle>
                <DialogDescription>
                  {new Date(viewing.created_at).toLocaleString("en-US")}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border border-border bg-secondary/40 px-5 py-4">
                <p className="text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">
                  {CALCULATOR_META[viewing.type].resultLabel}
                </p>
                <p className="mt-1.5 font-display text-2xl font-semibold text-amber-gradient">
                  {formatResult(viewing.type, Number(viewing.result))}
                </p>
              </div>

              <div className="space-y-2">
                {CALC_FIELDS[viewing.type].map((f) => (
                  <div key={f.name} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-medium">
                      {describeInputs(viewing.type, {
                        [f.name]: viewing.inputs[f.name] ?? 0,
                      })
                        .split(": ")
                        .slice(1)
                        .join(": ") || "—"}
                    </span>
                  </div>
                ))}
                {compute(viewing.type, viewing.inputs).details.map((d) => (
                  <div key={d.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{d.label}</span>
                    <span className="font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
