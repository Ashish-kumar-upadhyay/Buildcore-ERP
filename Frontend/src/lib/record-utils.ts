import type { DemoRecord } from "./mock-data";
export function moveStock(stock: number, quantity: number, direction: "in" | "out"): number {
  if (!Number.isFinite(quantity) || quantity <= 0)
    throw new Error("Enter a quantity greater than zero");
  if (direction === "out" && quantity > stock) throw new Error("Not enough stock available");
  return stock + (direction === "in" ? quantity : -quantity);
}
export function nextStatus(current: string, workflow: string[]): string | undefined {
  const index = workflow.indexOf(current);
  return index < 0 ? undefined : workflow[index + 1];
}
export function filterRecords(rows: DemoRecord[], query: string, status: string): DemoRecord[] {
  return rows.filter(
    (row) =>
      (status === "All" || row["status"] === status) &&
      Object.values(row).some((v) => String(v).toLowerCase().includes(query.toLowerCase())),
  );
}
export function toCsv(rows: DemoRecord[], keys: string[]): string {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  return [
    keys.map(escape).join(","),
    ...rows.map((row) => keys.map((key) => escape(row[key] ?? "")).join(",")),
  ].join("\n");
}
