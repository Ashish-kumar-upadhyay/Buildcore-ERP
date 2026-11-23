import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { hashPassword, hashToken, newResetToken, publicUser, requireAuth, signToken } from "./auth.js";
import { applyStatusChange, linkRelations, lowStockRows, moveMaterialStock, pickFields, shape } from "./domain.js";
import { HttpError, asyncRoute, readBody } from "./http.js";
import {
  AccessRequest,
  Customer,
  Employee,
  Leave,
  Material,
  MonthlyStat,
  Notification,
  SalesOrder,
  Shift,
  User,
  Vendor,
} from "./models.js";
import { canRead, canWrite, modules } from "./registry.js";

const router = Router();
const approvers = new Set(["Admin", "Sub-admin", "HR Manager"]);
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Try again shortly." },
});

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "buildcore-erp" });
});

router.post(
  "/auth/login",
  loginLimit,
  asyncRoute(async (req, res) => {
    const body = readBody(req);
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, "Email or password is incorrect");
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  }),
);

router.get(
  "/auth/me",
  requireAuth,
  asyncRoute(async (req, res) => {
    res.json({ user: publicUser(req.user) });
  }),
);

router.post(
  "/auth/forgot",
  loginLimit,
  asyncRoute(async (req, res) => {
    const email = String(readBody(req).email || "").toLowerCase().trim();
    const user = await User.findOne({ email });
    if (!user) {
      res.json({ message: "If that account exists, a reset token has been issued." });
      return;
    }
    const resetToken = newResetToken();
    user.resetTokenHash = hashToken(resetToken);
    user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    const payload = { message: "Reset token issued. It expires in 30 minutes." };
    if (process.env.NODE_ENV !== "production") payload.resetToken = resetToken;
    res.json(payload);
  }),
);

router.post(
  "/auth/reset",
  loginLimit,
  asyncRoute(async (req, res) => {
    const body = readBody(req);
    const token = String(body.token || "");
    const user = await User.findOne({
      resetTokenHash: hashToken(token),
      resetTokenExpires: { $gt: new Date() },
    });
    if (!user) throw new HttpError(400, "Reset token is invalid or expired");
    user.passwordHash = await hashPassword(String(body.password || ""));
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    res.json({ message: "Password updated. You can sign in." });
  }),
);

router.post(
  "/auth/access-request",
  loginLimit,
  asyncRoute(async (req, res) => {
    const body = readBody(req);
    const email = String(body.email || "").toLowerCase().trim();
    if (!email.includes("@")) throw new HttpError(400, "Enter a valid work email");
    await AccessRequest.create({ email, role: String(body.role || "Employee"), status: "Open" });
    res.status(201).json({ message: "Access request sent to the administrator." });
  }),
);

router.use(requireAuth);

function guardRead(req, name) {
  if (name !== "low-stock" && !modules[name]) throw new HttpError(404, "Unknown module");
  if (name !== "low-stock" && !canRead(req.user.role, name)) throw new HttpError(403, "You do not have access to this module");
}

function guardWrite(req, name) {
  guardRead(req, name);
  if (name === "low-stock" || !canWrite(req.user.role, name)) {
    throw new HttpError(403, "You do not have permission to change these records");
  }
}

async function listRows(name) {
  if (name === "low-stock") return lowStockRows();
  const docs = await modules[name].model.find().sort({ createdAt: -1 });
  return docs.map((doc) => shape(name, doc));
}

router.get(
  "/records/:module",
  asyncRoute(async (req, res) => {
    guardRead(req, req.params.module);
    res.json({ rows: await listRows(req.params.module) });
  }),
);

