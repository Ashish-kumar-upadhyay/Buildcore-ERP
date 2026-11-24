import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/erp/Modal";
import type { DemoRecord, Material } from "@/lib/mock-data";

type Props = {
  edit: DemoRecord | "new";
  vendors: DemoRecord[];
  materials: Material[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  onSave: (record: DemoRecord) => void;
  onCancel: () => void;
};

export function PurchaseOrderForm({
  edit,
  vendors,
  materials,
  loading,
  loadError,
  onRetry,
  onSave,
  onCancel,
}: Props) {
  const existing = edit === "new" ? null : edit;
  const [vendor, setVendor] = useState(String(existing?.["vendor"] ?? ""));
  const [materialName, setMaterialName] = useState(String(existing?.["material"] ?? ""));
  const [quantity, setQuantity] = useState(String(existing?.["quantity"] ?? ""));
  const [amount, setAmount] = useState(String(existing?.["amount"] ?? ""));
  const selectedVendor = vendors.find((row) => row["name"] === vendor);
  const selectedMaterial = materials.find((row) => row.name === materialName);
  const unavailable = loading || loadError !== null || !vendors.length || !materials.length;

  return (
    <form
      key={edit === "new" ? "new" : edit.id}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSave({
          id: edit === "new" ? `PO-${Date.now().toString().slice(-7)}` : edit.id,
          vendor,
          material: materialName,
          quantity: Number(quantity),
          amount: Number(amount),
          date: String(formData.get("date") ?? ""),
          status: String(existing?.["status"] ?? "Draft"),
        });
      }}
    >
      <label className="text-xs text-muted-foreground">
        Vendor
        <Select
          required
          name="vendor"
          value={vendor}
          disabled={unavailable}
          onValueChange={setVendor}
        >
          <SelectTrigger aria-label="Vendor" className="erp-select mt-1.5 w-full">
            <SelectValue placeholder={loading ? "Loading vendors…" : "Select a vendor"} />
          </SelectTrigger>
          <SelectContent>
            {vendors.map((row) => (
              <SelectItem key={row.id} value={String(row["name"])}>
                {row["name"]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="text-xs text-muted-foreground">
        Material
        <Select
          required
          name="material"
          value={materialName}
          disabled={unavailable}
          onValueChange={(name) => {
            const material = materials.find((row) => row.name === name);
            setMaterialName(name);
            if (material) setAmount(String(material.price * Number(quantity || 0)));
          }}
        >
          <SelectTrigger aria-label="Material" className="erp-select mt-1.5 w-full">
            <SelectValue placeholder={loading ? "Loading materials…" : "Select a material"} />
          </SelectTrigger>
          <SelectContent>
            {materials.map((material) => (
              <SelectItem key={material.id} value={material.name}>
                {material.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      {selectedVendor && (
        <p className="text-xs text-muted-foreground sm:col-span-2">
          {String(selectedVendor["contact"] ?? "")}
          {selectedVendor["phone"] ? ` · ${selectedVendor["phone"]}` : ""}
          {selectedVendor["email"] ? ` · ${selectedVendor["email"]}` : ""}
        </p>
      )}
      {selectedMaterial && (
        <p className="text-xs text-muted-foreground sm:col-span-2">
          {selectedMaterial.category} · ₹{selectedMaterial.price.toLocaleString("en-IN")} /{" "}
          {selectedMaterial.unit} · Current stock: {selectedMaterial.stock.toLocaleString("en-IN")}{" "}
          {selectedMaterial.unit}
          {selectedMaterial.vendor ? ` · Saved supplier: ${selectedMaterial.vendor}` : ""}
        </p>
      )}
      <Field
        label="Quantity"
        name="quantity"
        type="number"
        min={1}
        value={quantity}
        onChange={(event) => {
          const value = event.target.value;
          setQuantity(value);
          if (selectedMaterial) setAmount(String(selectedMaterial.price * Number(value || 0)));
        }}
      />
      <Field
        label="Amount (₹)"
        name="amount"
        type="number"
        step="0.01"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      <Field
        label="Order date"
        name="date"
        type="date"
        defaultValue={String(existing?.["date"] ?? "") || new Date().toISOString().slice(0, 10)}
      />
      {loadError && (
        <div className="text-sm text-destructive sm:col-span-2" role="alert">
          Unable to load saved vendors and materials: {loadError}
          <Button type="button" variant="outline" className="ml-3" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
      {!loading && !loadError && (!vendors.length || !materials.length) && (
        <p className="text-sm text-muted-foreground sm:col-span-2" role="status">
          Add at least one saved vendor and one saved material before creating a purchase order.
        </p>
      )}
      <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="erp-primary" disabled={unavailable}>
          <Check />
          Save purchase order
        </Button>
      </div>
    </form>
  );
}
