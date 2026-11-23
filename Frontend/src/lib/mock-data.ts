export type Material = {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  transit: number;
  reorder: number;
  price: number;
  vendor: string;
};
export const materials: Material[] = [
  {
    id: "MAT-001",
    name: "UltraTech OPC 53 Cement",
    category: "Cement",
    unit: "bags",
    stock: 1240,
    transit: 300,
    reorder: 400,
    price: 410,
    vendor: "UltraTech Ltd",
  },
  {
    id: "MAT-002",
    name: "ACC PPC Cement",
    category: "Cement",
    unit: "bags",
    stock: 320,
    transit: 0,
    reorder: 400,
    price: 385,
    vendor: "ACC Cements",
  },
  {
    id: "MAT-003",
    name: "TMT Bar Fe550 12mm",
    category: "Steel",
    unit: "tons",
    stock: 48,
    transit: 12,
    reorder: 20,
    price: 62000,
    vendor: "Tata Tiscon",
  },
  {
    id: "MAT-004",
    name: "TMT Bar Fe500 8mm",
    category: "Steel",
    unit: "tons",
    stock: 14,
    transit: 6,
    reorder: 15,
    price: 59500,
    vendor: "JSW Steel",
  },
  {
    id: "MAT-005",
    name: "River Sand (Fine)",
    category: "Sand",
    unit: "cu.ft",
    stock: 8600,
    transit: 2000,
    reorder: 3000,
    price: 58,
    vendor: "Narmada Aggregates",
  },
  {
    id: "MAT-006",
    name: "M-Sand",
    category: "Sand",
    unit: "cu.ft",
    stock: 2100,
    transit: 0,
    reorder: 2500,
    price: 45,
    vendor: "Narmada Aggregates",
  },
  {
    id: "MAT-007",
    name: "Red Clay Bricks",
    category: "Bricks",
    unit: "pcs",
    stock: 42000,
    transit: 10000,
    reorder: 15000,
    price: 8,
    vendor: "Shree Brick Works",
  },
  {
    id: "MAT-008",
    name: "AAC Blocks 600x200",
    category: "Bricks",
    unit: "pcs",
    stock: 3600,
    transit: 0,
    reorder: 2000,
    price: 62,
    vendor: "Magicrete",
  },
  {
    id: "MAT-009",
    name: "20mm Aggregate",
    category: "Aggregate",
    unit: "cu.ft",
    stock: 5400,
    transit: 1500,
    reorder: 2000,
    price: 42,
    vendor: "Narmada Aggregates",
  },
  {
    id: "MAT-010",
    name: "Binding Wire 18G",
    category: "Steel",
    unit: "kg",
    stock: 180,
    transit: 0,
    reorder: 250,
    price: 85,
    vendor: "JSW Steel",
  },
  {
    id: "MAT-011",
    name: "Waterproofing Compound",
    category: "Chemicals",
    unit: "ltr",
    stock: 640,
    transit: 120,
    reorder: 200,
    price: 220,
    vendor: "Dr. Fixit",
  },
  {
    id: "MAT-012",
    name: "Fly Ash Bricks",
    category: "Bricks",
    unit: "pcs",
    stock: 18500,
    transit: 0,
    reorder: 10000,
    price: 6,
    vendor: "Shree Brick Works",
  },
  {
    id: "MAT-013",
    name: "10mm Aggregate",
    category: "Aggregate",
    unit: "cu.ft",
    stock: 2400,
    transit: 0,
    reorder: 1000,
    price: 38,
    vendor: "Narmada Aggregates",
  },
  {
    id: "MAT-014",
    name: "TMT Bar Fe550 16mm",
    category: "Steel",
    unit: "tons",
    stock: 24,
    transit: 4,
    reorder: 10,
    price: 63000,
    vendor: "Tata Tiscon",
  },
  {
    id: "MAT-015",
    name: "White Cement",
    category: "Cement",
    unit: "bags",
    stock: 180,
    transit: 0,
    reorder: 100,
    price: 790,
    vendor: "UltraTech Ltd",
  },
];

