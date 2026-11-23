import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PurchaseOrderForm } from "@/components/erp/PurchaseOrderForm";
import type { DemoRecord, Material } from "@/lib/mock-data";

describe("PurchaseOrderForm", () => {
  it("uses saved vendor and material data and calculates the amount", () => {
    const onSave = vi.fn();
    const vendor: DemoRecord = {
      id: "VEN-001",
      name: "UltraTech Ltd",
      contact: "Anil Desai",
      email: "anil@example.com",
      phone: "9876501001",
      status: "Active",
    };
    const material: Material = {
      id: "MAT-001",
      name: "OPC Cement",
      category: "Cement",
      unit: "bags",
      stock: 120,
      transit: 10,
      reorder: 20,
      price: 410,
      vendor: "UltraTech Ltd",
    };

    render(
      <PurchaseOrderForm
        edit="new"
        vendors={[vendor]}
        materials={[material]}
        loading={false}
        loadError={null}
        onRetry={() => {}}
        onSave={onSave}
        onCancel={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText("Vendor"), { target: { value: vendor["name"] } });
    fireEvent.change(screen.getByLabelText("Material"), { target: { value: material.name } });
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "3" } });

    const amountInput = screen.getByLabelText("Amount (₹)") as HTMLInputElement;
    expect(amountInput.value).toBe("1230");
    expect(screen.getByText(/Anil Desai/)).toBeTruthy();
    expect(screen.getByText(/Current stock: 120 bags/)).toBeTruthy();
    expect(screen.getByText(/Saved supplier: UltraTech Ltd/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Save purchase order" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        vendor: "UltraTech Ltd",
        material: "OPC Cement",
        quantity: 3,
        amount: 1230,
      }),
    );
  });
});
