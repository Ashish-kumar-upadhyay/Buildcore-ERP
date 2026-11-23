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
} from "lucide-react";
import { AppShell, StatCard, Panel, Pill } from "@/components/erp/AppShell";
import { inr, type Material } from "@/lib/mock-data";

type Dash = {
  materials: Material[];
  employees: { status: string }[];
  vendors: { id: string }[];
  customers: { id: string }[];
  orders: { status: string }[];
  leaves: { status: string }[];
  monthlySales: { m: string; sales: number; purchase: number }[];
  activities: { who: string; what: string; when: string; tone: string }[];
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
  });
  useEffect(() => {
    let live = true;
    setFirst(readSession()?.user.name.split(" ")[0] ?? "Ishaan");
    api<Dash>("/dashboard")
      .then((next) => {
        if (live) setData(next);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Unable to load the dashboard");
      });
    return () => {
      live = false;
    };
  }, []);
  const { materials, employees, vendors, customers, orders, leaves, monthlySales, activities } = data;
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
  ];
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
