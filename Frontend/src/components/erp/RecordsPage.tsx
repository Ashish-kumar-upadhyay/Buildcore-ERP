import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  ArrowRight,
  ListFilter,
  Inbox,
  Wallet,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Panel, Pill, StatCard } from "./AppShell";
import { Modal, Field } from "./Modal";
import { Button } from "@/components/ui/button";
import { moduleConfigs } from "@/lib/module-config";
import { inr, type DemoRecord } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { filterRecords, nextStatus, toCsv } from "@/lib/record-utils";

export function downloadCsv(rows: DemoRecord[], keys: string[], name: string) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + toCsv(rows, keys)], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
const tones: Record<string, string> = {
  Active: "success",
  Present: "success",
  Approved: "success",
  Received: "success",
  Delivered: "success",
  Paid: "success",
  Accepted: "success",
  Won: "success",
  Pending: "warning",
  Partial: "warning",
  Draft: "muted",
  Inactive: "muted",
  Cancelled: "danger",
  Rejected: "danger",
  Absent: "danger",
  Lost: "danger",
  Field: "info",
  Dispatched: "info",
  "In transit": "info",
  Sent: "info",
};
export function RecordsPage({ module }: { module: string }) {
  const config = moduleConfigs[module];
  if (!config)
    return (
      <AppShell title="Unavailable">
        <p>This page is unavailable.</p>
      </AppShell>
    );
  return <RecordsView key={module} config={config} module={module} />;
}
function RecordsView({
  config,
  module,
}: {
  config: NonNullable<(typeof moduleConfigs)[string]>;
  module: string;
}) {
  const [rows, setRows] = useState<DemoRecord[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(0);
  const [edit, setEdit] = useState<DemoRecord | "new" | null>(null);
  const [view, setView] = useState<DemoRecord | null>(null);
  const [remove, setRemove] = useState<DemoRecord | null>(null);
  useEffect(() => {
    let live = true;
    api<{ rows: DemoRecord[] }>(`/records/${module}`)
      .then((data) => {
        if (live) setRows(data.rows);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Unable to load records");
      });
    return () => {
      live = false;
    };
  }, [module]);
  const reduced = useReducedMotion();
  const filtered = useMemo(() => filterRecords(rows, query, filter), [rows, query, filter]);
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  const current = Math.min(page, pages - 1);
  const shown = filtered.slice(current * 6, current * 6 + 6);
  const statusColumn = config.columns.find((c) => c.key === "status");
  const changeStatus = async (row: DemoRecord, status: string) => {
    try {
      const data = await api<{ row: DemoRecord }>(`/records/${module}/${row.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setRows((old) => old.map((r) => (r.id === data.row.id ? data.row : r)));
      toast.success(`${row.id} · ${status}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update status");
    }
  };
  const money = config.columns.find((c) => c.type === "money");
  const summary = money
    ? rows.reduce((s, r) => s + Number(r[money.key] ?? 0), 0)
    : rows.filter((r) => ["Pending", "Draft", "New", "Absent"].includes(String(r["status"])))
        .length;
  return (
    <AppShell
      title={config.title}
      subtitle={config.subtitle}
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            title="Export records"
            aria-label="Export records"
            onClick={() =>
              downloadCsv(filtered, ["id", ...config.columns.map((c) => c.key)], module)
            }
          >
            <Download />
          </Button>
          {!config.readonly && (
            <Button onClick={() => setEdit("new")} className="erp-primary">
              <Plus />
              Add {config.singular}
            </Button>
          )}
        </div>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label={`Total ${config.title.toLowerCase()}`}
          value={String(rows.length)}
          icon={Users}
        />
        <StatCard
          label={money ? "Total value" : "Needs attention"}
          value={money ? inr(summary) : String(summary)}
          icon={money ? Wallet : ListFilter}
          i={1}
        />
        <StatCard label="Showing records" value={String(filtered.length)} icon={Inbox} i={2} />
      </div>
      <Panel
        title={config.title}
        action={<span className="text-xs text-muted-foreground">{rows.length} records</span>}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <label className="erp-search">
            <Search />
            <input
              aria-label={`Search ${config.title}`}
              value={query}
              placeholder={`Search ${config.title.toLowerCase()}…`}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
          </label>
          {statusColumn?.options && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <ListFilter className="size-4" />
              <select
                aria-label="Filter status"
                className="erp-select"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(0);
                }}
              >
                <option>All</option>
                {statusColumn.options.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Reference</th>
                {config.columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <motion.tr
                  key={row.id}
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <td className="font-mono text-xs text-muted-foreground">{row.id}</td>
                  {config.columns.map((c, i) => (
                    <td key={c.key} className={i === 0 ? "font-semibold" : ""}>
                      {c.key === "status" ? (
                        <Pill tone={tones[String(row[c.key])] ?? "primary"}>{row[c.key]}</Pill>
                      ) : c.type === "money" ? (
                        <span className="font-mono">{inr(Number(row[c.key]))}</span>
                      ) : (
                        String(row[c.key] ?? "—")
                      )}
                    </td>
                  ))}
                  <td>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="View record"
                        aria-label={`View ${row.id}`}
                        onClick={() => setView(row)}
                      >
                        <Eye />
                      </Button>
                      {!config.readonly && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit record"
                            aria-label={`Edit ${row.id}`}
                            onClick={() => setEdit(row)}
                          >
                            <Pencil />
                          </Button>
                          {config.approval && row["status"] === "Pending" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Approve"
                                aria-label={`Approve ${row.id}`}
                                className="text-success"
                                onClick={() => changeStatus(row, "Approved")}
                              >
                                <Check />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Reject"
                                aria-label={`Reject ${row.id}`}
                                className="text-destructive"
                                onClick={() => changeStatus(row, "Rejected")}
                              >
                                <X />
                              </Button>
                            </>
                          ) : config.workflow &&
                            nextStatus(String(row["status"]), config.workflow) ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              title={`Mark ${nextStatus(String(row["status"]), config.workflow)}`}
                              aria-label={`Advance ${row.id}`}
                              onClick={() => {
                                const next = nextStatus(
                                  String(row["status"]),
                                  config.workflow ?? [],
                                );
                                if (next) changeStatus(row, next);
                              }}
                            >
                              <ArrowRight />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete record"
                            aria-label={`Delete ${row.id}`}
                            className="text-destructive"
                            onClick={() => setRemove(row)}
                          >
                            <Trash2 />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {!shown.length && (
          <div className="erp-empty">
            <Inbox />
            <h3>No records found</h3>
            <p>Try another search or filter.</p>
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setFilter("All");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            {filtered.length ? current * 6 + 1 : 0}–{Math.min((current + 1) * 6, filtered.length)}{" "}
            of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous page"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft />
            </Button>
            <span>
              {current + 1} / {pages}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next page"
              disabled={current === pages - 1}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </Panel>
      <Modal
        open={edit !== null}
        onClose={() => setEdit(null)}
        title={`${edit === "new" ? "Add" : "Edit"} ${config.singular}`}
      >
        {edit && (
          <form
            key={typeof edit === "string" ? "new" : edit.id}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const data = new FormData(form);
              const record: DemoRecord = {
                id:
                  edit === "new" ? `${config.prefix}-${Date.now().toString().slice(-7)}` : edit.id,
              };
              for (const c of config.columns)
                record[c.key] =
                  c.type === "number" || c.type === "money"
                    ? Number(data.get(c.key))
                    : String(data.get(c.key) ?? "");
              const saving = edit;
              void (async () => {
                try {
                  const saved = await api<{ row: DemoRecord }>(
                    saving === "new" ? `/records/${module}` : `/records/${module}/${record.id}`,
                    {
                      method: saving === "new" ? "POST" : "PUT",
                      body: JSON.stringify(record),
                    },
                  );
                  setRows((old) =>
                    saving === "new"
                      ? [saved.row, ...old]
                      : old.map((r) => (r.id === saved.row.id ? saved.row : r)),
                  );
                  setEdit(null);
                  setQuery("");
                  setFilter("All");
                  setPage(0);
                  toast.success(`${config.singular} saved`);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to save");
                }
              })();
            }}
          >
            {config.columns.map((c) =>
              c.options ? (
                <label key={c.key} className="text-xs text-muted-foreground">
                  {c.label}
                  <select
                    name={c.key}
                    className="erp-select mt-1.5 w-full"
                    defaultValue={edit === "new" ? c.options[0] : String(edit[c.key] ?? "")}
                  >
                    {c.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <Field
                  key={c.key}
                  label={c.label}
                  name={c.key}
                  type={c.type === "number" || c.type === "money" ? "number" : (c.type ?? "text")}
                  step={c.type === "money" ? "0.01" : undefined}
                  defaultValue={edit === "new" ? "" : (edit[c.key] ?? "")}
                />
              ),
            )}
            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button type="submit" className="erp-primary">
                <Check />
                Save {config.singular}
              </Button>
            </div>
          </form>
        )}
      </Modal>
      <Modal open={view !== null} onClose={() => setView(null)} title={view?.id ?? "Details"}>
        {view && (
          <dl className="grid grid-cols-2 gap-4">
            {config.columns.map((c) => (
              <div key={c.key}>
                <dt className="text-xs text-muted-foreground">{c.label}</dt>
                <dd className="mt-1 break-words text-sm font-semibold">
                  {c.type === "money" ? inr(Number(view[c.key])) : view[c.key]}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
      <Modal open={remove !== null} onClose={() => setRemove(null)} title="Delete record?">
        <p className="mb-5 text-sm text-muted-foreground">
          Remove {remove?.id} from {config.title.toLowerCase()}?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRemove(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              const target = remove;
              if (!target) return;
              void (async () => {
                try {
                  await api(`/records/${module}/${target.id}`, { method: "DELETE" });
                  setRows((old) => old.filter((r) => r.id !== target.id));
                  setRemove(null);
                  toast.success("Record deleted");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to delete");
                }
              })();
            }}
          >
            <Trash2 />
            Delete record
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