router.post(
  "/records/:module",
  asyncRoute(async (req, res) => {
    const name = req.params.module;
    guardWrite(req, name);
    if (name === "notifications" && !["Admin", "Sub-admin"].includes(req.user.role)) {
      throw new HttpError(403, "You do not have permission to create notifications");
    }
    const mod = modules[name];
    const data = await prepareWrite(name, readBody(req), req.user, true);
    const code = cleanCode(readBody(req).id, mod.prefix);
    const doc = new mod.model({ ...data, code });
    if (data.status) await applyStatusChange(name, doc, "", req.user);
    await doc.save();
    res.status(201).json({ row: shape(name, doc) });
  }),
);

router.put(
  "/records/:module/:id",
  asyncRoute(async (req, res) => {
    const name = req.params.module;
    guardWrite(req, name);
    const mod = modules[name];
    const doc = await mod.model.findOne({ code: req.params.id });
    if (!doc) throw new HttpError(404, "Record not found");
    const previous = doc.status;
    const data = await prepareWrite(name, readBody(req), req.user, false);
    Object.assign(doc, data);
    if (data.status && data.status !== previous) await applyStatusChange(name, doc, previous, req.user);
    await doc.save();
    res.json({ row: shape(name, doc) });
  }),
);

router.patch(
  "/records/:module/:id/status",
  asyncRoute(async (req, res) => {
    const name = req.params.module;
    guardWrite(req, name);
    const mod = modules[name];
    const doc = await mod.model.findOne({ code: req.params.id });
    if (!doc) throw new HttpError(404, "Record not found");
    const status = String(readBody(req).status || "");
    const column = mod.cols.find(([key]) => key === "status");
    if (!column?.[2]?.includes(status)) throw new HttpError(400, "Status is not allowed");
    const previous = doc.status;
    doc.status = status;
    await applyStatusChange(name, doc, previous, req.user);
    await doc.save();
    res.json({ row: shape(name, doc) });
  }),
);

router.delete(
  "/records/:module/:id",
  asyncRoute(async (req, res) => {
    const name = req.params.module;
    guardWrite(req, name);
    if (["transactions", "low-stock"].includes(name)) throw new HttpError(403, "These records cannot be deleted");
    const doc = await modules[name].model.findOneAndDelete({ code: req.params.id });
    if (!doc) throw new HttpError(404, "Record not found");
    res.json({ ok: true });
  }),
);

router.get(
  "/materials",
  asyncRoute(async (req, res) => {
    guardRead(req, "materials");
    res.json({ rows: await listRows("materials") });
  }),
);

router.post(
  "/materials",
  asyncRoute(async (req, res) => {
    guardWrite(req, "materials");
    const data = await prepareWrite("materials", readBody(req), req.user, true);
    const doc = await Material.create({ ...data, code: cleanCode(readBody(req).id, "MAT") });
    res.status(201).json({ row: shape("materials", doc) });
  }),
);

router.put(
  "/materials/:id",
  asyncRoute(async (req, res) => {
    guardWrite(req, "materials");
    const doc = await Material.findOne({ code: req.params.id });
    if (!doc) throw new HttpError(404, "Material not found");
    Object.assign(doc, await prepareWrite("materials", readBody(req), req.user, false));
    await doc.save();
    res.json({ row: shape("materials", doc) });
  }),
);

router.delete(
  "/materials/:id",
  asyncRoute(async (req, res) => {
    guardWrite(req, "materials");
    const doc = await Material.findOneAndDelete({ code: req.params.id });
    if (!doc) throw new HttpError(404, "Material not found");
    res.json({ ok: true });
  }),
);

router.post(
  "/materials/:id/move",
  asyncRoute(async (req, res) => {
    guardWrite(req, "materials");
    const material = await Material.findOne({ code: req.params.id });
    if (!material) throw new HttpError(404, "Material not found");
    const body = readBody(req);
    const direction = body.direction === "out" ? "out" : "in";
    const updated = await moveMaterialStock({
      material,
      direction,
      quantity: Number(body.quantity),
      user: req.user.name,
      userRef: req.user._id,
    });
    res.json({ row: shape("materials", updated) });
  }),
);

