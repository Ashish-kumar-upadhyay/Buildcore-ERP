import {
  Attendance,
  Customer,
  Department,
  Employee,
  Expense,
  Lead,
  Leave,
  Material,
  Notification,
  Payment,
  Purchase,
  Quotation,
  Representative,
  SalesOrder,
  Transaction,
  Vendor,
} from "./models.js";

const ALL = [
  "Admin",
  "Sub-admin",
  "HR Manager",
  "Inventory Manager",
  "Sales Manager",
  "Employee",
  "Sales Rep",
];
const HR = ["Admin", "Sub-admin", "HR Manager"];
const INV = ["Admin", "Sub-admin", "Inventory Manager"];
const SALES = ["Admin", "Sub-admin", "Sales Manager"];
const SALES_TEAM = ["Admin", "Sub-admin", "Sales Manager", "Sales Rep"];

const str = (options) => (options ? ["string", options] : ["string"]);
const num = () => ["number"];

export const modules = {
  vendors: {
    model: Vendor,
    prefix: "VEN",
    writers: INV,
    readers: ALL,
    cols: [
      ["name", ...str()],
      ["contact", ...str()],
      ["email", ...str()],
      ["phone", ...str()],
      ["category", ...str()],
      ["status", ...str(["Active", "Inactive"])],
    ],
  },
  customers: {
    model: Customer,
    prefix: "CUS",
    writers: SALES_TEAM,
    readers: ALL,
    cols: [
      ["name", ...str()],
      ["contact", ...str()],
      ["email", ...str()],
      ["phone", ...str()],
      ["city", ...str()],
      ["status", ...str(["Active", "Inactive"])],
    ],
  },
  purchases: {
    model: Purchase,
    prefix: "PO",
    writers: INV,
    readers: ALL,
    workflow: ["Draft", "Submitted"],
    cols: [
      ["vendor", ...str()],
      ["material", ...str()],
      ["quantity", ...num()],
      ["amount", ...num()],
      ["date", ...str()],
      ["status", ...str(["Draft", "Submitted", "Partially Received", "Received", "Cancelled"])],
    ],
  },
  transactions: {
    model: Transaction,
    prefix: "TX",
    writers: [],
    readers: ALL,
    readonly: true,
    cols: [
      ["material", ...str()],
      ["direction", ...str()],
      ["quantity", ...num()],
      ["reference", ...str()],
      ["date", ...str()],
      ["user", ...str()],
    ],
  },
  employees: {
    model: Employee,
    prefix: "EMP",
    writers: HR,
    readers: ALL,
    cols: [
      ["name", ...str()],
      ["loginId", ...str()],
      ["role", ...str()],
      ["dept", ...str()],
      ["status", ...str(["Present", "Field", "On Leave", "Absent"])],
    ],
  },
  departments: {
    model: Department,
    prefix: "DEP",
    writers: HR,
    readers: ALL,
    cols: [
      ["name", ...str()],
      ["manager", ...str()],
      ["location", ...str()],
      ["status", ...str(["Active", "Inactive"])],
    ],
  },
  attendance: {
    model: Attendance,
    prefix: "ATT",
    writers: [...HR, "Employee"],
    readers: ALL,
    cols: [
      ["name", ...str()],
      ["dept", ...str()],
      ["date", ...str()],
      ["checkIn", ...str()],
      ["checkOut", ...str()],
      ["status", ...str(["Present", "Field", "On Leave", "Absent"])],
    ],
  },
  leaves: {
    model: Leave,
    prefix: "LV",
    writers: [...HR, "Employee", "Sales Rep"],
    readers: ALL,
    approval: true,
    cols: [
      ["name", ...str()],
      ["type", ...str(["Casual", "Sick", "Earned"])],
      ["from", ...str()],
      ["to", ...str()],
      ["days", ...num()],
      ["status", ...str(["Pending", "Approved", "Rejected", "Cancelled"])],
    ],
  },
  expenses: {
    model: Expense,
    prefix: "EX",
    writers: [...HR, "Employee", "Sales Rep", "Sales Manager"],
    readers: ALL,
    approval: true,
    cols: [
      ["name", ...str()],
      ["category", ...str(["Fuel", "Client Meeting", "Toll", "Travel", "Office"])],
      ["amount", ...num()],
      ["date", ...str()],
      ["status", ...str(["Pending", "Approved", "Rejected"])],
    ],
  },
  representatives: {
    model: Representative,
    prefix: "SR",
    writers: SALES,
    readers: ALL,
    cols: [
      ["name", ...str()],
      ["role", ...str()],
      ["territory", ...str()],
      ["target", ...num()],
      ["status", ...str(["Present", "Field", "On Leave", "Absent"])],
    ],
  },
  leads: {
    model: Lead,
    prefix: "LD",
    writers: SALES_TEAM,
    readers: ALL,
    workflow: ["New", "Qualified", "Quotation", "Negotiation", "Won"],
    cols: [
      ["name", ...str()],
      ["value", ...num()],
      ["rep", ...str()],
      ["status", ...str(["New", "Qualified", "Quotation", "Negotiation", "Won", "Lost"])],
    ],
  },
  quotations: {
    model: Quotation,
    prefix: "QT",
    writers: SALES_TEAM,
    readers: ALL,
    workflow: ["Draft", "Sent", "Accepted"],
    cols: [
      ["customer", ...str()],
      ["material", ...str()],
      ["quantity", ...num()],
      ["amount", ...num()],
      ["date", ...str()],
      ["validity", ...str()],
      ["status", ...str(["Draft", "Sent", "Accepted", "Rejected"])],
    ],
  },
  "sales-orders": {
    model: SalesOrder,
    prefix: "SO",
    writers: SALES_TEAM,
    readers: ALL,
    workflow: ["Draft", "Confirmed", "Dispatched", "Delivered"],
    cols: [
      ["customer", ...str()],
      ["items", ...str()],
      ["amount", ...num()],
      ["date", ...str()],
      ["rep", ...str()],
      ["status", ...str(["Draft", "Confirmed", "Dispatched", "Delivered", "Cancelled"])],
    ],
  },
  payments: {
    model: Payment,
    prefix: "PAY",
    writers: SALES,
    readers: ALL,
    cols: [
      ["customer", ...str()],
      ["order", ...str()],
      ["amount", ...num()],
      ["method", ...str(["Bank transfer", "UPI", "Cash", "Cheque"])],
      ["date", ...str()],
      ["status", ...str(["Pending", "Partial", "Paid"])],
    ],
  },
  notifications: {
    model: Notification,
    prefix: "NT",
    writers: ALL,
    readers: ALL,
    cols: [
      ["title", ...str()],
      ["user", ...str()],
      ["date", ...str()],
      ["status", ...str(["Unread", "Read"])],
      ["category", ...str()],
    ],
  },
  materials: {
    model: Material,
    prefix: "MAT",
    writers: INV,
    readers: ALL,
    cols: [
      ["name", ...str()],
      ["category", ...str()],
      ["unit", ...str()],
      ["stock", ...num()],
      ["transit", ...num()],
      ["reorder", ...num()],
      ["price", ...num()],
      ["vendor", ...str()],
    ],
  },
};

export function canRead(role, name) {
  const mod = modules[name];
  return Boolean(mod && mod.readers.includes(role));
}

export function canWrite(role, name) {
  const mod = modules[name];
  return Boolean(mod && !mod.readonly && mod.writers.includes(role));
}

export function present(doc) {
  const row = doc.toJSON();
  if (row.status && modules.leads && doc.constructor.modelName === "Lead") row.stage = row.status;
  return row;
}
