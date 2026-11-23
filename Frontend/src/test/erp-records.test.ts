import { describe, expect, it } from "vitest";
import { filterRecords, moveStock, nextStatus, toCsv } from "@/lib/record-utils";
import { materials, vendors, customers, employees } from "@/lib/mock-data";
describe("ERP demo rules", () => {
  it("provides the 15 materials from the brief", () => expect(materials).toHaveLength(15));
  it("provides 5 vendors", () => expect(vendors).toHaveLength(5));
  it("provides 10 customers", () => expect(customers).toHaveLength(10));
  it("provides 10 employees", () => expect(employees).toHaveLength(10));
  it("adds received stock", () => expect(moveStock(1240, 300, "in")).toBe(1540));
  it("subtracts issued stock", () => expect(moveStock(1240, 300, "out")).toBe(940));
  it("prevents stock below zero", () =>
    expect(() => moveStock(10, 11, "out")).toThrow("Not enough stock available"));
  it("rejects zero quantity", () => expect(() => moveStock(10, 0, "in")).toThrow());
  it("advances an order to dispatch", () =>
    expect(nextStatus("Confirmed", ["Draft", "Confirmed", "Dispatched", "Delivered"])).toBe(
      "Dispatched",
    ));
  it("does not advance cancelled orders", () =>
    expect(
      nextStatus("Cancelled", ["Draft", "Confirmed", "Dispatched", "Delivered"]),
    ).toBeUndefined());
  it("filters by search and status together", () =>
    expect(
      filterRecords(
        [
          { id: "1", name: "ACC", status: "Active" },
          { id: "2", name: "ACC", status: "Inactive" },
        ],
        "acc",
        "Active",
      ),
    ).toEqual([{ id: "1", name: "ACC", status: "Active" }]));
  it("escapes quotes in CSV exports", () =>
    expect(toCsv([{ id: "1", name: 'Steel "A"' }], ["name"])).toBe('"name"\n"Steel ""A"""'));
});
