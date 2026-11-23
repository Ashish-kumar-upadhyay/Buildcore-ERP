import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GoodsReceiptForm, type GoodsReceiptInput } from "@/components/erp/GoodsReceiptForm";
import type { DemoRecord } from "@/lib/mock-data";

const purchase: DemoRecord = {
  id: "PO-123",
  vendor: "UltraTech Ltd",
  material: "Cement",
  quantity: 100,
  receivedQuantity: 60,
  pendingQuantity: 40,
  amount: 41000,
  date: "2026-11-23",
  status: "Partially Received",
};

describe("GoodsReceiptForm", () => {
  it("shows remaining quantity and submits the partial receipt data", () => {
    const onSave = vi.fn<(receipt: GoodsReceiptInput) => void>();
    render(
      <GoodsReceiptForm purchase={purchase} saving={false} onSave={onSave} onCancel={() => {}} />,
    );

    fireEvent.change(screen.getByLabelText("Receiving Quantity Now"), {
      target: { value: "25" },
    });
    expect((screen.getByLabelText("Remaining Quantity") as HTMLInputElement).value).toBe("15");

    fireEvent.change(screen.getByLabelText("Notes (optional)"), {
      target: { value: "Delivery note" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save receipt" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 25,
        notes: "Delivery note",
      }),
    );
    expect(onSave.mock.calls[0]?.[0].requestId).toBeTruthy();
  });

  it("blocks a receipt larger than the pending quantity", () => {
    render(
      <GoodsReceiptForm purchase={purchase} saving={false} onSave={() => {}} onCancel={() => {}} />,
    );

    fireEvent.change(screen.getByLabelText("Receiving Quantity Now"), {
      target: { value: "41" },
    });

    expect(screen.getByRole("alert").textContent).toContain("cannot exceed the remaining 40");
    expect(screen.getByRole("button", { name: "Save receipt" }).hasAttribute("disabled")).toBe(
      true,
    );
  });
});
