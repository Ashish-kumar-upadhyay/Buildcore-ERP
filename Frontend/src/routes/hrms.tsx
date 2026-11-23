import { Button } from "@/components/ui/button";
import { ModuleNav } from "@/components/erp/ModuleNav";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, LogIn, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Panel, Pill } from "@/components/erp/AppShell";
import { Field, Modal } from "@/components/erp/Modal";
import { inr, type Leave, type Expense } from "@/lib/mock-data";
import { api, readSession } from "@/lib/api";

type Staff = { id: string; name: string; role: string; dept: string; status: string; checkIn: string };

export const Route = createFileRoute("/hrms")({
  head: () => ({
    meta: [
      { title: "HRMS — BuildCore ERP" },
      { name: "description", content: "Attendance, leave approvals and expense claims." },
      { property: "og:title", content: "HRMS — BuildCore ERP" },
      { property: "og:description", content: "Attendance, leave approvals and expense claims." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Hrms,
});

const statusTone: Record<string, string> = {
  Present: "success",
  Field: "info",
  "On Leave": "warning",
  Absent: "danger",
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
};

function Hrms() {
  const [employees, setEmployees] = useState<Staff[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [exp, setExp] = useState<Expense[]>([]);
  const [checkedIn, setCheckedIn] = useState<Date | null>(null);
  const requestOnly = ["Manager", "Employee"].includes(readSession()?.user.role ?? "");
  useEffect(() => {
    if (requestOnly) return;
    let live = true;
    api<{
      employees: Staff[];
      leaves: Leave[];
      expenses: Expense[];
      shift: { checkIn: string | null };
    }>("/hrms/overview")
      .then((data) => {
        if (!live) return;
        setEmployees(data.employees);
        setLeaves(data.leaves);
        setExp(data.expenses);
        setCheckedIn(data.shift.checkIn ? new Date(data.shift.checkIn) : null);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Unable to load HRMS");
      });
    return () => {
      live = false;
    };
  }, [requestOnly]);
  const [now, setNow] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const elapsed = checkedIn && now ? Math.floor((now.getTime() - checkedIn.getTime()) / 1000) : 0;
  const fmt = (s: number) =>
    [s / 3600, (s % 3600) / 60, s % 60]
      .map((n) => String(Math.floor(n)).padStart(2, "0"))
      .join(":");

  const decide = <T extends { id: string }>(
    module: "leaves" | "expenses",
    set: React.Dispatch<React.SetStateAction<T[]>>,
    id: string,
    status: "Approved" | "Rejected",
  ) => {
    void (async () => {
      try {
        const data = await api<{ row: T }>(`/records/${module}/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        set((current) => current.map((x) => (x.id === id ? { ...x, ...data.row } : x)));
        if (module === "leaves" && status === "Approved") {
          const row = leaves.find((item) => item.id === id);
          if (row) {
            setEmployees((staff) =>
              staff.map((person) =>
                person.name === row.name ? { ...person, status: "On Leave" } : person,
              ),
            );
          }
        }
        toast.success(`${id} ${status.toLowerCase()}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update the request");
      }
    })();
  };
  const Actions = ({ onA, onR }: { onA: () => void; onR: () => void }) => (
    <div className="inline-flex gap-1">
      <Button
        variant="ghost"
        aria-label="Approve request"
        title="Approve"
        onClick={onA}
        className="grid size-8 place-items-center rounded-lg bg-success/15 text-success transition hover:scale-110"
      >
        <Check className="size-4" />
      </Button>
      <Button
        variant="ghost"
        aria-label="Reject request"
        title="Reject"
        onClick={onR}
        className="grid size-8 place-items-center rounded-lg bg-destructive/15 text-destructive transition hover:scale-110"
      >
        <X className="size-4" />
      </Button>
    </div>
  );

  return (
    <AppShell title="HRMS" subtitle="People, attendance and approvals">
      <ModuleNav module="hrms" />
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden rounded-2xl surface p-6"
        >
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Your shift</p>
          <p className="mt-3 font-display text-4xl font-bold tabular-nums">
            {checkedIn
              ? fmt(elapsed)
              : now
                ? now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                : "--:--"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {checkedIn
              ? `Checked in at ${checkedIn.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
              : "Not checked in yet"}
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              void (async () => {
                try {
                  const data = await api<{ checkIn: string | null }>("/attendance/punch", {
                    method: "POST",
                    body: JSON.stringify({ action: checkedIn ? "out" : "in" }),
                  });
                  if (data.checkIn) {
                    setCheckedIn(new Date(data.checkIn));
                    toast.success("Checked in");
                  } else {
                    toast.success(`Checked out · ${fmt(elapsed)} worked`);
                    setCheckedIn(null);
                  }
                  const fresh = await api<{ rows: Staff[] }>("/records/employees");
                  setEmployees(fresh.rows);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to record attendance");
                }
              })();
            }}
            className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.03]"
          >
            {checkedIn ? (
              <>
                <LogOut className="size-4" />
                Check out
              </>
            ) : (
              <>
                <LogIn className="size-4" />
                Check in
              </>
            )}
          </Button>
        </motion.div>
        <Panel title="Today's attendance" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["Present", "Field", "On Leave", "Absent"] as const).map((s, i) => {
              const n = employees.filter((e) => e.status === s).length;
              return (
                <motion.div
                  key={s}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-xl border border-border p-4"
                >
                  <Pill tone={statusTone[s]}>{s}</Pill>
                  <p className="mt-3 font-display text-3xl font-bold">{n}</p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${employees.length ? (n / employees.length) * 100 : 0}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full bg-gradient-primary"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Leave requests"
          action={
            <Button
              variant="ghost"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              <Plus className="size-3" />
              Apply
            </Button>
          }
        >
          <ul className="space-y-2">
            {leaves.map((l) => (
              <motion.li
                layout
                key={l.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold">{l.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.type} · {l.from} → {l.to} · {l.days}d
                  </p>
                </div>
                {l.status === "Pending" ? (
                  <Actions
                    onA={() => decide("leaves", setLeaves, l.id, "Approved")}
                    onR={() => decide("leaves", setLeaves, l.id, "Rejected")}
                  />
                ) : (
                  <Pill tone={statusTone[l.status]}>{l.status}</Pill>
                )}
              </motion.li>
            ))}
          </ul>
        </Panel>
        <Panel title="Expense claims">
          <ul className="space-y-2">
            {exp.map((x) => (
              <motion.li
                layout
                key={x.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {x.name} <span className="font-mono text-xs text-muted-foreground">{x.id}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {x.category} · {x.date}
                  </p>
                </div>
                <p className="font-mono text-sm">{inr(x.amount)}</p>
                {x.status === "Pending" ? (
                  <Actions
                    onA={() => decide("expenses", setExp, x.id, "Approved")}
                    onR={() => decide("expenses", setExp, x.id, "Rejected")}
                  />
                ) : (
                  <Pill tone={statusTone[x.status]}>{x.status}</Pill>
                )}
              </motion.li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Employees" className="mt-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {employees.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -4 }}
              className="rounded-xl border border-border p-4"
            >
              <div className="grid size-10 place-items-center rounded-xl bg-accent font-display text-xs font-bold text-accent-foreground">
                {e.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </div>
              <p className="mt-3 text-sm font-semibold">{e.name}</p>
              <p className="text-xs text-muted-foreground">
                {e.role} · {e.dept}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <Pill tone={statusTone[e.status]}>{e.status}</Pill>
                <span className="font-mono text-xs text-muted-foreground">{e.checkIn}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title="Apply for leave">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const record = {
              id: `LV-${Date.now().toString().slice(-7)}`,
              name: readSession()?.user.name ?? "Ishaan Arora",
              type: String(f.get("type") || "Casual"),
              from: String(f.get("from")),
              to: String(f.get("to")),
              days: Number(f.get("days")),
              status: "Pending",
            };
            void (async () => {
              try {
                const saved = await api<{ row: Leave }>("/records/leaves", {
                  method: "POST",
                  body: JSON.stringify(record),
                });
                setLeaves((s) => [saved.row, ...s]);
                setOpen(false);
                toast.success("Leave request submitted");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to submit leave");
              }
            })();
          }}
          className="grid grid-cols-2 gap-3"
        >
          <Field name="type" label="Type" placeholder="Casual" />
          <Field name="days" label="Days" type="number" />
          <Field name="from" label="From" placeholder="01 Dec" />
          <Field name="to" label="To" placeholder="02 Dec" />
          <Button
            variant="ghost"
            className="col-span-2 mt-2 h-11 rounded-xl bg-gradient-primary font-semibold text-primary-foreground"
          >
            Submit
          </Button>
        </form>
      </Modal>
    </AppShell>
  );
}
