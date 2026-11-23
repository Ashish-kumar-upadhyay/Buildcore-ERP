import { HttpError } from "./http.js";
import {
  Customer,
  Department,
  Employee,
  Material,
  MonthlyStat,
  Notification,
  SalesOrder,
  Transaction,
  Vendor,
} from "./models.js";
import { present } from "./registry.js";

const approvers = new Set(["Admin", "Sub-admin", "HR Manager"]);

export function pickFields(mod, body) {
  const out = {};
  for (const [key, type, options] of mod.cols) {
    if (body[key] === undefined || body[key] === null) continue;
    if (type === "number") {
      const n = Number(body[key]);
      if (!Number.isFinite(n)) throw new HttpError(400, `${key} must be a number`);
      out[key] = n;
    } else {
      const value = String(body[key]).trim();
      if (options && !options.includes(value)) throw new HttpError(400, `${key} is not an allowed value`);
      out[key] = value;
    }
  }
  return out;
}

export async function linkRelations(name, data) {
  if (data.vendor) {
    const vendor = await Vendor.findOne({ name: data.vendor });
    if (!vendor && name === "purchases") throw new HttpError(400, `Vendor "${data.vendor}" was not found`);
    if (vendor) data.vendorRef = vendor._id;
  }
  if (data.material) {
    const material = await Material.findOne({ name: data.material });
    if (!material && ["purchases", "quotations", "transactions"].includes(name)) {
      throw new HttpError(400, `Material "${data.material}" was not found`);
    }
    if (material) data.materialRef = material._id;
  }
  if (data.customer) {
    const customer = await Customer.findOne({ name: data.customer });
    if (!customer && ["quotations", "sales-orders", "payments"].includes(name)) {
      throw new HttpError(400, `Customer "${data.customer}" was not found`);
    }
    if (customer) data.customerRef = customer._id;
  }
  if (data.dept) {
    const department = await Department.findOne({ name: data.dept });
    if (!department && name === "employees") throw new HttpError(400, `Department "${data.dept}" was not found`);
    if (department) data.departmentRef = department._id;
  }
  if (data.name && ["leaves", "expenses", "attendance", "representatives"].includes(name)) {
    const employee = await Employee.findOne({ name: data.name });
    if (employee) data.employeeRef = employee._id;
  }
  if (data.rep) {
    const employee = await Employee.findOne({ name: data.rep });
    if (employee) data.repRef = employee._id;
  }
  if (data.manager) {
    const employee = await Employee.findOne({ name: data.manager });
    if (employee) data.managerRef = employee._id;
  }
  if (data.order) {
    const order = await SalesOrder.findOne({ code: data.order });
    if (!order && name === "payments") throw new HttpError(400, `Sales order "${data.order}" was not found`);
    if (order) data.orderRef = order._id;
  }
  if (name === "sales-orders" && data.items) {
    data.lines = await linesFromItems(data.items);
  }
  return data;
}

async function linesFromItems(items) {
  const materials = await Material.find();
  const text = String(items);
  const lines = [];
  for (const material of materials) {
    if (!text.toLowerCase().includes(material.name.toLowerCase())) continue;
    const slice = text.slice(text.toLowerCase().indexOf(material.name.toLowerCase()));
    const qty = slice.match(/[×xX*]\s*([\d,]+(?:\.\d+)?)/);
    if (!qty) continue;
    lines.push({
      material: material.name,
      materialRef: material._id,
      quantity: Number(qty[1].replaceAll(",", "")),
    });
  }
  return lines;
}

export async function notify({ title, user, category, tone, userRef }) {
  const count = await Notification.countDocuments();
  await Notification.create({
    code: `NT-${count + 1}`,
    title,
    user: user || "System",
    userRef,
    date: "just now",
    status: "Unread",
    category: category || "Sales",
    tone: tone || "info",
    createdAt: new Date(),
  });
}

export async function bumpMonth(field, amount) {
  const label = new Date().toLocaleString("en-US", { month: "short" });
  const delta = Math.round((amount / 100000) * 100) / 100;
  const row = await MonthlyStat.findOne({ m: label });
  if (!row) {
    const sort = new Date().getMonth();
    await MonthlyStat.create({ m: label, sales: 0, purchase: 0, sort, [field]: delta });
    return;
  }
  row[field] = Math.round((row[field] + delta) * 100) / 100;
  await row.save();
}

async function stockTransaction({ material, direction, quantity, reference, user, userRef }) {
  const count = await Transaction.countDocuments();
  const today = new Date().toISOString().slice(0, 10);
  await Transaction.create({
    code: `TX-${900 + count + 1}`,
    material: material.name,
    materialRef: material._id,
    direction,
    quantity,
    reference,
    date: today,
    user,
    userRef,
    createdAt: new Date(),
  });
  if (material.stock < material.reorder) {
    await notify({
      title: `low stock alert: ${material.name}`,
      user: "System",
      category: "Inventory",
      tone: "warning",
    });
  }
}

