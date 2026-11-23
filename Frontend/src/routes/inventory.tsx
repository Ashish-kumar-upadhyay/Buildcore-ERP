import { Button } from "@/components/ui/button";
import { ModuleNav } from "@/components/erp/ModuleNav";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, ArrowDownToLine, ArrowUpFromLine, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Panel, Pill } from "@/components/erp/AppShell";
import { materials as catalog, inr, type Material } from "@/lib/mock-data";
import { api, readSession } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Field, Modal } from "@/components/erp/Modal";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — BuildCore ERP" },
      {
        name: "description",
        content: "Materials, stock levels, in-transit goods and low-stock alerts.",
      },
      { property: "og:title", content: "Inventory — BuildCore ERP" },
      {
        property: "og:description",
        content: "Materials, stock levels, in-transit goods and low-stock alerts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inventory,
});

const PAGE = 6;

function Inventory() {
  const [items, setItems] = useState<Material[]>([]);
  const requestOnly = ["Manager", "Employee"].includes(readSession()?.user.role ?? "");
  useEffect(() => {
    if (requestOnly) return;
    let live = true;
    api<{ rows: Material[] }>("/materials")
      .then((data) => {
        if (live) setItems(data.rows);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Unable to load materials");
      });
    return () => {
      live = false;
    };
  }, [requestOnly]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [move, setMove] = useState<{ m: Material; dir: "in" | "out" } | null>(null);
  const cats = ["All", ...new Set([...catalog.map((m) => m.category), ...items.map((m) => m.category)])];
  const filtered = useMemo(
    () =>
      items.filter(
        (m) =>
          (cat === "All" || m.category === cat) && m.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [items, q, cat],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const rows = filtered.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <AppShell
      title="Inventory"
      subtitle={`${items.length} materials · ${items.filter((m) => m.stock < m.reorder).length} below reorder level`}
      actions={
        <Button
          variant="ghost"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.03]"
        >
          <Plus className="size-4" />
          Add material
        </Button>
      }
    >
      <ModuleNav module="inventory" />
      <Panel
        title="Materials"
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Search…"
              className="h-9 w-48 rounded-lg border border-input bg-background/50 pl-9 text-sm outline-none focus:border-primary/60"
            />
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {cats.map((c) => (
            <Button
              variant="ghost"
              key={c}
              onClick={() => {
                setCat(c);
                setPage(0);
              }}
              className={cn(
                "relative rounded-lg px-3 py-1.5 text-xs font-medium transition",
                cat === c
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {cat === c && (
                <motion.span
                  layoutId="cat"
                  className="absolute inset-0 rounded-lg bg-gradient-primary"
                />
              )}
              <span className="relative">{c}</span>
            </Button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-3 pr-4">Material</th>
                <th className="pr-4">Category</th>
                <th className="pr-4">Available</th>
                <th className="pr-4">In transit</th>
                <th className="pr-4">Unit price</th>
                <th className="pr-4">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {rows.map((m) => {
                  const pct = Math.min(100, (m.stock / (m.reorder * 2)) * 100);
                  const low = m.stock < m.reorder;
                  return (
                    <motion.tr
                      key={m.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="border-b border-border/60 transition hover:bg-muted/40"
                    >
                      <td className="py-3 pr-4">
                        <p className="font-semibold">{m.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {m.id} · {m.vendor}
                        </p>
                      </td>
                      <td className="pr-4 text-muted-foreground">{m.category}</td>
                      <td className="pr-4">
                        <p className="font-mono">
                          {m.stock.toLocaleString("en-IN")}{" "}
                          <span className="text-xs text-muted-foreground">{m.unit}</span>
                        </p>
                        <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            className={cn("h-full", low ? "bg-destructive" : "bg-gradient-primary")}
                          />
                        </div>
                      </td>
                      <td className="pr-4 font-mono text-info">
                        {m.transit ? m.transit.toLocaleString("en-IN") : "—"}
                      </td>
                      <td className="pr-4 font-mono">{inr(m.price)}</td>
                      <td className="pr-4">
                        {low ? (
                          <Pill tone="danger">Low stock</Pill>
                        ) : (
                          <Pill tone="success">Healthy</Pill>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex gap-1">
                          <IconBtn
                            title="Edit material"
                            onClick={() => {
                              setEditing(m);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </IconBtn>
                          <IconBtn title="Stock in" onClick={() => setMove({ m, dir: "in" })}>
                            <ArrowDownToLine className="size-4 text-success" />
                          </IconBtn>
                          <IconBtn title="Stock out" onClick={() => setMove({ m, dir: "out" })}>
                            <ArrowUpFromLine className="size-4 text-warning" />
                          </IconBtn>
                          <IconBtn
                            title="Delete"
                            onClick={() => {
                              void (async () => {
                                try {
                                  await api(`/materials/${m.id}`, { method: "DELETE" });
                                  setItems((s) => s.filter((x) => x.id !== m.id));
                                  toast.success(`${m.name} removed`);
                                } catch (error) {
                                  toast.error(error instanceof Error ? error.message : "Unable to delete");
                                }
                              })();
                            }}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </IconBtn>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <p className="py-8 text-center text-sm text-muted-foreground">No materials found.</p>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {rows.length} of {filtered.length}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: pages }, (_, i) => (
              <Button
                variant="ghost"
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  "size-8 rounded-lg font-mono",
                  page === i ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </div>
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit material" : "Add material"}
      >
        <form
          key={editing?.id ?? "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const m: Material = {
              id: editing?.id ?? `MAT-${Date.now().toString().slice(-7)}`,
              name: String(f.get("name")),
              category: String(f.get("category")),
              unit: String(f.get("unit")),
              stock: Number(f.get("stock")),
              transit: editing?.transit ?? 0,
              reorder: Number(f.get("reorder")),
              price: Number(f.get("price")),
              vendor: String(f.get("vendor")),
            };
            const current = editing;
            void (async () => {
              try {
                const saved = await api<{ row: Material }>(
                  current ? `/materials/${current.id}` : "/materials",
                  { method: current ? "PUT" : "POST", body: JSON.stringify(m) },
                );
                setItems((s) =>
                  current ? s.map((x) => (x.id === saved.row.id ? saved.row : x)) : [saved.row, ...s],
                );
                setOpen(false);
                setPage(0);
                toast.success(`${saved.row.name} saved`);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to save material");
              }
            })();
          }}
          className="grid grid-cols-2 gap-3"
        >
          <Field defaultValue={editing?.name} name="name" label="Name" className="col-span-2" />
          <label className="text-xs text-muted-foreground">
            Category
            <select
              defaultValue={editing?.category}
              name="category"
              className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground"
            >
              {cats.slice(1).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <Field defaultValue={editing?.unit} name="unit" label="Unit" placeholder="bags" />
          <Field defaultValue={editing?.stock} name="stock" label="Opening stock" type="number" />
          <Field
            defaultValue={editing?.reorder}
            name="reorder"
            label="Reorder level"
            type="number"
          />
          <Field defaultValue={editing?.price} name="price" label="Unit price (₹)" type="number" />
          <Field defaultValue={editing?.vendor} name="vendor" label="Vendor" />
          <Button
            variant="ghost"
            className="col-span-2 mt-2 h-11 rounded-xl bg-gradient-primary font-semibold text-primary-foreground"
          >
            Save material
          </Button>
        </form>
      </Modal>

      <Modal
        open={!!move}
        onClose={() => setMove(null)}
        title={move ? `${move.dir === "in" ? "Stock in" : "Stock out"} · ${move.m.name}` : ""}
      >
        {move && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const qty = Number(new FormData(e.currentTarget).get("qty"));
              const current = move;
              void (async () => {
                try {
                  const saved = await api<{ row: Material }>(`/materials/${current.m.id}/move`, {
                    method: "POST",
                    body: JSON.stringify({ direction: current.dir, quantity: qty }),
                  });
                  setItems((s) => s.map((x) => (x.id === saved.row.id ? saved.row : x)));
                  toast.success(
                    `${current.dir === "in" ? "Received" : "Issued"} ${qty} ${current.m.unit}`,
                  );
                  setMove(null);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to update stock");
                }
              })();
            }}
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground">
              Available:{" "}
              <span className="font-mono text-foreground">
                {move.m.stock} {move.m.unit}
              </span>
            </p>
            <Field name="qty" label="Quantity" type="number" min={1} />
            <Button
              variant="ghost"
              className="h-11 w-full rounded-xl bg-gradient-primary font-semibold text-primary-foreground"
            >
              Confirm
            </Button>
          </form>
        )}
      </Modal>
    </AppShell>
  );
}

function IconBtn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      variant="ghost"
      aria-label={p.title}
      {...p}
      className="grid size-8 place-items-center rounded-lg border border-border transition hover:scale-110 hover:bg-muted"
    >
      {children}
    </Button>
  );
}