export const employees = [
  {
    id: "EMP-101",
    name: "Aarav Mehta",
    role: "Inventory Manager",
    dept: "Warehouse",
    status: "Present",
    checkIn: "09:02",
  },
  {
    id: "EMP-102",
    name: "Priya Sharma",
    role: "HR Manager",
    dept: "Human Resources",
    status: "Present",
    checkIn: "08:55",
  },
  {
    id: "EMP-103",
    name: "Rohan Verma",
    role: "Sales Manager",
    dept: "Sales",
    status: "Present",
    checkIn: "09:15",
  },
  {
    id: "EMP-104",
    name: "Sneha Iyer",
    role: "Accountant",
    dept: "Finance",
    status: "On Leave",
    checkIn: "—",
  },
  {
    id: "EMP-105",
    name: "Karan Singh",
    role: "Sales Rep",
    dept: "Sales",
    status: "Field",
    checkIn: "08:40",
  },
  {
    id: "EMP-106",
    name: "Meera Nair",
    role: "Sales Rep",
    dept: "Sales",
    status: "Present",
    checkIn: "09:05",
  },
  {
    id: "EMP-107",
    name: "Vikram Rao",
    role: "Driver",
    dept: "Logistics",
    status: "Field",
    checkIn: "07:30",
  },
  {
    id: "EMP-108",
    name: "Ananya Gupta",
    role: "Store Keeper",
    dept: "Warehouse",
    status: "Absent",
    checkIn: "—",
  },
  {
    id: "EMP-109",
    name: "Arjun Patel",
    role: "Purchase Exec",
    dept: "Procurement",
    status: "Present",
    checkIn: "09:20",
  },
  {
    id: "EMP-110",
    name: "Ishita Das",
    role: "Sub-admin",
    dept: "Admin",
    status: "Present",
    checkIn: "08:48",
  },
];

export type Leave = {
  id: string;
  name: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: "Pending" | "Approved" | "Rejected";
};
export const leaves: Leave[] = [
  {
    id: "LV-31",
    name: "Sneha Iyer",
    type: "Sick",
    from: "21 Nov",
    to: "23 Nov",
    days: 3,
    status: "Approved",
  },
  {
    id: "LV-32",
    name: "Karan Singh",
    type: "Casual",
    from: "25 Nov",
    to: "25 Nov",
    days: 1,
    status: "Pending",
  },
  {
    id: "LV-33",
    name: "Ananya Gupta",
    type: "Earned",
    from: "28 Nov",
    to: "02 Dec",
    days: 5,
    status: "Pending",
  },
  {
    id: "LV-34",
    name: "Vikram Rao",
    type: "Casual",
    from: "18 Nov",
    to: "18 Nov",
    days: 1,
    status: "Rejected",
  },
];

export type Expense = {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
};
export const expenses: Expense[] = [
  {
    id: "EX-801",
    name: "Karan Singh",
    category: "Fuel",
    amount: 2400,
    date: "20 Nov",
    status: "Pending",
  },
  {
    id: "EX-802",
    name: "Meera Nair",
    category: "Client Meeting",
    amount: 1850,
    date: "19 Nov",
    status: "Pending",
  },
  {
    id: "EX-803",
    name: "Vikram Rao",
    category: "Toll",
    amount: 640,
    date: "19 Nov",
    status: "Approved",
  },
];

export type OrderStatus = "Draft" | "Confirmed" | "Dispatched" | "Delivered" | "Cancelled";
export const orders: {
  id: string;
  customer: string;
  items: string;
  amount: number;
  status: OrderStatus;
  date: string;
  rep: string;
}[] = [
  {
    id: "SO-2041",
    customer: "Skyline Builders",
    items: "Cement ×500, TMT 12mm ×8t",
    amount: 701000,
    status: "Dispatched",
    date: "21 Nov",
    rep: "Karan Singh",
  },
  {
    id: "SO-2040",
    customer: "Greenfield Infra",
    items: "Red Bricks ×20,000",
    amount: 160000,
    status: "Confirmed",
    date: "20 Nov",
    rep: "Meera Nair",
  },
  {
    id: "SO-2039",
    customer: "Om Constructions",
    items: "River Sand ×4,000 cu.ft",
    amount: 232000,
    status: "Delivered",
    date: "19 Nov",
    rep: "Karan Singh",
  },
  {
    id: "SO-2038",
    customer: "Urban Nest Homes",
    items: "AAC Blocks ×1,200",
    amount: 74400,
    status: "Draft",
    date: "19 Nov",
    rep: "Meera Nair",
  },
  {
    id: "SO-2037",
    customer: "Metro Realty",
    items: "TMT 8mm ×5t, Wire ×100kg",
    amount: 306000,
    status: "Delivered",
    date: "18 Nov",
    rep: "Rohan Verma",
  },
  {
    id: "SO-2036",
    customer: "Patel & Sons",
    items: "Cement ×200",
    amount: 77000,
    status: "Cancelled",
    date: "17 Nov",
    rep: "Karan Singh",
  },
];

