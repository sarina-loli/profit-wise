import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Save, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { PremiumCard } from "@/components/PageShell";
import { Reveal } from "@/components/Reveal";
import { saveCalculation } from "@/lib/api/calculations";
import {
  CALCULATOR_META,
  CALC_FIELDS,
  compute,
  describeInputs,
  formatResult,
  toMonthlyCost,
  validate,
  validateCostEntry,
} from "@/lib/calc";
import { cn } from "@/lib/utils";

const COST_FIELDS = ["totalCost", "duration", "durationUnit"];
const EMPTY_COST = { totalCost: "", duration: "", durationUnit: "" };
const fieldClass = (hasError) =>
  cn(
    "mt-2 w-full rounded-xl border bg-secondary/60 px-4 py-3 text-sm outline-none transition-all duration-300 focus:border-primary focus:bg-secondary",
    hasError ? "border-destructive" : "border-input",
  );
const labelClass = "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";

/** Total Cost, Duration and Duration Unit, side by side in one row. */
function CostRow({ values, errors, onChange, fields }) {
  return (
    <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 sm:gap-3">
      {fields.map((field) => (
        <label key={field.name} className="block min-w-0">
          <span className="text-[0.6rem] font-medium uppercase tracking-[0.08em] text-muted-foreground sm:text-xs sm:tracking-[0.18em]">
            {field.label}
            {field.unit === "currency" ? " ($)" : ""}
          </span>
          {field.unit === "period" ? (
            <select
              value={values[field.name] ?? ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              className={cn(fieldClass(errors[field.name]), "px-2 sm:px-4")}
            >
              <option value="" disabled>
                Select
              </option>
              <option value="1">Months</option>
              <option value="12">Years</option>
            </select>
          ) : (
            <input
              type="number"
              step={field.name === "duration" ? "1" : "any"}
              min="0.000001"
              inputMode="decimal"
              placeholder={field.placeholder}
              value={values[field.name] ?? ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              className={cn(fieldClass(errors[field.name]), "px-2 sm:px-4")}
            />
          )}
          {errors[field.name] ? (
            <span className="mt-1.5 block text-xs text-destructive">{errors[field.name]}</span>
          ) : null}
        </label>
      ))}
    </div>
  );
}

/**
 * One calculator: input form + result card.
 * `stacked` puts the result under the form (used in the narrow dashboard column).
 */
export function Calculator({ type, stacked = false }) {
  const meta = CALCULATOR_META[type];
  const fields = CALC_FIELDS[type];
  const otherFields = fields.filter((f) => !COST_FIELDS.includes(f.name));
  const costFields = fields.filter((f) => COST_FIELDS.includes(f.name));
  const queryClient = useQueryClient();

  const [raw, setRaw] = useState({});
  const [extraCosts, setExtraCosts] = useState([]);
  const [errors, setErrors] = useState({});
  const [extraErrors, setExtraErrors] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: saveCalculation,
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["calculations"] });
      toast.success("Calculation saved to your history.");
    },
    onError: () => toast.error("Could not save the calculation. Please try again."),
  });

  const setExtra = (i, name, value) =>
    setExtraCosts((list) => list.map((c, idx) => (idx === i ? { ...c, [name]: value } : c)));
  const removeExtra = (i) => {
    setExtraCosts((list) => list.filter((_, idx) => idx !== i));
    setExtraErrors([]);
  };

  function onCalculate(e) {
    e.preventDefault();
    const nextErrors = validate(type, raw);
    const nextExtraErrors = extraCosts.map(validateCostEntry);
    setErrors(nextErrors);
    setExtraErrors(nextExtraErrors);
    if (
      Object.keys(nextErrors).length > 0 ||
      nextExtraErrors.some((er) => Object.keys(er).length > 0)
    ) {
      setOutcome(null);
      return;
    }
    const inputs = {};
    for (const f of fields) inputs[f.name] = Number(raw[f.name]);

    // Extra cost entries are folded into one monthly figure (1 month duration)
    // so the saved calculation keeps the same shape the API already accepts.
    if (extraCosts.length > 0) {
      const entries = [raw, ...extraCosts];
      inputs.totalCost = entries.reduce(
        (sum, c) =>
          sum + toMonthlyCost(Number(c.totalCost), Number(c.duration), Number(c.durationUnit)),
        0,
      );
      inputs.duration = 1;
      inputs.durationUnit = 1;
    }
    setOutcome({ ...compute(type, inputs), inputs });
    setSaved(false);
  }

  function onReset() {
    setRaw({});
    setExtraCosts([]);
    setErrors({});
    setExtraErrors([]);
    setOutcome(null);
    setSaved(false);
  }

  return (
    <div className={cn("grid gap-5", !stacked && "lg:grid-cols-5")}>
      <Reveal className={cn(!stacked && "lg:col-span-2")}>
        <PremiumCard>
          <form onSubmit={onCalculate} className="space-y-4" noValidate>
            {otherFields.map((field) => (
              <label key={field.name} className="block">
                <span className={labelClass}>
                  {field.label}
                  {field.unit === "currency" ? " ($)" : ""}
                </span>
                <input
                  type="number"
                  step={field.name === "units" ? "1" : "any"}
                  min={field.name === "targetProfit" ? undefined : "0.000001"}
                  inputMode="decimal"
                  placeholder={field.placeholder}
                  value={raw[field.name] ?? ""}
                  onChange={(e) => setRaw((s) => ({ ...s, [field.name]: e.target.value }))}
                  className={fieldClass(errors[field.name])}
                />
                {errors[field.name] ? (
                  <span className="mt-1.5 block text-xs text-destructive">
                    {errors[field.name]}
                  </span>
                ) : null}
              </label>
            ))}

            {costFields.length > 0 ? (
              <div className="space-y-4">
                <CostRow
                  fields={costFields}
                  values={raw}
                  errors={errors}
                  onChange={(name, value) => setRaw((s) => ({ ...s, [name]: value }))}
                />
                {extraCosts.map((cost, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Additional Cost {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeExtra(i)}
                        aria-label={`Remove additional cost ${i + 1}`}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <CostRow
                      fields={costFields}
                      values={cost}
                      errors={extraErrors[i] ?? {}}
                      onChange={(name, value) => setExtra(i, name, value)}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setExtraCosts((list) => [...list, { ...EMPTY_COST }])}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors duration-300 hover:border-primary hover:text-primary"
                >
                  <Plus className="size-3.5" /> Add Additional Cost
                </button>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-display text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99]"
                style={{ background: "var(--gradient-amber)", boxShadow: "var(--glow-amber)" }}
              >
                <Sparkles className="size-4" /> Calculate
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-xl border border-border px-5 py-3.5 text-sm font-medium transition-colors duration-300 hover:border-primary hover:text-primary"
              >
                Reset
              </button>
            </div>
          </form>
        </PremiumCard>
      </Reveal>

      <div className={cn(!stacked && "lg:col-span-3")}>
        {outcome ? (
          <div className="pw-reveal pw-reveal-in">
            <PremiumCard>
              <p className="text-[0.62rem] uppercase tracking-[0.32em] text-muted-foreground">
                {meta.resultLabel}
              </p>
              <p className="mt-3 font-display text-4xl font-semibold tracking-tight text-amber-gradient sm:text-5xl">
                {formatResult(type, outcome.result)}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {describeInputs(type, outcome.inputs)}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {outcome.details.map((d) => (
                  <div
                    key={d.label}
                    className="rounded-xl border border-border bg-secondary/40 px-4 py-3"
                  >
                    <p className="text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">
                      {d.label}
                    </p>
                    <p className="mt-1.5 font-display text-base font-semibold">{d.value}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() =>
                  saveMutation.mutate({
                    type,
                    inputs: outcome.inputs,
                    result: outcome.result,
                    profit: outcome.profit,
                  })
                }
                disabled={saveMutation.isPending || saved}
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium transition-all duration-300 hover:border-primary hover:text-primary disabled:opacity-60"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {saved ? "Saved to history" : "Save Calculation"}
              </button>
            </PremiumCard>
          </div>
        ) : stacked ? null : (
          <PremiumCard className="flex h-full min-h-56 items-center justify-center text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              Enter your figures and your result card appears here, with the full breakdown.
            </p>
          </PremiumCard>
        )}
      </div>
    </div>
  );
}
