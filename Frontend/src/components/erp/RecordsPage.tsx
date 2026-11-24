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
  PackageCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Panel, Pill, StatCard } from "./AppShell";
import { Modal, Field } from "./Modal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { moduleConfigs } from "@/lib/module-config";
import { inr, type DemoRecord, type Material } from "@/lib/mock-data";
import { api, readSession } from "@/lib/api";
import { filterRecords, nextStatus, toCsv } from "@/lib/record-utils";
import { PurchaseOrderForm } from "./PurchaseOrderForm";
import { GoodsReceiptForm, type GoodsReceiptInput } from "./GoodsReceiptForm";
import { PurchaseOrderDetails } from "./PurchaseOrderDetails";

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
  Submitted: "info",
  "Partially Received": "warning",
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
function canEditPurchaseOrder(row: DemoRecord) {
  if (row["purchaseEditable"] !== undefined) return row["purchaseEditable"] === "true";
  return (
    ["Draft", "Submitted"].includes(String(row["status"])) &&
    Number(row["receivedQuantity"] ?? 0) === 0
  );
}

export function RecordsPage({ module }: { module: string }) {
  const config = moduleConfigs[module];
  if (["Manager", "Employee"].includes(readSession()?.user.role ?? "")) {
    return (
      <AppShell title="Material Requests" subtitle="Redirecting to your requests…">
        <span />
      </AppShell>
    );
  }
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
  const [employeePasswords, setEmployeePasswords] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(0);
  const [edit, setEdit] = useState<DemoRecord | "new" | null>(null);
  const [view, setView] = useState<DemoRecord | null>(null);
  const [remove, setRemove] = useState<DemoRecord | null>(null);
  const [receiving, setReceiving] = useState<DemoRecord | null>(null);
  const [receiptSaving, setReceiptSaving] = useState(false);
  const [purchaseVendors, setPurchaseVendors] = useState<DemoRecord[]>([]);
  const [purchaseMaterials, setPurchaseMaterials] = useState<Material[]>([]);
  const [relationsLoading, setRelationsLoading] = useState(module === "purchases");
  const [relationsError, setRelationsError] = useState<string | null>(null);
  const [relationsAttempt, setRelationsAttempt] = useState(0);
  const canManageEmployeeAccounts = ["Admin", "Sub-admin", "HR Manager"].includes(
    readSession()?.user.role ?? "",
  );
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
  useEffect(() => {
    if (module !== "purchases") return;
    let live = true;
    setRelationsLoading(true);
    setRelationsError(null);
    Promise.all([
      api<{ rows: DemoRecord[] }>("/records/vendors"),
      api<{ rows: Material[] }>("/materials"),
    ])
      .then(([vendorData, materialData]) => {
        if (!live) return;
        setPurchaseVendors(vendorData.rows);
        setPurchaseMaterials(materialData.rows);
      })
      .catch((error: unknown) => {
        if (!live) return;
        const message =
          error instanceof Error ? error.message : "Unable to load saved vendors and materials";
        setRelationsError(message);
        toast.error(message);
      })
      .finally(() => {
        if (live) setRelationsLoading(false);
      });
    return () => {
      live = false;
    };
  }, [module, relationsAttempt]);
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
  const saveReceipt = async (receipt: GoodsReceiptInput) => {
    if (!receiving) return;
    setReceiptSaving(true);
    try {
      const saved = await api<{ row: DemoRecord; receipt: DemoRecord }>(
        `/records/purchases/${encodeURIComponent(receiving.id)}/receipts`,
        { method: "POST", body: JSON.stringify(receipt) },
      );
      setRows((old) => old.map((row) => (row.id === saved.row.id ? saved.row : row)));
      setReceiving(null);
      toast.success(`${saved.receipt["quantity"]} received against ${saved.row.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save goods receipt");
    } finally {
      setReceiptSaving(false);
    }
  };
  const saveRecord = (record: DemoRecord) => {
    const saving = edit;
    if (saving === null) return;
    void (async () => {
      try {
        const saved = await api<{
          row: DemoRecord;
          credentials?: { loginId: string; password: string };
        }>(saving === "new" ? `/records/${module}` : `/records/${module}/${record.id}`, {
          method: saving === "new" ? "POST" : "PUT",
          body: JSON.stringify(record),
        });
        setRows((old) =>
          saving === "new"
            ? [saved.row, ...old]
            : old.map((r) => (r.id === saved.row.id ? saved.row : r)),
        );
        const employeePassword =
          saved.credentials?.password || String(record["password"] ?? "").trim();
        if (module === "employees" && employeePassword) {
          setEmployeePasswords((old) => ({ ...old, [saved.row.id]: employeePassword }));
        }
        setEdit(null);
        setQuery("");
        setFilter("All");
        setPage(0);
        if (saved.credentials) {
          toast.success(
            `Employee login credentials — ID: ${saved.credentials.loginId} · Password: ${saved.credentials.password}`,
            { duration: 12000 },
          );
        } else if (module === "employees" && String(record["password"] ?? "").trim()) {
          toast.success(
            `Password updated — ID: ${saved.row["loginId"]} · Password: ${record["password"]}`,
            { duration: 12000 },
          );
        } else {
          toast.success(`${config.singular} saved`);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save");
      }
    })();
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ListFilter className="size-4" aria-hidden="true" />
              <Select
                value={filter}
                onValueChange={(value) => {
                  setFilter(value);
                  setPage(0);
                }}
              >
                <SelectTrigger
                  aria-label="Filter status"
                  className="erp-select w-auto min-w-[6rem]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {statusColumn.options.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div
          className={`erp-table-wrap${module === "purchases" ? " erp-purchase-table-wrap" : ""}`}
        >
          <table className="erp-table">
            <thead>
              <tr>
                <th>{module === "employees" ? "User ID" : "Reference"}</th>
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
                  <td className="font-mono text-xs text-muted-foreground">
                    {module === "employees" ? String(row["loginId"] || row.id) : row.id}
                  </td>
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
                    <div className={`flex justify-end ${module === "purchases" ? "gap-0.5" : "gap-1"}`}>
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
                            title={
                              module === "purchases" && !canEditPurchaseOrder(row)
                                ? "Orders with receipts cannot be edited"
                                : "Edit record"
                            }
                            aria-label={`Edit ${row.id}`}
                            disabled={module === "purchases" && !canEditPurchaseOrder(row)}
                            onClick={() => setEdit(row)}
                          >
                            <Pencil />
                          </Button>
                          {module === "purchases" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={
                                  row["status"] === "Draft"
                                    ? "Mark as Submitted"
                                    : ["Submitted", "Partially Received", "Received"].includes(
                                          String(row["status"]),
                                        )
                                      ? "Already submitted"
                                      : "This order cannot be submitted"
                                }
                                aria-label={`Mark ${row.id} as Submitted`}
                                disabled={row["status"] !== "Draft"}
                                onClick={() => changeStatus(row, "Submitted")}
                              >
                                {row["status"] === "Draft" ? <ArrowRight /> : <Check />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={
                                  ["Submitted", "Partially Received"].includes(
                                    String(row["status"]),
                                  ) && Number(row["pendingQuantity"] ?? 0) > 0
                                    ? "Receive Material"
                                    : row["status"] === "Draft"
                                      ? "Submit the order before receiving"
                                      : "No pending quantity to receive"
                                }
                                aria-label={`Receive material for ${row.id}`}
                                disabled={
                                  !["Submitted", "Partially Received"].includes(
                                    String(row["status"]),
                                  ) || Number(row["pendingQuantity"] ?? 0) <= 0
                                }
                                onClick={() => setReceiving(row)}
                              >
                                <PackageCheck />
                              </Button>
                            </>
                          ) : config.approval && row["status"] === "Pending" ? (
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
                                title={module === "leaves" ? "Cancel" : "Reject"}
                                aria-label={`${module === "leaves" ? "Cancel" : "Reject"} ${row.id}`}
                                className="text-destructive"
                                onClick={() =>
                                  changeStatus(row, module === "leaves" ? "Cancelled" : "Rejected")
                                }
                              >
                                <X />
                              </Button>
                            </>
                          ) : module !== "purchases" &&
                            config.workflow &&
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
                            title={
                              module === "purchases" && !canEditPurchaseOrder(row)
                                ? "Orders with receipts cannot be deleted"
                                : "Delete record"
                            }
                            aria-label={`Delete ${row.id}`}
                            className="text-destructive"
                            disabled={module === "purchases" && !canEditPurchaseOrder(row)}
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
        {edit &&
          (module === "purchases" ? (
            <PurchaseOrderForm
              key={edit === "new" ? "new" : edit.id}
              edit={edit}
              vendors={purchaseVendors}
              materials={purchaseMaterials}
              loading={relationsLoading}
              loadError={relationsError}
              onRetry={() => setRelationsAttempt((attempt) => attempt + 1)}
              onSave={saveRecord}
              onCancel={() => setEdit(null)}
            />
          ) : (
            <form
              key={typeof edit === "string" ? "new" : edit.id}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                const record: DemoRecord = {
                  id:
                    edit === "new"
                      ? `${config.prefix}-${Date.now().toString().slice(-7)}`
                      : edit.id,
                };
                for (const c of config.columns)
                  record[c.key] =
                    c.type === "number" || c.type === "money"
                      ? Number(data.get(c.key))
                      : String(data.get(c.key) ?? "");
                if (module === "employees") {
                  record["password"] = String(data.get("password") ?? "");
                }
                saveRecord(record);
              }}
            >
              {config.columns.map((c) =>
                c.options ? (
                  <label key={c.key} className="text-xs text-muted-foreground">
                    {c.label}
                    <Select
                      name={c.key}
                      defaultValue={edit === "new" ? c.options[0] : String(edit[c.key] ?? "")}
                    >
                      <SelectTrigger aria-label={c.label} className="erp-select mt-1.5 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {c.options.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              {module === "employees" && (
                <Field
                  label={edit === "new" ? "Login password" : "New password (optional)"}
                  name="password"
                  type="password"
                  defaultValue=""
                  required={false}
                />
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
          ))}
      </Modal>
      <Modal
        open={view !== null}
        onClose={() => setView(null)}
        title={String(view?.["name"] ?? view?.id ?? "Details")}
      >
        {view && (
          <>
            <dl className="grid grid-cols-2 gap-4">
              {module === "employees" && (
                <div>
                  <dt className="text-xs text-muted-foreground">User ID</dt>
                  <dd className="mt-1 break-words font-mono text-sm font-semibold">
                    {String(view["loginId"] || view.id)}
                  </dd>
                </div>
              )}
              {config.columns.map((c) => (
                <div key={c.key}>
                  <dt className="text-xs text-muted-foreground">{c.label}</dt>
                  <dd className="mt-1 break-words text-sm font-semibold">
                    {c.type === "money" ? inr(Number(view[c.key])) : view[c.key]}
                  </dd>
                </div>
              ))}
            </dl>
            {module === "employees" && (
              <div className="mt-5 rounded-lg border p-4">
                <p className="text-xs font-semibold">Password</p>
                {canManageEmployeeAccounts && employeePasswords[view.id] ? (
                  <p className="mt-1 break-all font-mono text-sm font-semibold">
                    {employeePasswords[view.id]}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {canManageEmployeeAccounts
                      ? "This password is not available in this page session. Set a new password to share it with the employee."
                      : "The employee password is protected and cannot be viewed."}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Passwords are securely hashed on the server. Newly set passwords are shown only
                  during this page session.
                </p>
                {canManageEmployeeAccounts && (
                  <Button
                    className="mt-3"
                    variant="outline"
                    onClick={() => {
                      setEdit(view);
                      setView(null);
                    }}
                  >
                    Set a new password
                  </Button>
                )}
              </div>
            )}
            {module === "purchases" && <PurchaseOrderDetails key={view.id} purchase={view} />}
          </>
        )}
      </Modal>
      <Modal
        open={receiving !== null}
        onClose={() => {
          if (!receiptSaving) setReceiving(null);
        }}
        title={`Receive Material · ${receiving?.id ?? ""}`}
      >
        {receiving && (
          <GoodsReceiptForm
            key={receiving.id}
            purchase={receiving}
            saving={receiptSaving}
            onSave={saveReceipt}
            onCancel={() => setReceiving(null)}
          />
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