export const leads = [
  { name: "Horizon Developers", value: 1250000, stage: "Negotiation", rep: "Rohan Verma" },
  { name: "Silver Oak Villas", value: 480000, stage: "Quotation", rep: "Meera Nair" },
  { name: "City Mall Project", value: 3200000, stage: "Qualified", rep: "Karan Singh" },
  { name: "Lakeview Towers", value: 890000, stage: "New", rep: "Meera Nair" },
];

export const monthlySales = [
  { m: "Jun", sales: 28, purchase: 19 },
  { m: "Jul", sales: 34, purchase: 22 },
  { m: "Aug", sales: 31, purchase: 24 },
  { m: "Sep", sales: 42, purchase: 27 },
  { m: "Oct", sales: 47, purchase: 30 },
  { m: "Nov", sales: 55, purchase: 33 },
];

export const activities = [
  {
    who: "Aarav Mehta",
    what: "received 300 bags OPC Cement (PO-118)",
    when: "4m ago",
    tone: "success",
  },
  {
    who: "Karan Singh",
    what: "dispatched SO-2041 to Skyline Builders",
    when: "22m ago",
    tone: "info",
  },
  { who: "System", what: "low stock alert: ACC PPC Cement", when: "1h ago", tone: "warning" },
  { who: "Priya Sharma", what: "approved leave for Sneha Iyer", when: "2h ago", tone: "success" },
  {
    who: "Meera Nair",
    what: "sent quotation QT-551 to Silver Oak Villas",
    when: "3h ago",
    tone: "info",
  },
];

