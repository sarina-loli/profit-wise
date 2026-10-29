import { apiFetch } from "@/lib/api/client";

export function listCalculations() {
  return apiFetch("/calculations/");
}

export function saveCalculation(input) {
  return apiFetch("/calculations/", {
    method: "POST",
    body: {
      type: input.type,
      inputs: input.inputs,
      result: input.result,
      profit: input.profit,
    },
  });
}

export function deleteCalculation(id) {
  return apiFetch(`/calculations/${id}/`, { method: "DELETE" });
}
