import {
  vendors,
  customers,
  purchases,
  transactions,
  departments,
  quotations,
  payments,
  employees,
  leaves,
  expenses,
  orders,
  leads,
  materials,
  type DemoRecord,
} from "./mock-data";
export type Column = {
  key: string;
  label: string;
  type?: "number" | "money" | "date" | "email";
  options?: string[];
};
export type ModuleConfig = {
  title: string;
  subtitle: string;
  singular: string;
  prefix: string;
  columns: Column[];
  rows: DemoRecord[];
  readonly?: boolean;
  workflow?: string[];
  approval?: boolean;
};
const c = (key: string, label: string, type?: Column["type"]): Column =>
  type ? { key, label, type } : { key, label };
const status = (options: string[]): Column => ({ key: "status", label: "Status", options });
export const moduleConfigs: Record<string, ModuleConfig> = {
  vendors: {
    title: "Vendors",
    subtitle: "Your supply network, in one place",
    singular: "vendor",
    prefix: "VEN",
    rows: vendors,
    columns: [
      c("name", "Vendor"),
      c("contact", "Contact"),
      c("email", "Email", "email"),
      c("phone", "Phone"),
      c("category", "Category"),
      status(["Active", "Inactive"]),
    ],
  },
  customers: {
    title: "Customers",
    subtitle: "The people and projects you build with",
    singular: "customer",
    prefix: "CUS",
    rows: customers,
    columns: [
      c("name", "Customer"),
      c("contact", "Contact"),
      c("email", "Email", "email"),
      c("phone", "Phone"),
      c("city", "City"),
      status(["Active", "Inactive"]),
    ],
  },
  purchases: {
    title: "Purchase orders",
    subtitle: "From supplier to warehouse",
    singular: "purchase order",
    prefix: "PO",
    rows: purchases,
    columns: [
      c("vendor", "Vendor"),
      c("material", "Material"),
      c("quantity", "Ordered", "number"),
      c("receivedQuantity", "Received", "number"),
      c("pendingQuantity", "Pending", "number"),
      c("amount", "Amount", "money"),
      c("date", "Order date", "date"),
      status(["Draft", "Submitted", "Partially Received", "Received", "Cancelled"]),
    ],
    workflow: ["Draft", "Submitted"],
  },
  transactions: {
    title: "Stock history",
    subtitle: "Every movement, clearly recorded",
    singular: "transaction",
    prefix: "TX",
    rows: transactions,
    readonly: true,
    columns: [
      c("material", "Material"),
      c("direction", "Movement"),
      c("quantity", "Quantity", "number"),
      c("reference", "Reference"),
      c("date", "Date", "date"),
      c("user", "Recorded by"),
    ],
  },
  employees: {
    title: "Employees",
    subtitle: "Meet the team behind your business",
    singular: "employee",
    prefix: "EMP",
    rows: employees,
    columns: [
      c("name", "Employee"),
      c("role", "Role"),
      { key: "dept", label: "Department", options: departments.map((d) => String(d["name"])) },
      status(["Present", "Field", "On Leave", "Absent"]),
    ],
  },
  departments: {
    title: "Departments",
    subtitle: "Teams, responsibilities and locations",
    singular: "department",
    prefix: "DEP",
    rows: departments,
    columns: [
      c("name", "Department"),
      c("manager", "Manager"),
      c("location", "Location"),
      status(["Active", "Inactive"]),
    ],
  },
  attendance: {
    title: "Attendance",
    subtitle: "Daily attendance across your teams",
    singular: "attendance record",
    prefix: "ATT",
    rows: employees.map((e) => ({
      id: e.id,
      name: e.name,
      dept: e.dept,
      date: "2026-11-23",
      checkIn: e.checkIn,
      checkOut: "—",
      status: e.status,
    })),
    columns: [
      c("name", "Employee"),
      c("dept", "Department"),
      c("date", "Date", "date"),
      c("checkIn", "Check-in"),
      c("checkOut", "Check-out"),
      status(["Present", "Field", "On Leave", "Absent"]),
    ],
  },
  leaves: {
    title: "Leave requests",
    subtitle: "Time off, thoughtfully managed",
    singular: "leave request",
    prefix: "LV",
    rows: leaves,
    approval: true,
    columns: [
      c("name", "Employee"),
      { key: "type", label: "Leave type", options: ["Casual", "Sick", "Earned"] },
      c("from", "From"),
      c("to", "To"),
      c("days", "Days", "number"),
      status(["Pending", "Approved", "Rejected"]),
    ],
  },
  expenses: {
    title: "Expenses",
    subtitle: "Every claim, from submission to approval",
    singular: "expense",
    prefix: "EX",
    rows: expenses,
    approval: true,
    columns: [
      c("name", "Employee"),
      {
        key: "category",
        label: "Category",
        options: ["Fuel", "Client Meeting", "Toll", "Travel", "Office"],
      },
      c("amount", "Amount", "money"),
      c("date", "Date"),
      status(["Pending", "Approved", "Rejected"]),
    ],
  },
  representatives: {
    title: "Sales representatives",
    subtitle: "Your business, out in the field",
    singular: "representative",
    prefix: "SR",
    rows: employees
      .filter((e) => e.dept === "Sales")
      .map((e) => ({ ...e, territory: "Indore", target: 1000000 })),
    columns: [
      c("name", "Representative"),
      c("role", "Role"),
      c("territory", "Territory"),
      c("target", "Monthly target", "money"),
      status(["Present", "Field", "On Leave", "Absent"]),
    ],
  },
  leads: {
    title: "Leads",
    subtitle: "Turn conversations into opportunities",
    singular: "lead",
    prefix: "LD",
    rows: leads.map((l, i) => ({ id: `LD-${101 + i}`, ...l, status: l.stage })),
    columns: [
      c("name", "Opportunity"),
      c("value", "Value", "money"),
      c("rep", "Representative"),
      status(["New", "Qualified", "Quotation", "Negotiation", "Won", "Lost"]),
    ],
    workflow: ["New", "Qualified", "Quotation", "Negotiation", "Won"],
  },
  quotations: {
    title: "Quotations",
    subtitle: "Clear offers. Confident decisions.",
    singular: "quotation",
    prefix: "QT",
    rows: quotations,
    columns: [
      c("customer", "Customer"),
      c("material", "Material"),
      c("quantity", "Quantity", "number"),
      c("amount", "Amount", "money"),
      c("date", "Date", "date"),
      c("validity", "Valid until", "date"),
      status(["Draft", "Sent", "Accepted", "Rejected"]),
    ],
    workflow: ["Draft", "Sent", "Accepted"],
  },
  "sales-orders": {
    title: "Sales orders",
    subtitle: "Every order, from confirmation to delivery",
    singular: "sales order",
    prefix: "SO",
    rows: orders,
    columns: [
      c("customer", "Customer"),
      c("items", "Materials"),
      c("amount", "Amount", "money"),
      c("date", "Date"),
      c("rep", "Representative"),
      status(["Draft", "Confirmed", "Dispatched", "Delivered", "Cancelled"]),
    ],
    workflow: ["Draft", "Confirmed", "Dispatched", "Delivered"],
  },
  payments: {
    title: "Customer payments",
    subtitle: "Receipts and balances, clearly tracked",
    singular: "payment",
    prefix: "PAY",
    rows: payments,
    columns: [
      c("customer", "Customer"),
      c("order", "Order reference"),
      c("amount", "Amount", "money"),
      { key: "method", label: "Method", options: ["Bank transfer", "UPI", "Cash", "Cheque"] },
      c("date", "Date", "date"),
      status(["Pending", "Partial", "Paid"]),
    ],
  },
  "low-stock": {
    title: "Low-stock alerts",
    subtitle: "Materials that need your attention",
    singular: "alert",
    prefix: "LOW",
    rows: materials
      .filter((m) => m.stock < m.reorder)
      .map((m) => ({ ...m, shortfall: m.reorder - m.stock })),
    readonly: true,
    columns: [
      c("name", "Material"),
      c("category", "Category"),
      c("stock", "Available", "number"),
      c("reorder", "Reorder level", "number"),
      c("shortfall", "Shortfall", "number"),
      c("vendor", "Vendor"),
    ],
  },
};