export const inr = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(n >= 1000000 ? 1 : 2)}L` : `₹${n.toLocaleString("en-IN")}`;

export type DemoRecord = { id: string; [key: string]: string | number };
export const vendors: DemoRecord[] = [
  {
    id: "VEN-001",
    name: "UltraTech Ltd",
    contact: "Anil Desai",
    email: "anil@example.com",
    phone: "9876501001",
    category: "Cement",
    status: "Active",
  },
  {
    id: "VEN-002",
    name: "ACC Cements",
    contact: "Neha Shah",
    email: "neha@example.com",
    phone: "9876501002",
    category: "Cement",
    status: "Active",
  },
  {
    id: "VEN-003",
    name: "Tata Tiscon",
    contact: "Raj Malhotra",
    email: "raj@example.com",
    phone: "9876501003",
    category: "Steel",
    status: "Active",
  },
  {
    id: "VEN-004",
    name: "JSW Steel",
    contact: "Dev Kumar",
    email: "dev@example.com",
    phone: "9876501004",
    category: "Steel",
    status: "Active",
  },
  {
    id: "VEN-005",
    name: "Narmada Aggregates",
    contact: "Mohan Patel",
    email: "mohan@example.com",
    phone: "9876501005",
    category: "Aggregate",
    status: "Active",
  },
];
export const customers: DemoRecord[] = [
  "Skyline Builders",
  "Greenfield Infra",
  "Om Constructions",
  "Urban Nest Homes",
  "Metro Realty",
  "Patel & Sons",
  "Horizon Developers",
  "Silver Oak Villas",
  "City Mall Project",
  "Lakeview Towers",
].map((name, i) => ({
  id: `CUS-${101 + i}`,
  name,
  contact: ["Amit Shah", "Ritu Mehta", "Om Patel", "Nisha Rao", "Rahul Jain"][i % 5] ?? "Amit Shah",
  email: `accounts${i + 1}@example.com`,
  phone: `987651${String(i + 1).padStart(4, "0")}`,
  city: ["Indore", "Bhopal", "Ujjain"][i % 3] ?? "Indore",
  status: "Active",
}));
export const purchases: DemoRecord[] = [
  {
    id: "PO-118",
    vendor: "UltraTech Ltd",
    material: "UltraTech OPC 53 Cement",
    quantity: 300,
    amount: 123000,
    date: "2026-11-21",
    status: "Received",
  },
  {
    id: "PO-119",
    vendor: "Tata Tiscon",
    material: "TMT Bar Fe550 12mm",
    quantity: 12,
    amount: 744000,
    date: "2026-11-22",
    status: "In transit",
  },
  {
    id: "PO-120",
    vendor: "ACC Cements",
    material: "ACC PPC Cement",
    quantity: 500,
    amount: 192500,
    date: "2026-11-23",
    status: "Ordered",
  },
  {
    id: "PO-121",
    vendor: "Narmada Aggregates",
    material: "River Sand (Fine)",
    quantity: 2000,
    amount: 116000,
    date: "2026-11-23",
    status: "Draft",
  },
];
export const transactions: DemoRecord[] = [
  {
    id: "TX-901",
    material: "UltraTech OPC 53 Cement",
    direction: "Stock in",
    quantity: 300,
    reference: "PO-118",
    date: "2026-11-21",
    user: "Aarav Mehta",
  },
  {
    id: "TX-902",
    material: "Red Clay Bricks",
    direction: "Stock out",
    quantity: 20000,
    reference: "SO-2040",
    date: "2026-11-20",
    user: "Aarav Mehta",
  },
  {
    id: "TX-903",
    material: "River Sand (Fine)",
    direction: "Stock out",
    quantity: 4000,
    reference: "SO-2039",
    date: "2026-11-19",
    user: "Ananya Gupta",
  },
];
export const departments: DemoRecord[] = [
  "Warehouse",
  "Human Resources",
  "Sales",
  "Finance",
  "Logistics",
  "Procurement",
  "Admin",
].map((name, i) => ({
  id: `DEP-${i + 1}`,
  name,
  manager:
    [
      "Aarav Mehta",
      "Priya Sharma",
      "Rohan Verma",
      "Sneha Iyer",
      "Vikram Rao",
      "Arjun Patel",
      "Ishita Das",
    ][i] ?? "",
  location: "Indore · HQ",
  status: "Active",
}));
export const quotations: DemoRecord[] = [
  {
    id: "QT-551",
    customer: "Silver Oak Villas",
    material: "UltraTech OPC 53 Cement",
    quantity: 500,
    amount: 205000,
    date: "2026-11-21",
    validity: "2026-12-05",
    status: "Sent",
  },
  {
    id: "QT-552",
    customer: "Horizon Developers",
    material: "TMT Bar Fe550 12mm",
    quantity: 20,
    amount: 1240000,
    date: "2026-11-22",
    validity: "2026-12-06",
    status: "Accepted",
  },
  {
    id: "QT-553",
    customer: "Lakeview Towers",
    material: "AAC Blocks 600x200",
    quantity: 1200,
    amount: 74400,
    date: "2026-11-23",
    validity: "2026-12-07",
    status: "Draft",
  },
];
export const payments: DemoRecord[] = [
  {
    id: "PAY-501",
    customer: "Om Constructions",
    order: "SO-2039",
    amount: 232000,
    method: "Bank transfer",
    date: "2026-11-20",
    status: "Paid",
  },
  {
    id: "PAY-502",
    customer: "Skyline Builders",
    order: "SO-2041",
    amount: 350500,
    method: "Bank transfer",
    date: "2026-11-22",
    status: "Partial",
  },
  {
    id: "PAY-503",
    customer: "Metro Realty",
    order: "SO-2037",
    amount: 306000,
    method: "Cheque",
    date: "2026-11-21",
    status: "Pending",
  },
];
export const notifications: DemoRecord[] = activities.map((a, i) => ({
  id: `NT-${i + 1}`,
  title: a.what,
  user: a.who,
  date: a.when,
  status: "Unread",
  category: a.tone === "warning" ? "Inventory" : a.who === "Priya Sharma" ? "HR" : "Sales",
}));
