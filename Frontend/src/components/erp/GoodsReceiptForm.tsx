import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/erp/Modal";
import type { DemoRecord } from "@/lib/mock-data";

export type GoodsReceiptInput = {
  requestId: string;
  quantity: number;
  date: string;
  notes: string;
};

type Props = {
  purchase: DemoRecord;
  saving: boolean;
  onSave: (receipt: GoodsReceiptInput) => void;
  onCancel: () => void;
};

export function GoodsReceiptForm({ purchase, saving, onSave, onCancel }: Props) {
  const requestId = useRef(crypto.randomUUID());
  const ordered = Number(purchase["quantity"] ?? 0);
  const previouslyReceived = Number(purchase["receivedQuantity"] ?? 0);
  const remaining = Number(purchase["pendingQuantity"] ?? ordered - previouslyReceived);
  const [quantity, setQuantity] = useState("");
  const receivingNow = Number(quantity || 0);
  const remainingAfterReceipt = Math.max(0, remaining - receivingNow);
  const exceedsRemaining = receivingNow > remaining;

  return (
    <form
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSave({
          requestId: requestId.current,
          quantity: receivingNow,
          date: String(formData.get("date") ?? ""),
          notes: String(formData.get("notes") ?? ""),
        });
      }}
    >
      <Field label="Purchase Order Reference" name="purchaseCode" value={purchase.id} readOnly />
      <Field label="Vendor" name="vendor" value={String(purchase["vendor"] ?? "")} readOnly />
      <Field label="Material" name="material" value={String(purchase["material"] ?? "")} readOnly />
      <Field
        label="Ordered Quantity"
        name="orderedQuantity"
        type="number"
        value={ordered}
        readOnly
      />
      <Field
        label="Previously Received Quantity"
        name="previouslyReceivedQuantity"
        type="number"
        value={previouslyReceived}
        readOnly
      />
      <Field
        label="Receiving Quantity Now"
        name="quantity"
        type="number"
        min={1}
        max={remaining}
        value={quantity}
        onChange={(event) => setQuantity(event.target.value)}
      />
      <Field
        label="Remaining Quantity"
        name="remainingQuantity"
        type="number"
        value={remainingAfterReceipt}
        readOnly
      />
      <Field
        label="Receiving Date"
        name="date"
        type="date"
        defaultValue={new Date().toISOString().slice(0, 10)}
      />
      <label className="text-xs text-muted-foreground sm:col-span-2">
        Notes (optional)
        <textarea
          name="notes"
          maxLength={2000}
          rows={3}
          className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
        />
      </label>
      {exceedsRemaining && (
        <p className="text-sm text-destructive sm:col-span-2" role="alert">
          Receiving quantity cannot exceed the remaining {remaining}.
        </p>
      )}
      <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="erp-primary"
          disabled={saving || !quantity || receivingNow <= 0 || exceedsRemaining}
        >
          <Check />
          {saving ? "Saving receipt…" : "Save receipt"}
        </Button>
      </div>
    </form>
  );
}
