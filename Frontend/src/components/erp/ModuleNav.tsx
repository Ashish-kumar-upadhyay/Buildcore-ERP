import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
const links = {
  inventory: [
    { to: "/vendors", label: "Vendors" },
    { to: "/purchases", label: "Purchase orders" },
    { to: "/transactions", label: "Stock history" },
    { to: "/low-stock", label: "Low-stock alerts" },
  ],
  hrms: [
    { to: "/employees", label: "Employees" },
    { to: "/attendance", label: "Attendance" },
    { to: "/leaves", label: "Leave requests" },
    { to: "/expenses", label: "Expenses" },
    { to: "/departments", label: "Departments" },
  ],
  sales: [
    { to: "/customers", label: "Customers" },
    { to: "/representatives", label: "Sales team" },
    { to: "/leads", label: "Leads" },
    { to: "/quotations", label: "Quotations" },
    { to: "/sales-orders", label: "Orders" },
    { to: "/payments", label: "Payments" },
  ],
} as const;
export function ModuleNav({ module }: { module: keyof typeof links }) {
  return (
    <nav className="erp-module-nav" aria-label="Module pages">
      {links[module].map((l) => (
        <Link key={l.to} to={l.to}>
          {l.label}
          <ArrowUpRight />
        </Link>
      ))}
    </nav>
  );
}
