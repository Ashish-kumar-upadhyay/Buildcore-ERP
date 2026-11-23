import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DemoRecord } from "@/lib/mock-data";

export function PurchaseOrderDetails({ purchase }: { purchase: DemoRecord }) {
  const [receipts, setReceipts] = useState<DemoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    api<{ rows: DemoRecord[] }>(`/records/purchases/${encodeURIComponent(purchase.id)}/receipts`)
      .then((data) => {
        if (live) setReceipts(data.rows);
      })
      .catch((cause: unknown) => {
        if (live) {
          setError(cause instanceof Error ? cause.message : "Unable to load receiving history");
        }
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [purchase.id, attempt]);

  return (
    <section className="mt-5 sm:col-span-2">
      <h3 className="mb-3 text-sm font-semibold">Goods Receiving History</h3>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading receipts…</p>
      ) : error ? (
        <div className="text-sm text-destructive" role="alert">
          {error}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      ) : receipts.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="py-2 pr-3">Receipt</th>
                <th className="pr-3">Date</th>
                <th className="pr-3">Quantity</th>
                <th className="pr-3">Received by</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="border-b border-border/60">
                  <td className="py-2 pr-3 font-mono text-xs">{receipt.id}</td>
                  <td className="pr-3">{receipt["date"]}</td>
                  <td className="pr-3 font-mono">{receipt["quantity"]}</td>
                  <td className="pr-3">{receipt["user"]}</td>
                  <td className="max-w-48 truncate">{receipt["notes"] || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No goods receipts recorded yet.</p>
      )}
    </section>
  );
}