router.get(
  "/dashboard",
  asyncRoute(async (req, res) => {
    const [materials, employees, vendors, customers, orders, leaves, monthly, notes] = await Promise.all([
      Material.find().sort({ createdAt: -1 }),
      Employee.find().sort({ createdAt: -1 }),
      Vendor.find().sort({ createdAt: -1 }),
      Customer.find().sort({ createdAt: -1 }),
      SalesOrder.find().sort({ createdAt: -1 }),
      Leave.find().sort({ createdAt: -1 }),
      MonthlyStat.find().sort({ sort: 1 }),
      Notification.find().sort({ createdAt: -1 }).limit(8),
    ]);
    res.json({
      user: publicUser(req.user),
      materials: materials.map((row) => shape("materials", row)),
      employees: employees.map((row) => shape("employees", row)),
      vendors: vendors.map((row) => shape("vendors", row)),
      customers: customers.map((row) => shape("customers", row)),
      orders: orders.map((row) => shape("sales-orders", row)),
      leaves: leaves.map((row) => shape("leaves", row)),
      monthlySales: monthly.map((row) => ({ m: row.m, sales: row.sales, purchase: row.purchase })),
      activities: notes.map((row) => ({ who: row.user, what: row.title, when: row.date, tone: row.tone })),
    });
  }),
);

router.get(
  "/reports",
  asyncRoute(async (req, res) => {
    const months = Math.min(12, Math.max(1, Number(req.query.months) || 6));
    const [monthly, materials, employees] = await Promise.all([
      MonthlyStat.find().sort({ sort: 1 }),
      Material.find().sort({ createdAt: -1 }),
      Employee.find().sort({ createdAt: -1 }),
    ]);
    res.json({
      monthlySales: monthly.slice(-months).map((row) => ({ m: row.m, sales: row.sales, purchase: row.purchase })),
      materials: materials.map((row) => shape("materials", row)),
      employees: employees.map((row) => shape("employees", row)),
    });
  }),
);

router.get(
  "/sales/overview",
  asyncRoute(async (req, res) => {
    guardRead(req, "sales-orders");
    const [orders, leads, monthly] = await Promise.all([
      SalesOrder.find().sort({ createdAt: -1 }),
      modules.leads.model.find().sort({ createdAt: -1 }),
      MonthlyStat.find().sort({ sort: 1 }),
    ]);
    res.json({
      orders: orders.map((row) => shape("sales-orders", row)),
      leads: leads.map((row) => shape("leads", row)),
      monthlySales: monthly.map((row) => ({ m: row.m, sales: row.sales, purchase: row.purchase })),
    });
  }),
);

router.get(
  "/hrms/overview",
  asyncRoute(async (req, res) => {
    guardRead(req, "employees");
    const [employees, leaves, expenses, shift] = await Promise.all([
      Employee.find().sort({ createdAt: -1 }),
      Leave.find().sort({ createdAt: -1 }),
      modules.expenses.model.find().sort({ createdAt: -1 }),
      Shift.findOne({ userRef: req.user._id }),
    ]);
    res.json({
      employees: employees.map((row) => shape("employees", row)),
      leaves: leaves.map((row) => shape("leaves", row)),
      expenses: expenses.map((row) => shape("expenses", row)),
      shift: shift?.checkIn && !shift.checkOut ? { checkIn: shift.checkIn } : { checkIn: null },
    });
  }),
);

