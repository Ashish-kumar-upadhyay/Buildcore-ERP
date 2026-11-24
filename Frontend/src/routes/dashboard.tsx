import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, readSession } from "@/lib/api";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart,
} from "recharts";
import {
  Users,
  Boxes,
  Truck,
  Store,
  IndianRupee,
  Clock,
  CalendarOff,
  UserSquare,
  Inbox,
} from "lucide-react";
import { AppShell, StatCard, Panel, Pill } from "@/components/erp/AppShell";
import { inr, type Material } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Dash = {
  materials: Material[];
  employees: { status: string }[];
  vendors: { id: string }[];
  customers: { id: string }[];
  orders: { status: string }[];
  leaves: { status: string }[];
  monthlySales: { m: string; sales: number; purchase: number }[];
  activities: { who: string; what: string; when: string; tone: string }[];
  pendingMaterialRequests: number;
};

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BuildCore ERP" },
      { name: "description", content: "Overview of stock, sales, people and recent activity." },
      { property: "og:title", content: "Dashboard — BuildCore ERP" },
      {
        property: "og:description",
        content: "Overview of stock, sales, people and recent activity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const tip = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    fontSize: 12,
  },
};

type AttendanceEntry = {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
};

type LeaveEntry = {
  id: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: string;
};

function EmployeeSelfServiceDashboard() {
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [leaves, setLeaves] = useState<LeaveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveType, setLeaveType] = useState("Casual");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const firstName = readSession()?.user.name.split(" ")[0] ?? "Employee";
  const todayAttendance = attendance.find((row) => row.date === today);
  const checkedIn = Boolean(
    todayAttendance && todayAttendance.checkIn !== "—" && todayAttendance.checkOut === "—",
  );

  useEffect(() => {
    let active = true;
    const load = () => {
      void Promise.all([
        api<{ rows: AttendanceEntry[] }>("/records/attendance"),
        api<{ rows: LeaveEntry[] }>("/records/leaves"),
      ])
        .then(([attendanceData, leaveData]) => {
          if (!active) return;
          setAttendance(attendanceData.rows);
          setLeaves(leaveData.rows);
        })
        .catch((error: unknown) => {
          toast.error(error instanceof Error ? error.message : "Unable to load attendance and leave");
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

  const punch = async () => {
    setPunching(true);
    try {
      await api("/attendance/punch", {
        method: "POST",
        body: JSON.stringify({ action: checkedIn ? "out" : "in" }),
      });
      toast.success(checkedIn ? "Checked out successfully" : "Checked in successfully");
      const [attendanceData, leaveData] = await Promise.all([
        api<{ rows: AttendanceEntry[] }>("/records/attendance"),
        api<{ rows: LeaveEntry[] }>("/records/leaves"),
      ]);
      setAttendance(attendanceData.rows);
      setLeaves(leaveData.rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to record attendance");
    } finally {
      setPunching(false);
    }
  };

  const submitLeave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingLeave(true);
    try {
      const result = await api<{ row: LeaveEntry }>("/records/leaves", {
        method: "POST",
        body: JSON.stringify({ type: leaveType, from, to }),
      });
      setLeaves((current) => [result.row, ...current]);
      setFrom("");
      setTo("");
      toast.success("Leave request sent to Admin for approval");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit leave request");
    } finally {
      setSubmittingLeave(false);
    }
  };

  return (
    <AppShell
      title={`Hello, ${firstName}`}
      subtitle="Your attendance and leave requests"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Today's attendance"
          action={
            <Button className="erp-primary" disabled={punching} onClick={() => void punch()}>
              {checkedIn ? "Check out" : "Check in"}
            </Button>
          }
        >
          <div className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm font-medium">{todayAttendance?.date ?? today}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                In: {todayAttendance?.checkIn ?? "—"} · Out: {todayAttendance?.checkOut ?? "—"}
              </p>
            </div>
            <Pill tone={checkedIn ? "success" : "muted"}>
              {checkedIn ? "Checked in" : todayAttendance?.status ?? "Not checked in"}
            </Pill>
          </div>
        </Panel>
        <Panel title="Request leave">
          <form onSubmit={(event) => void submitLeave(event)} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-muted-foreground sm:col-span-2">
              Leave type
              <Select name="leaveType" required value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger aria-label="Leave type" className="erp-select mt-1.5 h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Sick">Sick</SelectItem>
                  <SelectItem value="Earned">Earned</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="text-xs text-muted-foreground">
              From
              <input
                required
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              To
              <input
                required
                type="date"
                min={from || undefined}
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              />
            </label>
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" className="erp-primary" disabled={submittingLeave}>
                {submittingLeave ? "Sending…" : "Send leave request"}
              </Button>
            </div>
          </form>
        </Panel>
        <Panel title="Attendance history">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading attendance…</p>
          ) : attendance.length ? (
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr><th>Date</th><th>Check in</th><th>Check out</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {attendance.map((row) => (
                    <tr key={row.id}>
                      <td>{row.date}</td>
                      <td>{row.checkIn}</td>
                      <td>{row.checkOut}</td>
                      <td><Pill tone={row.status === "Present" ? "success" : "muted"}>{row.status}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No attendance records yet.</p>
          )}
        </Panel>
        <Panel title="My leave requests">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading leave requests…</p>
          ) : leaves.length ? (
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {leaves.map((row) => (
                    <tr key={row.id}>
                      <td>{row.type}</td>
                      <td>{row.from} – {row.to}</td>
                      <td>{row.days}</td>
                      <td>
                        <Pill
                          tone={
                            row.status === "Approved"
                              ? "success"
                              : row.status === "Cancelled" || row.status === "Rejected"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {row.status}
                        </Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No leave requests yet.</p>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

function Dashboard() {
  const [first, setFirst] = useState("Ishaan");
  const [data, setData] = useState<Dash>({
    materials: [],
    employees: [],
    vendors: [],
    customers: [],
    orders: [],
    leaves: [],
    monthlySales: [],
    activities: [],
    pendingMaterialRequests: 0,
  });
  const isAdmin = readSession()?.user.role === "Admin";
  const isEmployee = readSession()?.user.role === "Employee";
  const requestOnly = ["Manager", "Employee"].includes(readSession()?.user.role ?? "");
  useEffect(() => {
    if (requestOnly) return;
    let live = true;
    setFirst(readSession()?.user.name.split(" ")[0] ?? "Ishaan");
    const load = () => {
      api<Dash>("/dashboard")
        .then((next) => {
          if (live) setData(next);
        })
        .catch((error: unknown) => {
          toast.error(error instanceof Error ? error.message : "Unable to load the dashboard");
        });
    };
    load();
    const refresh = isAdmin ? window.setInterval(load, 30000) : undefined;
    return () => {
      live = false;
      if (refresh !== undefined) window.clearInterval(refresh);
    };
  }, [isAdmin, requestOnly]);
  const {
    materials,
    employees,
    vendors,
    customers,
    orders,
    leaves,
    monthlySales,
    activities,
    pendingMaterialRequests,
  } = data;
  const stock = materials.reduce((a, m) => a + m.stock * m.price, 0);
  const transit = materials.reduce((a, m) => a + m.transit * m.price, 0);
  const cats = Object.entries(
    materials.reduce<Record<string, number>>(
      (a, m) => ({ ...a, [m.category]: (a[m.category] ?? 0) + m.stock * m.price }),
      {},
    ),
  ).map(([name, value]) => ({ name, value }));
  const colors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--muted-foreground)",
  ];
  const stats = [
    { label: "Employees", value: String(employees.length), delta: "+2 this month", icon: Users },
    { label: "Inventory items", value: String(materials.length), icon: Boxes },
    { label: "Stock value", value: inr(stock), delta: "+8.4%", icon: IndianRupee },
    { label: "In transit", value: inr(transit), icon: Truck },
    { label: "Vendors", value: String(vendors.length), icon: Store },
    { label: "Customers", value: String(customers.length), delta: "+1 new", icon: UserSquare },
    {
      label: "Pending orders",
      value: String(orders.filter((o) => o.status === "Confirmed" || o.status === "Draft").length),
      icon: Clock,
    },
    {
      label: "Pending leaves",
      value: String(leaves.filter((l) => l.status === "Pending").length),
      icon: CalendarOff,
    },
    ...(isAdmin
      ? [
          {
            label: "Pending material requests",
            value: String(pendingMaterialRequests),
            icon: Inbox,
          },
        ]
      : []),
  ];
  if (isEmployee) return <EmployeeSelfServiceDashboard />;
  return (
    <AppShell title={`Good evening, ${first}`} subtitle="Here's what's moving across your yards today.">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} i={i} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel
          title="Sales vs purchase (₹ lakh)"
          className="lg:col-span-2"
          action={<Pill tone="success">↑ 17% MoM</Pill>}
        >
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={monthlySales}>
                <defs>
                  <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="var(--chart-1)" stopOpacity={0.5} />
                    <stop offset="1" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="var(--chart-2)" stopOpacity={0.35} />
                    <stop offset="1" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="m"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip {...tip} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#gs)"
                  animationDuration={1400}
                />
                <Area
                  type="monotone"
                  dataKey="purchase"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  fill="url(#gp)"
                  animationDuration={1400}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Stock value by category">
          <div className="h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={cats}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  stroke="none"
                >
                  {cats.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length] ?? "var(--primary)"} />
                  ))}
                </Pie>
                <Tooltip {...tip} formatter={(v) => inr(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {cats.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ background: colors[i % colors.length] }}
                />
                {c.name}
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel
          title="Low stock"
          action={
            <Pill tone="warning">{materials.filter((m) => m.stock < m.reorder).length} items</Pill>
          }
        >
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart
                data={materials
                  .filter((m) => m.stock < m.reorder)
                  .map((m) => ({
                    n: m.name.split(" ").slice(0, 2).join(" "),
                    pct: Math.round((m.stock / m.reorder) * 100),
                  }))}
                layout="vertical"
              >
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="n"
                  width={100}
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip {...tip} formatter={(v) => `${v}% of reorder`} />
                <Bar
                  dataKey="pct"
                  fill="var(--chart-5)"
                  radius={[0, 8, 8, 0]}
                  barSize={14}
                  animationDuration={1200}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Recent activity" className="lg:col-span-2">
          <ul className="space-y-1">
            {activities.map((a, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-muted/50"
              >
                <Pill tone={a.tone}>
                  {a.tone === "warning" ? "Alert" : a.tone === "success" ? "Done" : "Update"}
                </Pill>
                <p className="flex-1 text-sm">
                  <span className="font-semibold">{a.who}</span>{" "}
                  <span className="text-muted-foreground">{a.what}</span>
                </p>
                <span className="font-mono text-xs text-muted-foreground">{a.when}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
