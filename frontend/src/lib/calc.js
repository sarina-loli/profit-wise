/**
 * ProfitWise calculation engine.
 *
 * Monthly model: entered total cost is spread across its duration.
 *   profit = units * pricePerUnit - monthlyCost
 */

export const CALCULATOR_META = {
  profit: {
    slug: "profit",
    title: "Calculate Profit",
    short: "Profit",
    description: "Find monthly profit from units produced, price per unit and monthly cost.",
    resultLabel: "Total Profit",
  },
  units: {
    slug: "units",
    title: "Calculate Units for Target Profit",
    short: "Units for Target Profit",
    description: "Find how many units you must sell to reach a target profit.",
    resultLabel: "Units Required",
  },
  input_cost: {
    slug: "input-cost",
    title: "Calculate Input Cost for Target Profit",
    short: "Input Cost for Target Profit",
    description: "Find the maximum monthly input cost that still reaches a target profit.",
    resultLabel: "Monthly Input Cost",
  },
  price_per_unit: {
    slug: "price-per-unit",
    title: "Calculate Price per Unit for Target Profit",
    short: "Price per Unit for Target Profit",
    description: "Find the selling price per unit needed to reach a target profit.",
    resultLabel: "Price / Unit",
  },
};

export const SLUG_TO_TYPE = {
  profit: "profit",
  units: "units",
  "input-cost": "input_cost",
  "price-per-unit": "price_per_unit",
};

export const CALC_FIELDS = {
  profit: [
    { name: "units", label: "Units Produced / Sold", unit: "count", placeholder: "1000" },
    { name: "pricePerUnit", label: "Price per Unit", unit: "currency", placeholder: "25" },
    { name: "totalCost", label: "Total Cost", unit: "currency", placeholder: "1200" },
    { name: "duration", label: "Duration", unit: "count", placeholder: "12" },
    { name: "durationUnit", label: "Duration Unit", unit: "period", placeholder: "" },
  ],
  units: [
    { name: "targetProfit", label: "Target Profit", unit: "currency", placeholder: "50000" },
    { name: "pricePerUnit", label: "Price per Unit", unit: "currency", placeholder: "25" },
    { name: "totalCost", label: "Total Cost", unit: "currency", placeholder: "1200" },
    { name: "duration", label: "Duration", unit: "count", placeholder: "12" },
    { name: "durationUnit", label: "Duration Unit", unit: "period", placeholder: "" },
  ],
  input_cost: [
    { name: "targetProfit", label: "Target Profit", unit: "currency", placeholder: "50000" },
    { name: "units", label: "Units Produced / Sold", unit: "count", placeholder: "1000" },
    { name: "pricePerUnit", label: "Price per Unit", unit: "currency", placeholder: "25" },
  ],
  price_per_unit: [
    { name: "targetProfit", label: "Target Profit", unit: "currency", placeholder: "50000" },
    { name: "units", label: "Units Produced / Sold", unit: "count", placeholder: "1000" },
    { name: "totalCost", label: "Total Cost", unit: "currency", placeholder: "1200" },
    { name: "duration", label: "Duration", unit: "count", placeholder: "12" },
    { name: "durationUnit", label: "Duration Unit", unit: "period", placeholder: "" },
  ],
};

export function toMonthlyCost(totalCost, duration, durationUnit) {
  return totalCost / (duration * (durationUnit === 12 ? 12 : 1));
}

function monthlyCostOf(inputs) {
  const totalCost = inputs["totalCost"];
  return totalCost !== undefined
    ? toMonthlyCost(totalCost, inputs["duration"] ?? 1, inputs["durationUnit"] ?? 1)
    : (inputs["inputCostPerUnit"] ?? 0) * (inputs["units"] ?? 0);
}

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

export const formatNumber = (value, digits = 2) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(
    Number.isFinite(value) ? value : 0,
  );

/** Field-level validation; returns a map of field name -> message. */
export function validate(type, raw) {
  const errors = {};
  for (const field of CALC_FIELDS[type]) {
    const value = (raw[field.name] ?? "").trim();
    if (value === "") {
      errors[field.name] = `${field.label} is required`;
      continue;
    }
    if (field.unit === "period") {
      if (value !== "1" && value !== "12") errors[field.name] = "Choose months or years";
      continue;
    }
    const num = Number(value);
    if (!Number.isFinite(num)) {
      errors[field.name] = `${field.label} must be a number`;
      continue;
    }
    if (num <= 0 && field.name !== "targetProfit") {
      errors[field.name] = `${field.label} must be greater than 0`;
      continue;
    }
    if ((field.name === "units" || field.name === "duration") && !Number.isInteger(num)) {
      errors[field.name] = `${field.label} must be a whole number`;
    }
  }
  if (Object.keys(errors).length > 0) return errors;

  return errors;
}