router.post(
  "/attendance/punch",
  asyncRoute(async (req, res) => {
    if (!canWrite(req.user.role, "attendance") && req.user.role !== "Sales Rep" && req.user.role !== "Sales Manager" && req.user.role !== "Inventory Manager") {
      throw new HttpError(403, "You do not have permission to record attendance");
    }
    const action = readBody(req).action === "out" ? "out" : "in";
    let shift = await Shift.findOne({ userRef: req.user._id });
    if (!shift) shift = new Shift({ userRef: req.user._id });
    const now = new Date();
    const clock = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    const employee =
      (req.user.employeeCode && (await Employee.findOne({ code: req.user.employeeCode }))) ||
      (await Employee.findOne({ name: req.user.name }));
    if (action === "in") {
      shift.checkIn = now;
      shift.checkOut = null;
      if (employee) {
        employee.status = "Present";
        employee.checkIn = clock;
        await employee.save();
        const today = now.toISOString().slice(0, 10);
        const existing = await modules.attendance.model.findOne({ employeeRef: employee._id, date: today });
        if (existing) {
          existing.checkIn = clock;
          existing.checkOut = "—";
          existing.status = "Present";
          await existing.save();
        } else {
          const taken = await modules.attendance.model.findOne({ code: employee.code });
          await modules.attendance.model.create({
            code: taken ? `ATT-${today.replaceAll("-", "")}-${employee.code}` : employee.code,
            name: employee.name,
            dept: employee.dept,
            date: today,
            checkIn: clock,
            checkOut: "—",
            status: "Present",
            employeeRef: employee._id,
          });
        }
      }
    } else {
      if (!shift.checkIn || shift.checkOut) throw new HttpError(400, "Check in before checking out");
      shift.checkOut = now;
      if (employee) {
        const today = now.toISOString().slice(0, 10);
        await modules.attendance.model.findOneAndUpdate(
          { employeeRef: employee._id, date: today },
          { checkOut: clock },
        );
      }
    }
    await shift.save();
    res.json({ checkIn: shift.checkOut ? null : shift.checkIn, checkOut: shift.checkOut || null });
  }),
);

router.post(
  "/notifications/read-all",
  asyncRoute(async (_req, res) => {
    await Notification.updateMany({ status: "Unread" }, { status: "Read" });
    res.json({ rows: await listRows("notifications") });
  }),
);

router.get(
  "/meta/relations",
  asyncRoute(async (_req, res) => {
    const [vendors, customers, materials, employees, departments, orders] = await Promise.all([
      Vendor.find().select("name"),
      Customer.find().select("name"),
      Material.find().select("name"),
      Employee.find().select("name"),
      modules.departments.model.find().select("name"),
      SalesOrder.find().select("code"),
    ]);
    res.json({
      vendors: vendors.map((row) => row.name),
      customers: customers.map((row) => row.name),
      materials: materials.map((row) => row.name),
      employees: employees.map((row) => row.name),
      departments: departments.map((row) => row.name),
      orders: orders.map((row) => row.code),
    });
  }),
);

async function prepareWrite(name, body, user, isNew) {
  const mod = modules[name];
  const data = pickFields(mod, body);
  if (isNew) {
    for (const [key, type, options] of mod.cols) {
      if (data[key] !== undefined) continue;
      data[key] = type === "number" ? 0 : options?.[0] || "";
    }
  }
  if (["leaves", "expenses", "attendance"].includes(name) && ["Employee", "Sales Rep"].includes(user.role)) {
    data.name = user.name;
    if (mod.approval && isNew) data.status = "Pending";
  }
  if (mod.approval && isNew && !approvers.has(user.role)) data.status = "Pending";
  const required = ["name", "title", "customer", "vendor", "material", "items"].filter((key) =>
    mod.cols.some(([column]) => column === key),
  );
  for (const key of required) {
    if (data[key] === undefined || data[key] === "") throw new HttpError(400, `${key} is required`);
  }
  if (data.email && !String(data.email).includes("@")) throw new HttpError(400, "Enter a valid email");
  if (!data.status) {
    const column = mod.cols.find(([key]) => key === "status");
    if (column?.[2]?.[0]) data.status = column[2][0];
  }
  await linkRelations(name, data);
  return data;
}

function cleanCode(id, prefix) {
  const value = String(id || "");
  if (/^[A-Z]+-[A-Za-z0-9]+$/.test(value)) return value;
  return `${prefix}-${Date.now().toString().slice(-7)}`;
}

export default router;
