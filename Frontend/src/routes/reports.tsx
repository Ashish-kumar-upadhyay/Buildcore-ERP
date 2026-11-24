import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Download, IndianRupee, TrendingUp, Boxes, Users } from "lucide-react";
import { AppShell, Panel, StatCard } from "@/components/erp/AppShell";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/components/erp/RecordsPage";
import { inr } from "@/lib/mock-data";
import { api, readSession } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Month = { m: string; sales: number; purchase: number };
type StockRow = { category: string; stock: number; price: number };
type Person = { status: string };
export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & analytics — BuildCore ERP" },
      { name: "description", content: "Sales trends, stock valuation and attendance reports." },
      { property: "og:title", content: "Reports & analytics — BuildCore ERP" },
      {
        property: "og:description",
        content: "Sales trends, stock valuation and attendance reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reports,
});
const tip = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--foreground)",
  },
};
function Reports() {
  const [tab, setTab] = useState("Sales");
  const [period, setPeriod] = useState("6");
  const [monthlySales, setMonthlySales] = useState<Month[]>([]);
  const [materials, setMaterials] = useState<StockRow[]>([]);
  const [employees, setEmployees] = useState<Person[]>([]);
  const requestOnly = ["Manager", "Employee"].includes(readSession()?.user.role ?? "");
  useEffect(() => {
    if (requestOnly) return;
    let live = true;
    api<{ monthlySales: Month[]; materials: StockRow[]; employees: Person[] }>("/reports?months=12")
      .then((data) => {
        if (!live) return;
        setMonthlySales(data.monthlySales);
        setMaterials(data.materials);
        setEmployees(data.employees);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Unable to load reports");
      });
    return () => {
      live = false;
    };
  }, [requestOnly]);
  const sales = monthlySales.slice(-Number(period));
  const stock = Object.entries(
    materials.reduce<Record<string, number>>(
      (a, m) => ({ ...a, [m.category]: (a[m.category] ?? 0) + m.stock * m.price }),
      {},
    ),
  ).map(([category, value]) => ({ category, value }));
  const attendance = ["Present", "Field", "On Leave", "Absent"].map((status) => ({
    status,
    count: employees.filter((e) => e.status === status).length,
  }));
  const exportReport = () => {
    if (tab === "Sales")
      downloadCsv(
        sales.map((s) => ({ id: s.m, ...s })),
        ["m", "sales", "purchase"],
        "sales-report",
      );
    else if (tab === "Inventory")
      downloadCsv(
        stock.map((s) => ({ id: s.category, ...s })),
        ["category", "value"],
        "inventory-report",
      );
    else
      downloadCsv(
        attendance.map((s) => ({ id: s.status, ...s })),
        ["status", "count"],
        "attendance-report",
      );
  };
  return (
    <AppShell
      title="Reports & analytics"
      subtitle="A clearer picture of your business"
      actions={
        <Button className="erp-primary" onClick={exportReport}>
          <Download />
          Export report
        </Button>
      }
    >
      <div className="mb-6 flex flex-wrap justify-between gap-3">
        <div className="flex gap-2">
          {["Sales", "Inventory", "Attendance"].map((t) => (
            <Button key={t} variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
              {t}
            </Button>
          ))}
        </div>
        {tab === "Sales" && (
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger aria-label="Report period" className="erp-select w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="1">This month</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Sales total"
          value={inr(sales.reduce((a, s) => a + s.sales * 100000, 0))}
          icon={IndianRupee}
        />
        <StatCard
          label="Gross margin"
          value={inr(sales.reduce((a, s) => a + (s.sales - s.purchase) * 100000, 0))}
          icon={TrendingUp}
          i={1}
        />
        <StatCard
          label="Stock value"
          value={inr(stock.reduce((a, s) => a + s.value, 0))}
          icon={Boxes}
          i={2}
        />
        <StatCard label="Team members" value={String(employees.length)} icon={Users} i={3} />
      </div>
      <Panel
        title={
          tab === "Sales"
            ? "Sales & purchases (₹ lakh)"
            : tab === "Inventory"
              ? "Stock valuation by category"
              : "Team attendance"
        }
      >
        <div className="h-80">
          <ResponsiveContainer>
            {tab === "Sales" ? (
              <LineChart data={sales}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip {...tip} />
                <Line dataKey="sales" stroke="var(--chart-1)" strokeWidth={3} />
                <Line dataKey="purchase" stroke="var(--chart-2)" strokeWidth={2} />
              </LineChart>
            ) : (
              <BarChart data={tab === "Inventory" ? stock : attendance}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey={tab === "Inventory" ? "category" : "status"}
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip {...tip} />
                <Bar
                  dataKey={tab === "Inventory" ? "value" : "count"}
                  fill="var(--chart-1)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Report details" className="mt-6">
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                {(tab === "Sales"
                  ? ["Month", "Sales", "Purchases", "Gross margin"]
                  : tab === "Inventory"
                    ? ["Category", "Stock value"]
                    : ["Status", "Employees"]
                ).map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tab === "Sales"
                ? sales.map((s) => (
                    <tr key={s.m}>
                      <td>{s.m}</td>
                      <td>{inr(s.sales * 100000)}</td>
                      <td>{inr(s.purchase * 100000)}</td>
                      <td>{inr((s.sales - s.purchase) * 100000)}</td>
                    </tr>
                  ))
                : tab === "Inventory"
                  ? stock.map((s) => (
                      <tr key={s.category}>
                        <td>{s.category}</td>
                        <td>{inr(s.value)}</td>
                      </tr>
                    ))
                  : attendance.map((s) => (
                      <tr key={s.status}>
                        <td>{s.status}</td>
                        <td>{s.count}</td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
