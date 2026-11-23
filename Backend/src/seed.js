import bcrypt from "bcryptjs";
import {
  Attendance,
  Customer,
  Department,
  Employee,
  Expense,
  Lead,
  Leave,
  Material,
  MonthlyStat,
  Notification,
  Payment,
  Purchase,
  Quotation,
  Representative,
  SalesOrder,
  Transaction,
  User,
  Vendor,
} from "./models.js";

const stamp = (rows) => {
  const base = Date.now();
  return rows.map((row, index) => ({ ...row, createdAt: new Date(base - index * 1000) }));
};

async function insert(Model, rows) {
  if (!rows.length) return;
  await Model.insertMany(stamp(rows));
}

export async function seedIfEmpty() {
  if (await User.countDocuments()) return false;

  const password = await bcrypt.hash("Admin@123", 10);
  const passwords = {
    "Subadmin@123": await bcrypt.hash("Subadmin@123", 10),
    "Hr@123456": await bcrypt.hash("Hr@123456", 10),
    "Inventory@123": await bcrypt.hash("Inventory@123", 10),
    "Sales@12345": await bcrypt.hash("Sales@12345", 10),
    "Salesrep@123": await bcrypt.hash("Salesrep@123", 10),
    "Employee@123": await bcrypt.hash("Employee@123", 10),
  };

  await insert(User, [
    { code: "USR-1", name: "Ishaan Arora", email: "ishaan@buildcore.com", passwordHash: password, role: "Admin" },
    { code: "USR-2", name: "Ishita Das", email: "ishita@buildcore.com", passwordHash: passwords["Subadmin@123"], role: "Sub-admin", employeeCode: "EMP-110" },
    { code: "USR-3", name: "Priya Sharma", email: "priya@buildcore.com", passwordHash: passwords["Hr@123456"], role: "HR Manager", employeeCode: "EMP-102" },
    { code: "USR-4", name: "Aarav Mehta", email: "aarav@buildcore.com", passwordHash: passwords["Inventory@123"], role: "Inventory Manager", employeeCode: "EMP-101" },
    { code: "USR-5", name: "Rohan Verma", email: "rohan@buildcore.com", passwordHash: passwords["Sales@12345"], role: "Sales Manager", employeeCode: "EMP-103" },
    { code: "USR-6", name: "Karan Singh", email: "karan@buildcore.com", passwordHash: passwords["Salesrep@123"], role: "Sales Rep", employeeCode: "EMP-105" },
    { code: "USR-7", name: "Ananya Gupta", email: "ananya@buildcore.com", passwordHash: passwords["Employee@123"], role: "Employee", employeeCode: "EMP-108" },
  ]);

  const departments = stamp([
    ["Warehouse", "Aarav Mehta"],
    ["Human Resources", "Priya Sharma"],
    ["Sales", "Rohan Verma"],
    ["Finance", "Sneha Iyer"],
    ["Logistics", "Vikram Rao"],
    ["Procurement", "Arjun Patel"],
    ["Admin", "Ishita Das"],
  ].map(([name, manager], i) => ({
    code: `DEP-${i + 1}`,
    name,
    manager,
    location: "Indore · HQ",
    status: "Active",
  })));
  await Department.insertMany(departments);
  const deptByName = Object.fromEntries((await Department.find()).map((d) => [d.name, d._id]));

  const employees = stamp([
    ["EMP-101", "Aarav Mehta", "Inventory Manager", "Warehouse", "Present", "09:02"],
    ["EMP-102", "Priya Sharma", "HR Manager", "Human Resources", "Present", "08:55"],
    ["EMP-103", "Rohan Verma", "Sales Manager", "Sales", "Present", "09:15"],
    ["EMP-104", "Sneha Iyer", "Accountant", "Finance", "On Leave", "—"],
    ["EMP-105", "Karan Singh", "Sales Rep", "Sales", "Field", "08:40"],
    ["EMP-106", "Meera Nair", "Sales Rep", "Sales", "Present", "09:05"],
    ["EMP-107", "Vikram Rao", "Driver", "Logistics", "Field", "07:30"],
    ["EMP-108", "Ananya Gupta", "Store Keeper", "Warehouse", "Absent", "—"],
    ["EMP-109", "Arjun Patel", "Purchase Exec", "Procurement", "Present", "09:20"],
    ["EMP-110", "Ishita Das", "Sub-admin", "Admin", "Present", "08:48"],
  ].map(([code, name, role, dept, status, checkIn]) => ({
    code, name, role, dept, status, checkIn, departmentRef: deptByName[dept],
  })));
  await Employee.insertMany(employees);
  const empByName = Object.fromEntries((await Employee.find()).map((e) => [e.name, e._id]));
  for (const department of await Department.find()) {
    department.managerRef = empByName[department.manager];
    await department.save();
  }

  const vendors = stamp([
    ["VEN-001", "UltraTech Ltd", "Anil Desai", "anil@example.com", "9876501001", "Cement"],
    ["VEN-002", "ACC Cements", "Neha Shah", "neha@example.com", "9876501002", "Cement"],
    ["VEN-003", "Tata Tiscon", "Raj Malhotra", "raj@example.com", "9876501003", "Steel"],
    ["VEN-004", "JSW Steel", "Dev Kumar", "dev@example.com", "9876501004", "Steel"],
    ["VEN-005", "Narmada Aggregates", "Mohan Patel", "mohan@example.com", "9876501005", "Aggregate"],
  ].map(([code, name, contact, email, phone, category]) => ({
    code, name, contact, email, phone, category, status: "Active",
  })));
  await Vendor.insertMany(vendors);
  const vendorByName = Object.fromEntries((await Vendor.find()).map((v) => [v.name, v._id]));

  const customerNames = ["Skyline Builders", "Greenfield Infra", "Om Constructions", "Urban Nest Homes", "Metro Realty", "Patel & Sons", "Horizon Developers", "Silver Oak Villas", "City Mall Project", "Lakeview Towers"];
  await Customer.insertMany(stamp(customerNames.map((name, i) => ({
    code: `CUS-${101 + i}`,
    name,
    contact: ["Amit Shah", "Ritu Mehta", "Om Patel", "Nisha Rao", "Rahul Jain"][i % 5],
    email: `accounts${i + 1}@example.com`,
    phone: `987651${String(i + 1).padStart(4, "0")}`,
    city: ["Indore", "Bhopal", "Ujjain"][i % 3],
    status: "Active",
  }))));
  const customerByName = Object.fromEntries((await Customer.find()).map((c) => [c.name, c._id]));

  const materials = [
    ["MAT-001", "UltraTech OPC 53 Cement", "Cement", "bags", 1240, 300, 400, 410, "UltraTech Ltd"],
    ["MAT-002", "ACC PPC Cement", "Cement", "bags", 320, 0, 400, 385, "ACC Cements"],
    ["MAT-003", "TMT Bar Fe550 12mm", "Steel", "tons", 48, 12, 20, 62000, "Tata Tiscon"],
    ["MAT-004", "TMT Bar Fe500 8mm", "Steel", "tons", 14, 6, 15, 59500, "JSW Steel"],
    ["MAT-005", "River Sand (Fine)", "Sand", "cu.ft", 8600, 2000, 3000, 58, "Narmada Aggregates"],
    ["MAT-006", "M-Sand", "Sand", "cu.ft", 2100, 0, 2500, 45, "Narmada Aggregates"],
    ["MAT-007", "Red Clay Bricks", "Bricks", "pcs", 42000, 10000, 15000, 8, "Shree Brick Works"],
    ["MAT-008", "AAC Blocks 600x200", "Bricks", "pcs", 3600, 0, 2000, 62, "Magicrete"],
    ["MAT-009", "20mm Aggregate", "Aggregate", "cu.ft", 5400, 1500, 2000, 42, "Narmada Aggregates"],
    ["MAT-010", "Binding Wire 18G", "Steel", "kg", 180, 0, 250, 85, "JSW Steel"],
    ["MAT-011", "Waterproofing Compound", "Chemicals", "ltr", 640, 120, 200, 220, "Dr. Fixit"],
    ["MAT-012", "Fly Ash Bricks", "Bricks", "pcs", 18500, 0, 10000, 6, "Shree Brick Works"],
    ["MAT-013", "10mm Aggregate", "Aggregate", "cu.ft", 2400, 0, 1000, 38, "Narmada Aggregates"],
    ["MAT-014", "TMT Bar Fe550 16mm", "Steel", "tons", 24, 4, 10, 63000, "Tata Tiscon"],
    ["MAT-015", "White Cement", "Cement", "bags", 180, 0, 100, 790, "UltraTech Ltd"],
  ].map(([code, name, category, unit, stock, transit, reorder, price, vendor]) => ({
    code, name, category, unit, stock, transit, reorder, price, vendor, vendorRef: vendorByName[vendor],
  }));
  await Material.insertMany(stamp(materials));
  const matByName = Object.fromEntries((await Material.find()).map((m) => [m.name, m]));

  await Purchase.insertMany(stamp([
    { code: "PO-118", vendor: "UltraTech Ltd", material: "UltraTech OPC 53 Cement", quantity: 300, amount: 123000, date: "2026-11-21", status: "Received", receivedApplied: true },
    { code: "PO-119", vendor: "Tata Tiscon", material: "TMT Bar Fe550 12mm", quantity: 12, amount: 744000, date: "2026-11-22", status: "In transit", transitApplied: true },
    { code: "PO-120", vendor: "ACC Cements", material: "ACC PPC Cement", quantity: 500, amount: 192500, date: "2026-11-23", status: "Ordered" },
    { code: "PO-121", vendor: "Narmada Aggregates", material: "River Sand (Fine)", quantity: 2000, amount: 116000, date: "2026-11-23", status: "Draft" },
  ].map((row) => ({ ...row, vendorRef: vendorByName[row.vendor], materialRef: matByName[row.material]?._id }))));

  await Transaction.insertMany(stamp([
    { code: "TX-901", material: "UltraTech OPC 53 Cement", direction: "Stock in", quantity: 300, reference: "PO-118", date: "2026-11-21", user: "Aarav Mehta" },
    { code: "TX-902", material: "Red Clay Bricks", direction: "Stock out", quantity: 20000, reference: "SO-2040", date: "2026-11-20", user: "Aarav Mehta" },
    { code: "TX-903", material: "River Sand (Fine)", direction: "Stock out", quantity: 4000, reference: "SO-2039", date: "2026-11-19", user: "Ananya Gupta" },
  ].map((row) => ({ ...row, materialRef: matByName[row.material]?._id }))));

  await Attendance.insertMany(stamp([
    ["EMP-101", "Aarav Mehta", "Warehouse", "09:02", "Present"],
    ["EMP-102", "Priya Sharma", "Human Resources", "08:55", "Present"],
    ["EMP-103", "Rohan Verma", "Sales", "09:15", "Present"],
    ["EMP-104", "Sneha Iyer", "Finance", "—", "On Leave"],
    ["EMP-105", "Karan Singh", "Sales", "08:40", "Field"],
    ["EMP-106", "Meera Nair", "Sales", "09:05", "Present"],
    ["EMP-107", "Vikram Rao", "Logistics", "07:30", "Field"],
    ["EMP-108", "Ananya Gupta", "Warehouse", "—", "Absent"],
    ["EMP-109", "Arjun Patel", "Procurement", "09:20", "Present"],
    ["EMP-110", "Ishita Das", "Admin", "08:48", "Present"],
  ].map(([code, name, dept, checkIn, status]) => ({
    code, name, dept, checkIn, checkOut: "—", status, date: "2026-11-23", employeeRef: empByName[name],
  }))));

  await Leave.insertMany(stamp([
    { code: "LV-31", name: "Sneha Iyer", type: "Sick", from: "21 Nov", to: "23 Nov", days: 3, status: "Approved" },
    { code: "LV-32", name: "Karan Singh", type: "Casual", from: "25 Nov", to: "25 Nov", days: 1, status: "Pending" },
    { code: "LV-33", name: "Ananya Gupta", type: "Earned", from: "28 Nov", to: "02 Dec", days: 5, status: "Pending" },
    { code: "LV-34", name: "Vikram Rao", type: "Casual", from: "18 Nov", to: "18 Nov", days: 1, status: "Rejected" },
  ].map((row) => ({ ...row, employeeRef: empByName[row.name] }))));

  await Expense.insertMany(stamp([
    { code: "EX-801", name: "Karan Singh", category: "Fuel", amount: 2400, date: "20 Nov", status: "Pending" },
    { code: "EX-802", name: "Meera Nair", category: "Client Meeting", amount: 1850, date: "19 Nov", status: "Pending" },
    { code: "EX-803", name: "Vikram Rao", category: "Toll", amount: 640, date: "19 Nov", status: "Approved" },
  ].map((row) => ({ ...row, employeeRef: empByName[row.name] }))));

  await Representative.insertMany(stamp([
    ["EMP-103", "Rohan Verma", "Sales Manager", "Present"],
    ["EMP-105", "Karan Singh", "Sales Rep", "Field"],
    ["EMP-106", "Meera Nair", "Sales Rep", "Present"],
  ].map(([code, name, role, status]) => ({
    code, name, role, status, territory: "Indore", target: 1000000, employeeRef: empByName[name],
  }))));

  await Lead.insertMany(stamp([
    { code: "LD-101", name: "Horizon Developers", value: 1250000, status: "Negotiation", rep: "Rohan Verma" },
    { code: "LD-102", name: "Silver Oak Villas", value: 480000, status: "Quotation", rep: "Meera Nair" },
    { code: "LD-103", name: "City Mall Project", value: 3200000, status: "Qualified", rep: "Karan Singh" },
    { code: "LD-104", name: "Lakeview Towers", value: 890000, status: "New", rep: "Meera Nair" },
  ].map((row) => ({ ...row, repRef: empByName[row.rep] }))));

  await Quotation.insertMany(stamp([
    { code: "QT-551", customer: "Silver Oak Villas", material: "UltraTech OPC 53 Cement", quantity: 500, amount: 205000, date: "2026-11-21", validity: "2026-12-05", status: "Sent" },
    { code: "QT-552", customer: "Horizon Developers", material: "TMT Bar Fe550 12mm", quantity: 20, amount: 1240000, date: "2026-11-22", validity: "2026-12-06", status: "Accepted" },
    { code: "QT-553", customer: "Lakeview Towers", material: "AAC Blocks 600x200", quantity: 1200, amount: 74400, date: "2026-11-23", validity: "2026-12-07", status: "Draft" },
  ].map((row) => ({
    ...row,
    customerRef: customerByName[row.customer],
    materialRef: matByName[row.material]?._id,
  }))));

  const line = (name, quantity) => ({ material: name, materialRef: matByName[name]?._id, quantity });
  await SalesOrder.insertMany(stamp([
    { code: "SO-2041", customer: "Skyline Builders", items: "Cement ×500, TMT 12mm ×8t", amount: 701000, status: "Dispatched", date: "21 Nov", rep: "Karan Singh", stockApplied: true, lines: [line("UltraTech OPC 53 Cement", 500), line("TMT Bar Fe550 12mm", 8)] },
    { code: "SO-2040", customer: "Greenfield Infra", items: "Red Bricks ×20,000", amount: 160000, status: "Confirmed", date: "20 Nov", rep: "Meera Nair", lines: [line("Red Clay Bricks", 20000)] },
    { code: "SO-2039", customer: "Om Constructions", items: "River Sand ×4,000 cu.ft", amount: 232000, status: "Delivered", date: "19 Nov", rep: "Karan Singh", stockApplied: true, lines: [line("River Sand (Fine)", 4000)] },
    { code: "SO-2038", customer: "Urban Nest Homes", items: "AAC Blocks ×1,200", amount: 74400, status: "Draft", date: "19 Nov", rep: "Meera Nair", lines: [line("AAC Blocks 600x200", 1200)] },
    { code: "SO-2037", customer: "Metro Realty", items: "TMT 8mm ×5t, Wire ×100kg", amount: 306000, status: "Delivered", date: "18 Nov", rep: "Rohan Verma", stockApplied: true, lines: [line("TMT Bar Fe500 8mm", 5), line("Binding Wire 18G", 100)] },
    { code: "SO-2036", customer: "Patel & Sons", items: "Cement ×200", amount: 77000, status: "Cancelled", date: "17 Nov", rep: "Karan Singh", lines: [line("UltraTech OPC 53 Cement", 200)] },
  ].map((row) => ({ ...row, customerRef: customerByName[row.customer], repRef: empByName[row.rep] }))));
  const orderByCode = Object.fromEntries((await SalesOrder.find()).map((o) => [o.code, o._id]));

  await Payment.insertMany(stamp([
    { code: "PAY-501", customer: "Om Constructions", order: "SO-2039", amount: 232000, method: "Bank transfer", date: "2026-11-20", status: "Paid" },
    { code: "PAY-502", customer: "Skyline Builders", order: "SO-2041", amount: 350500, method: "Bank transfer", date: "2026-11-22", status: "Partial" },
    { code: "PAY-503", customer: "Metro Realty", order: "SO-2037", amount: 306000, method: "Cheque", date: "2026-11-21", status: "Pending" },
  ].map((row) => ({ ...row, customerRef: customerByName[row.customer], orderRef: orderByCode[row.order] }))));

  await Notification.insertMany(stamp([
    { code: "NT-1", title: "received 300 bags OPC Cement (PO-118)", user: "Aarav Mehta", date: "4m ago", status: "Unread", category: "Inventory", tone: "success" },
    { code: "NT-2", title: "dispatched SO-2041 to Skyline Builders", user: "Karan Singh", date: "22m ago", status: "Unread", category: "Sales", tone: "info" },
    { code: "NT-3", title: "low stock alert: ACC PPC Cement", user: "System", date: "1h ago", status: "Unread", category: "Inventory", tone: "warning" },
    { code: "NT-4", title: "approved leave for Sneha Iyer", user: "Priya Sharma", date: "2h ago", status: "Unread", category: "HR", tone: "success" },
    { code: "NT-5", title: "sent quotation QT-551 to Silver Oak Villas", user: "Meera Nair", date: "3h ago", status: "Unread", category: "Sales", tone: "info" },
  ]));

  await MonthlyStat.insertMany([
    { m: "Jun", sales: 28, purchase: 19, sort: 6 },
    { m: "Jul", sales: 34, purchase: 22, sort: 7 },
    { m: "Aug", sales: 31, purchase: 24, sort: 8 },
    { m: "Sep", sales: 42, purchase: 27, sort: 9 },
    { m: "Oct", sales: 47, purchase: 30, sort: 10 },
    { m: "Nov", sales: 55, purchase: 33, sort: 11 },
  ]);

  console.log("Seeded BuildCore ERP workspace");
  console.log("Admin login: ishaan@buildcore.com / Admin@123");
  return true;
}
