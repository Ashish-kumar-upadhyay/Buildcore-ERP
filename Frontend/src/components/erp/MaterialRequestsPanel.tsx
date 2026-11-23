import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Plus, X } from "lucide-react";
import { Panel, Pill } from "./AppShell";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type MaterialRequest = {
  id: string;
  requesterName: string;
  company: string;
  material: string;
  quantity: number;
  unit: string;
  notes: string;
  status: "Pending" | "Approved" | "Cancelled";
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
};

type MaterialOption = {
  id: string;
  name: string;
  unit: string;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export function MaterialRequestsPanel({ admin }: { admin: boolean }) {
  const [rows, setRows] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(!admin);
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [company, setCompany] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let active = true;
    const load = () => {
      api<{ rows: MaterialRequest[] }>("/material-requests")
        .then((result) => {
          if (active) setRows(result.rows);
        })
        .catch((error: unknown) => {
          toast.error(error instanceof Error ? error.message : "Unable to load material requests");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };
    load();
    const refresh = window.setInterval(load, 15000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, []);

  useEffect(() => {
    if (admin) return;
    let active = true;
    api<{ rows: MaterialOption[] }>("/material-requests/material-options")
      .then((result) => {
        if (active) setMaterials(result.rows);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Unable to load material options");
      })
      .finally(() => {
        if (active) setLoadingMaterials(false);
      });
    return () => {
      active = false;
    };
  }, [admin]);

  const selectedMaterial = materials.find((item) => item.id === materialId);

  const shown = useMemo(
    () => rows.filter((row) => filter === "All" || row.status === filter),
    [filter, rows],
  );

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await api<{ row: MaterialRequest }>("/material-requests", {
        method: "POST",
        body: JSON.stringify({ company, materialId, quantity: Number(quantity), notes }),
      });
      setRows((current) => [result.row, ...current]);
      setCompany("");
      setMaterialId("");
      setQuantity("");
      setNotes("");
      toast.success(`Request ${result.row.id} sent to Admin for approval`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit material request");
    } finally {
      setSubmitting(false);
    }
  };

  const review = async (row: MaterialRequest, status: "Approved" | "Cancelled") => {
    setReviewing(row.id);
    try {
      const result = await api<{ row: MaterialRequest }>(
        `/material-requests/${encodeURIComponent(row.id)}/status`,
        { method: "PATCH", body: JSON.stringify({ status }) },
      );
      setRows((current) => current.map((item) => (item.id === row.id ? result.row : item)));
      toast.success(`${row.id} ${status.toLowerCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to review material request");
    } finally {
      setReviewing(null);
    }
  };

  return (
    <div className="space-y-5">
      {!admin && (
        <Panel title="Create material request">
          <form onSubmit={(event) => void submit(event)} className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-muted-foreground">
              Company / project
              <input
                required
                maxLength={120}
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Company requiring the material"
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Material / product
              <select
                required
                value={materialId}
                onChange={(event) => setMaterialId(event.target.value)}
                disabled={loadingMaterials || materials.length === 0}
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">
                  {loadingMaterials
                    ? "Loading materials…"
                    : materials.length
                      ? "Select a material or product"
                      : "No saved materials available"}
                </option>
                {materials.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.unit ? `(${item.unit})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Quantity
              <input
                required
                type="number"
                min="0.001"
                step="any"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Unit
              <input
                required
                readOnly
                value={selectedMaterial?.unit || "pcs"}
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              />
            </label>
            <label className="text-xs text-muted-foreground sm:col-span-2">
              Notes (optional)
              <textarea
                maxLength={1000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <div className="flex justify-end sm:col-span-2">
              <Button
                type="submit"
                className="erp-primary"
                disabled={submitting || loadingMaterials || materials.length === 0}
              >
                <Plus />
                {submitting ? "Sending…" : "Send request"}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel
        title={admin ? "Material request history" : "My material requests"}
        action={
          admin ? (
            <div className="flex flex-wrap gap-2">
              {["All", "Pending", "Approved", "Cancelled"].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={filter === status ? "default" : "outline"}
                  onClick={() => setFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          ) : (
            <Pill tone="info">{rows.length} requests</Pill>
          )
        }
      >
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading requests…</p>
        ) : shown.length ? (
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  {admin && <th>Requested by</th>}
                  <th>Company / project</th>
                  <th>Material / product</th>
                  <th>Quantity</th>
                  <th>Notes</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  {admin && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {shown.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs">{row.id}</td>
                    {admin && <td>{row.requesterName}</td>}
                    <td>{row.company}</td>
                    <td>{row.material}</td>
                    <td>{row.quantity} {row.unit}</td>
                    <td>{row.notes || "—"}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>
                      <Pill
                        tone={
                          row.status === "Approved"
                            ? "success"
                            : row.status === "Cancelled"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {row.status}
                      </Pill>
                      {row.reviewedBy && (
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          by {row.reviewedBy}
                        </div>
                      )}
                    </td>
                    {admin && (
                      <td>
                        {row.status === "Pending" ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={reviewing === row.id}
                              onClick={() => void review(row, "Approved")}
                            >
                              <Check />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={reviewing === row.id}
                              onClick={() => void review(row, "Cancelled")}
                            >
                              <X />
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {row.reviewedAt ? formatDate(row.reviewedAt) : "Reviewed"}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="erp-empty">
            <p>No material requests {filter === "All" ? "yet" : `with status ${filter}`}.</p>
          </div>
        )}
      </Panel>
    </div>
  );
}