/**
 * Validates one cost entry ({ totalCost, duration, durationUnit }) from the
 * "Add Additional Cost" rows. Returns a map of field name -> message.
 */
export function validateCostEntry(entry = {}) {
  const errors = {};
  const labels = { totalCost: "Total Cost", duration: "Duration", durationUnit: "Duration Unit" };

  for (const name of ["totalCost", "duration", "durationUnit"]) {
    const value = String(entry[name] ?? "").trim();
    if (value === "") {
      errors[name] = `${labels[name]} is required`;
      continue;
    }
    if (name === "durationUnit") {
      if (value !== "1" && value !== "12") errors[name] = "Choose months or years";
      continue;
    }
    const num = Number(value);
    if (!Number.isFinite(num)) {
      errors[name] = `${labels[name]} must be a number`;
    } else if (num <= 0) {
      errors[name] = `${labels[name]} must be greater than 0`;
    } else if (name === "duration" && !Number.isInteger(num)) {
      errors[name] = `${labels[name]} must be a whole number`;
    }
  }
  return errors;
}

export function compute(type, inputs) {
  const { units = 0, pricePerUnit = 0, targetProfit = 0 } = inputs;
  const monthlyCost = monthlyCostOf(inputs);

  switch (type) {
    case "profit": {
      const revenue = units * pricePerUnit;
      const profit = revenue - monthlyCost;
      return {
        result: profit,
        profit,
        details: [
          { label: "Total Revenue", value: formatCurrency(revenue) },
          { label: "Monthly Input Cost", value: formatCurrency(monthlyCost) },
          { label: "Profit per Unit", value: formatCurrency(units ? profit / units : 0) },
          {
            label: "Profit Margin",
            value: revenue > 0 ? `${formatNumber((profit / revenue) * 100, 1)}%` : "—",
          },
        ],
      };
    }
    case "units": {
      const required = (targetProfit + monthlyCost) / pricePerUnit;
      const whole = Math.ceil(required);
      const profit = whole * pricePerUnit - monthlyCost;
      return {
        result: whole,
        profit,
        details: [
          { label: "Monthly Input Cost", value: formatCurrency(monthlyCost) },
          { label: "Exact Units Needed", value: formatNumber(required) },
          { label: "Revenue at Target", value: formatCurrency(whole * pricePerUnit) },
          { label: "Profit at Rounded Units", value: formatCurrency(profit) },
        ],
      };
    }
    case "input_cost": {
      const maxCost = units * pricePerUnit - targetProfit;
      return {
        result: maxCost,
        profit: units * pricePerUnit - maxCost,
        details: [
          { label: "Target Profit", value: formatCurrency(targetProfit) },
          { label: "Required Profit per Unit", value: formatCurrency(targetProfit / units) },
          { label: "Total Allowed Input Cost / Month", value: formatCurrency(maxCost) },
          { label: "Total Revenue", value: formatCurrency(units * pricePerUnit) },
        ],
      };
    }
    case "price_per_unit": {
      const price = (monthlyCost + targetProfit) / units;
      return {
        result: price,
        profit: units * price - monthlyCost,
        details: [
          { label: "Target Profit", value: formatCurrency(targetProfit) },
          { label: "Required Profit per Unit", value: formatCurrency(targetProfit / units) },
          { label: "Total Revenue at This Price", value: formatCurrency(price * units) },
          { label: "Monthly Input Cost", value: formatCurrency(monthlyCost) },
        ],
      };
    }
  }
}

export function formatResult(type, value) {
  return type === "units" ? `${formatNumber(value, 0)} units` : formatCurrency(value);
}

export function describeInputs(type, inputs) {
  return CALC_FIELDS[type]
    .map((f) => {
      const v = inputs[f.name] ?? 0;
      return `${f.label}: ${f.unit === "currency" ? formatCurrency(v) : f.unit === "period" ? (v === 12 ? "Years" : "Months") : formatNumber(v, 0)}`;
    })
    .concat(
      inputs["totalCost"] !== undefined
        ? [`Monthly Cost: ${formatCurrency(monthlyCostOf(inputs))}`]
        : [],
    )
    .join(" · ");
}