export async function moveMaterialStock({ material, direction, quantity, user, userRef, reference }) {
  if (!Number.isFinite(quantity) || quantity <= 0) throw new HttpError(400, "Enter a quantity greater than zero");
  if (direction === "out" && quantity > material.stock) throw new HttpError(400, "Not enough stock available");
  material.stock += direction === "in" ? quantity : -quantity;
  await material.save();
  await stockTransaction({
    material,
    direction: direction === "in" ? "Stock in" : "Stock out",
    quantity,
    reference: reference || (direction === "in" ? "Manual in" : "Manual out"),
    user,
    userRef,
  });
  return material;
}

export async function applyStatusChange(name, doc, previous, user) {
  if (doc.status === previous) return doc;
  if (["leaves", "expenses"].includes(name) && ["Approved", "Rejected"].includes(doc.status) && !approvers.has(user.role)) {
    throw new HttpError(403, "Only HR managers and administrators can approve requests");
  }
  if (name === "sales-orders" && user.role === "Sales Rep" && doc.rep && doc.rep !== user.name) {
    throw new HttpError(403, "Sales representatives can update their own orders");
  }

  if (name === "purchases") await applyPurchase(doc, user);
  if (name === "sales-orders") await applySalesOrder(doc, user);
  if (name === "leaves" && doc.status === "Approved") {
    await notify({
      title: `approved leave for ${doc.name}`,
      user: user.name,
      userRef: user._id,
      category: "HR",
      tone: "success",
    });
    const employee = await Employee.findOne({ name: doc.name });
    if (employee) {
      employee.status = "On Leave";
      await employee.save();
    }
  }
  if (name === "quotations" && doc.status === "Sent") {
    await notify({
      title: `sent quotation ${doc.code} to ${doc.customer}`,
      user: user.name,
      userRef: user._id,
      category: "Sales",
      tone: "info",
    });
  }
  if (name === "payments" && doc.status === "Paid") {
    await notify({
      title: `recorded payment ${doc.code} from ${doc.customer}`,
      user: user.name,
      userRef: user._id,
      category: "Sales",
      tone: "success",
    });
  }
  return doc;
}

async function applyPurchase(doc, user) {
  const material = await Material.findOne({ name: doc.material });
  if (!material) return;
  if (doc.status === "In transit" && !doc.transitApplied && !doc.receivedApplied) {
    material.transit += doc.quantity;
    doc.transitApplied = true;
    await material.save();
  }
  if (doc.status === "Received" && !doc.receivedApplied) {
    material.stock += doc.quantity;
    if (doc.transitApplied) material.transit = Math.max(0, material.transit - doc.quantity);
    doc.receivedApplied = true;
    doc.transitApplied = false;
    await material.save();
    await stockTransaction({
      material,
      direction: "Stock in",
      quantity: doc.quantity,
      reference: doc.code,
      user: user.name,
      userRef: user._id,
    });
    await bumpMonth("purchase", doc.amount);
    await notify({
      title: `received ${doc.quantity} ${material.unit} ${material.name} (${doc.code})`,
      user: user.name,
      userRef: user._id,
      category: "Inventory",
      tone: "success",
    });
  }
  if (doc.status === "Cancelled" && doc.transitApplied && !doc.receivedApplied) {
    material.transit = Math.max(0, material.transit - doc.quantity);
    doc.transitApplied = false;
    await material.save();
  }
}

async function applySalesOrder(doc, user) {
  if (doc.status === "Dispatched" && !doc.stockApplied) {
    const lines = doc.lines?.length ? doc.lines : await linesFromItems(doc.items);
    for (const line of lines) {
      const material = await Material.findOne({ name: line.material });
      if (!material) continue;
      if (material.stock < line.quantity) {
        throw new HttpError(400, `Not enough stock available for ${material.name}`);
      }
    }
    for (const line of lines) {
      const material = await Material.findOne({ name: line.material });
      if (!material) continue;
      material.stock -= line.quantity;
      await material.save();
      await stockTransaction({
        material,
        direction: "Stock out",
        quantity: line.quantity,
        reference: doc.code,
        user: user.name,
        userRef: user._id,
      });
    }
    doc.lines = lines;
    doc.stockApplied = true;
    await bumpMonth("sales", doc.amount);
    await notify({
      title: `dispatched ${doc.code} to ${doc.customer}`,
      user: user.name,
      userRef: user._id,
      category: "Sales",
      tone: "info",
    });
  }
}

export function shape(name, doc) {
  const row = present(doc);
  if (name === "leads") row.stage = row.status;
  if (name === "low-stock") row.shortfall = Number(row.reorder) - Number(row.stock);
  for (const key of Object.keys(row)) {
    if (key.endsWith("Ref") || key.endsWith("Applied") || ["lines", "stockApplied", "createdAt", "updatedAt", "passwordHash"].includes(key)) {
      delete row[key];
    }
  }
  return row;
}

export async function lowStockRows() {
  const materials = await Material.find({ $expr: { $lt: ["$stock", "$reorder"] } }).sort({ createdAt: -1 });
  return materials.map((material) => shape("low-stock", material));
}
