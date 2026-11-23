import { Button } from "@/components/ui/button";
import { ModuleNav } from "@/components/erp/ModuleNav";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { IndianRupee, ShoppingCart, Target, Truck } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Panel, Pill, StatCard } from "@/components/erp/AppShell";
import { inr, type OrderStatus } from "@/lib/mock-data";
import { api, readSession } from "@/lib/api";

type Order = {
  id: string;
  customer: string;
  items: string;
  amount: number;
  status: OrderStatus;
  date: string;
  rep: string;
};
type Lead = { name: string; value: number; stage: string; rep: string };
type Month = { m: string; sales: number; purchase: number };
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales — BuildCore ERP" },
      { name: "description", content: "Leads, quotations and sales orders with status tracking." },
      { property: "og:title", content: "Sales — BuildCore ERP" },
      {
        property: "og:description",
        content: "Leads, quotations and sales orders with status tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Sales,
});

const flow: OrderStatus[] = ["Draft", "Confirmed", "Dispatched", "Delivered"];
const tone: Record<OrderStatus, string> = {
  Draft: "muted",
  Confirmed: "primary",
  Dispatched: "info",
  Delivered: "success",
  Cancelled: "danger",
};
const stages = ["New", "Qualified", "Quotation", "Negotiation"];

function Sales() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [monthlySales, setMonthlySales] = useState<Month[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "All">("All");
  const requestOnly = ["Manager", "Employee"].includes(readSession()?.user.role ?? "");
  useEffect(() => {
    if (requestOnly) return;
    let live = true;
    api<{ orders: Order[]; leads: Lead[]; monthlySales: Month[] }>("/sales/overview")
      .then((data) => {
        if (!live) return;
        setOrders(data.orders);
        setLeads(data.leads);
        setMonthlySales(data.monthlySales);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Unable to load sales");
      });
    return () => {
      live = false;
    };
  }, [requestOnly]);
  const advance = (id: string) => {
    const order = orders.find((item) => item.id === id);
    if (!order) return;
    const next = flow[flow.indexOf(order.status) + 1];
    if (!next) return;
    void (async () => {
      try {
        const data = await api<{ row: Order }>(`/records/sales-orders/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: next }),
        });
        setOrders((s) => s.map((o) => (o.id === id ? data.row : o)));
        toast.success(`${id} → ${next}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update the order");
      }
    })();
  };
  const shown = orders.filter((o) => filter === "All" || o.status === filter);
  const revenue = orders.filter((o) => o.status !== "Cancelled").reduce((a, o) => a + o.amount, 0);

  return (
    <AppShell title="Sales" subtitle="Pipeline, orders and revenue">
      <ModuleNav module="sales" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue (Nov)"
          value={inr(revenue)}
          delta="+17% vs Oct"
          icon={IndianRupee}
          i={0}
        />
        <StatCard label="Orders" value={String(orders.length)} icon={ShoppingCart} i={1} />
        <StatCard
          label="In delivery"
          value={String(orders.filter((o) => o.status === "Dispatched").length)}
          icon={Truck}
          i={2}
        />
        <StatCard
          label="Pipeline"
          value={inr(leads.reduce((a, l) => a + l.value, 0))}
          icon={Target}
          i={3}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Lead pipeline" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stages.map((s, i) => (
              <div key={s} className="rounded-xl bg-muted/40 p-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {s}
                </p>
                {leads
                  .filter((l) => l.stage === s)
                  .map((l) => (
                    <motion.div
                      key={l.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ scale: 1.03, rotate: -0.5 }}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <p className="text-sm font-semibold">{l.name}</p>
                      <p className="mt-1 font-mono text-xs text-primary">{inr(l.value)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{l.rep}</p>
                    </motion.div>
                  ))}
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Monthly sales (₹ lakh)">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={monthlySales}>
                <defs>
                  <linearGradient id="bs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="var(--primary-glow)" />
                    <stop offset="1" stopColor="var(--primary)" />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="m"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="sales"
                  fill="url(#bs)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1200}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel
        title="Sales orders"
        className="mt-4"
        action={
          <div className="flex flex-wrap gap-1">
            {(["All", ...flow, "Cancelled"] as const).map((f) => (
              <Button
                variant="ghost"
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {f}
              </Button>
            ))}
          </div>
        }
      >
        <div className="space-y-2">
          {!shown.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No orders in this status.
            </p>
          )}
          {shown.map((o) => {
            const step = flow.indexOf(o.status);
            return (
              <motion.div
                layout
                key={o.id}
                className="grid items-center gap-3 rounded-xl border border-border p-4 xl:grid-cols-[1.2fr_1.5fr_1fr_auto]"
              >
                <div>
                  <p className="font-semibold">{o.customer}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {o.id} · {o.date} · {o.rep}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{o.items}</p>
                  {o.status !== "Cancelled" && (
                    <div className="mt-2 flex gap-1">
                      {flow.map((f, i) => (
                        <div key={f} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={false}
                            animate={{ width: i <= step ? "100%" : "0%" }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-primary"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-mono text-sm">{inr(o.amount)}</p>
                  <Pill tone={tone[o.status]}>{o.status}</Pill>
                </div>
                {step >= 0 && step < flow.length - 1 ? (
                  <Button
                    variant="ghost"
                    onClick={() => advance(o.id)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:border-primary hover:text-primary"
                  >
                    Mark {flow[step + 1]}
                  </Button>
                ) : (
                  <span />
                )}
              </motion.div>
            );
          })}
        </div>
      </Panel>
    </AppShell>
  );
}
