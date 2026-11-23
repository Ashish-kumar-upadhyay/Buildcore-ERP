import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { hashPassword, hashToken, newResetToken, publicUser, requireAuth, signToken } from "./auth.js";
import {
  applyStatusChange,
  bumpMonth,
  linkRelations,
  lowStockRows,
  moveMaterialStock,
  pickFields,
  shape,
} from "./domain.js";
import { HttpError, asyncRoute, readBody } from "./http.js";
import {
  AccessRequest,
  Counter,
  Customer,
  Employee,
  GoodsReceipt,
  Leave,
  Material,
  MaterialRequest,
  MonthlyStat,
  Notification,
  SalesOrder,
  Shift,
  Transaction,
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

const employeeRoles = new Set([
  "Admin",
  "Sub-admin",
  "HR Manager",
  "Inventory Manager",
  "Sales Manager",
  "Manager",
  "Employee",
  "Sales Rep",
]);
const materialRequestRoles = new Set(["Manager", "Employee"]);

function employeeLoginEmail(loginId) {
  const slug = loginId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "employee"}@buildcore.local`;
}

function employeeAccountRole(value) {
  const requestedRole = String(value || "").trim().toLowerCase();
  return [...employeeRoles].find((role) => role.toLowerCase() === requestedRole) || "Employee";
}

async function nextEmployeeLoginId() {
  await Counter.init();
  try {
    await Counter.updateOne(
      { name: "employee-login" },
      { $setOnInsert: { value: 10000 } },
      { upsert: true },
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
  for (;;) {
    const counter = await Counter.findOneAndUpdate(
      { name: "employee-login" },
      { $inc: { value: 1 } },
      { new: true },
    );
    if (!counter) throw new Error("Unable to allocate an employee Login ID");
    const loginId = `ERP-${counter.value}`;
    const [existingUser, existingEmployee] = await Promise.all([
      User.findOne({ code: loginId }).collation({ locale: "en", strength: 2 }),
      Employee.findOne({ loginId }).collation({ locale: "en", strength: 2 }),
    ]);
    if (!existingUser && !existingEmployee) return loginId;
  }
}

function isSelfServiceUser(user) {
  return ["Manager", "Employee", "Sales Rep"].includes(user.role);
}

async function requestOwnerFilter(name, user) {
  if (!["leaves", "expenses", "attendance"].includes(name) || !isSelfServiceUser(user)) return {};
  const employee = user.employeeCode
    ? await Employee.findOne({ code: user.employeeCode }).select("_id")
    : null;
  return employee
    ? {
        $or: [
          { employeeRef: employee._id },
          { employeeRef: { $exists: false }, name: user.name },
        ],
      }
    : { name: user.name };
}

async function attachRequestOwner(name, data, user) {
  if (!["leaves", "expenses"].includes(name) || !isSelfServiceUser(user)) return;
  const employee = user.employeeCode
    ? await Employee.findOne({ code: user.employeeCode }).select("_id name")
    : null;
  if (employee) {
    data.employeeRef = employee._id;
    data.name = employee.name;
  }
}

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "buildcore-erp" });
});

router.post(
  "/auth/login",
  loginLimit,
  asyncRoute(async (req, res) => {
    const body = readBody(req);
    const identifier = String(body.email || body.identifier || "").trim();
    const password = String(body.password || "");
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { code: identifier }],
    }).collation({ locale: "en", strength: 2 });
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
router.use((req, _res, next) => {
  const isMaterialRequestPath =
    req.path === "/material-requests" || req.path.startsWith("/material-requests/");
  const isEmployeeSelfServicePath =
    req.user.role === "Employee" &&
    ((req.method === "GET" && ["/records/attendance", "/records/leaves"].includes(req.path)) ||
      (req.method === "POST" && ["/attendance/punch", "/records/leaves"].includes(req.path)));
  if (
    materialRequestRoles.has(req.user.role) &&
    !isMaterialRequestPath &&
    !isEmployeeSelfServicePath
  ) {
    return next(new HttpError(403, "Use Material Requests; this role cannot access other ERP modules"));
  }
  next();
});

function materialRequestRow(doc) {
  const row = doc.toJSON();
  delete row.requesterRef;
  delete row.employeeCode;
  delete row.materialRef;
  return row;
}

router.get(
  "/material-requests/material-options",
  asyncRoute(async (req, res) => {
    if (!materialRequestRoles.has(req.user.role)) {
      throw new HttpError(403, "Only employees and managers can view material options");
    }
    const materials = await Material.find().select("code name unit").sort({ name: 1 }).lean();
    res.json({
      rows: materials.map((material) => ({
        id: material.code,
        name: material.name,
        unit: material.unit || "",
      })),
    });
  }),
);

router.get(
  "/material-requests",
  asyncRoute(async (req, res) => {
    if (req.user.role !== "Admin" && !materialRequestRoles.has(req.user.role)) {
      throw new HttpError(403, "You do not have access to material requests");
    }
    const filter = req.user.role === "Admin" ? {} : { requesterRef: req.user._id };
    const requests = await MaterialRequest.find(filter).sort({ createdAt: -1 });
    res.json({ rows: requests.map(materialRequestRow) });
  }),
);

router.post(
  "/material-requests",
  asyncRoute(async (req, res) => {
    if (!materialRequestRoles.has(req.user.role)) {
      throw new HttpError(403, "Only employees and managers can submit material requests");
    }
    const body = readBody(req);
    const company = String(body.company || "").trim();
    const materialId = String(body.materialId || "").trim();
    const quantity = Number(body.quantity);
    const notes = String(body.notes || "").trim();
    if (!company) throw new HttpError(400, "Company is required");
    if (!materialId) throw new HttpError(400, "Select a material or product");
    const selectedMaterial = await Material.findOne({ code: materialId }).select("_id name unit");
    if (!selectedMaterial) throw new HttpError(400, "Select a valid saved material or product");
    const material = selectedMaterial.name;
    const unit = String(selectedMaterial.unit || "").trim() || "pcs";
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new HttpError(400, "Quantity must be greater than zero");
    }
    const requestCode = `MR-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
    const session = await mongoose.startSession();
    let request;
    try {
      await session.withTransaction(async () => {
        [request] = await MaterialRequest.create(
          [
            {
              code: requestCode,
              requesterRef: req.user._id,
              requesterName: req.user.name,
              employeeCode: req.user.employeeCode || "",
              company,
              materialRef: selectedMaterial._id,
              material,
              quantity,
              unit,
              notes,
              status: "Pending",
            },
          ],
          { session },
        );
        await Notification.create(
          [
            {
              code: `NT-${crypto.randomBytes(5).toString("hex").toUpperCase()}`,
              title: `Material request ${request.code}: ${material} for ${company}`,
              user: req.user.name,
              status: "Unread",
              category: "Material Requests",
              tone: "info",
              date: new Date().toISOString(),
            },
          ],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    res.status(201).json({ row: materialRequestRow(request) });
  }),
);

router.patch(
  "/material-requests/:id/status",
  asyncRoute(async (req, res) => {
    if (req.user.role !== "Admin") {
      throw new HttpError(403, "Only an Admin can approve or cancel material requests");
    }
    const status = String(readBody(req).status || "");
    if (!["Approved", "Cancelled"].includes(status)) {
      throw new HttpError(400, "Status must be Approved or Cancelled");
    }
    const request = await MaterialRequest.findOneAndUpdate(
      { code: req.params.id, status: "Pending" },
      { $set: { status, reviewedBy: req.user.name, reviewedAt: new Date() } },
      { new: true, runValidators: true },
    );
    if (!request) {
      if (!(await MaterialRequest.exists({ code: req.params.id }))) {
        throw new HttpError(404, "Material request not found");
      }
      throw new HttpError(409, "Only pending material requests can be reviewed");
    }
    res.json({ row: materialRequestRow(request) });
  }),
);

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

async function listRows(name, user) {
  if (name === "low-stock") return lowStockRows();
  const filter =
    name === "notifications" && user && user.role !== "Admin"
      ? { category: { $nin: ["Material Requests", "Leave Requests"] } }
      : user
        ? await requestOwnerFilter(name, user)
        : {};
  const docs = await modules[name].model
    .find(filter)
    .sort({ createdAt: -1 });
  return docs.map((doc) => shape(name, doc));
}

function receiptRow(doc) {
  const row = doc.toJSON();
  for (const key of ["requestId", "purchaseRef", "materialRef", "userRef"]) delete row[key];
  return row;
}

function sameReceiptRequest(receipt, purchaseCode, quantity, date, notes) {
  return (
    receipt.purchaseCode === purchaseCode &&
    receipt.quantity === quantity &&
    receipt.date === date &&
    receipt.notes === notes
  );
}

router.get(
  "/records/:module",
  asyncRoute(async (req, res) => {
    guardRead(req, req.params.module);
    res.json({ rows: await listRows(req.params.module, req.user) });
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
    const body = readBody(req);
    const data = await prepareWrite(name, body, req.user, true);
    await attachRequestOwner(name, data, req.user);
    if (name === "leaves" && req.user.role === "Employee") {
      const from = String(data.from || "");
      const to = String(data.to || "");
      const fromDate = /^\d{4}-\d{2}-\d{2}$/.test(from)
        ? new Date(`${from}T00:00:00.000Z`)
        : null;
      const toDate = /^\d{4}-\d{2}-\d{2}$/.test(to)
        ? new Date(`${to}T00:00:00.000Z`)
        : null;
      if (
        !fromDate ||
        !toDate ||
        Number.isNaN(fromDate.getTime()) ||
        Number.isNaN(toDate.getTime()) ||
        fromDate.toISOString().slice(0, 10) !== from ||
        toDate.toISOString().slice(0, 10) !== to ||
        toDate < fromDate
      ) {
        throw new HttpError(400, "Enter a valid leave date range");
      }
      data.days = Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1;
    }
    if (name === "purchases") {
      if (data.status !== "Draft") throw new HttpError(400, "New purchase orders must start as Draft");
      data.status = "Draft";
    }
    const code =
      name === "employees"
        ? `EMP-${crypto.randomBytes(5).toString("hex").toUpperCase()}`
        : cleanCode(body.id, mod.prefix);
    const doc = new mod.model({ ...data, code });
    if (name === "employees") {
      const loginId = await nextEmployeeLoginId();
      const role = employeeAccountRole(data.role);
      if (role === "Admin" && req.user.role !== "Admin") {
        throw new HttpError(403, "Only an administrator can create an Admin account");
      }
      if (role === "Sub-admin" && !["Admin", "Sub-admin"].includes(req.user.role)) {
        throw new HttpError(403, "Only an administrator can create a Sub-admin account");
      }
      const password =
        String(body.password || "").trim() ||
        `${code.replace(/[^A-Za-z0-9]/g, "")}@${crypto.randomBytes(4).toString("hex")}`;
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const loginEmail = employeeLoginEmail(loginId);
          const duplicate = await User.findOne({
            $or: [{ code: loginId }, { email: loginEmail }],
          })
            .collation({ locale: "en", strength: 2 })
            .session(session);
          const duplicateEmployee = await Employee.findOne({ loginId })
            .collation({ locale: "en", strength: 2 })
            .session(session);
          if (duplicate || duplicateEmployee) {
            throw new HttpError(409, "That employee Login ID is already in use");
          }
          doc.loginId = loginId;
          await doc.save({ session });
          await User.create(
            [
              {
                code: loginId,
                name: doc.name,
                email: loginEmail,
                passwordHash: await hashPassword(password),
                role,
                employeeCode: doc.code,
              },
            ],
            { session },
          );
        });
      } catch (error) {
        if (error?.code === 11000) {
          throw new HttpError(409, "That employee Login ID is already in use");
        }
        throw error;
      } finally {
        await session.endSession();
      }
      res.status(201).json({
        row: shape(name, doc),
        credentials: { loginId, password },
      });
      return;
    }
    if (data.status) await applyStatusChange(name, doc, "", req.user);
    if (name === "leaves" && req.user.role === "Employee") {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await doc.save({ session });
          await Notification.create(
            [
              {
                code: `NT-${crypto.randomBytes(5).toString("hex").toUpperCase()}`,
                title: `Leave request ${doc.code} from ${doc.name} (${doc.from} to ${doc.to})`,
                user: doc.name,
                status: "Unread",
                category: "Leave Requests",
                tone: "info",
                date: new Date().toISOString(),
              },
            ],
            { session },
          );
        });
      } finally {
        await session.endSession();
      }
    } else {
      await doc.save();
    }
    res.status(201).json({ row: shape(name, doc) });
  }),
);

router.put(
  "/records/:module/:id",
  asyncRoute(async (req, res) => {
    const name = req.params.module;
    guardWrite(req, name);
    const mod = modules[name];
    const doc = await mod.model.findOne({
      code: req.params.id,
      ...(await requestOwnerFilter(name, req.user)),
    });
    if (!doc) throw new HttpError(404, "Record not found");
    if (
      ["leaves", "expenses"].includes(name) &&
      isSelfServiceUser(req.user) &&
      doc.status !== "Pending"
    ) {
      throw new HttpError(409, "Only pending requests can be edited");
    }
    const previous = doc.status;
    const data = await prepareWrite(name, readBody(req), req.user, false);
    if (name === "purchases") {
      const editableStatuses = ["Draft", "Submitted", "Ordered", "In transit"];
      const editable =
        editableStatuses.includes(doc.status) &&
        Number(doc.receivedQuantity || 0) === 0 &&
        !doc.transitApplied &&
        !doc.receivedApplied;
      if (!editable) {
        throw new HttpError(409, "Purchase orders cannot be edited after receiving begins");
      }
      const status = ["Ordered", "In transit"].includes(doc.status) ? "Submitted" : doc.status;
      if (data.status && data.status !== status) {
        throw new HttpError(400, "Edit the purchase order without changing its workflow status");
      }
      data.status = status;
      const updated = await mod.model.findOneAndUpdate(
        {
          code: req.params.id,
          status: doc.status,
          transitApplied: { $ne: true },
          receivedApplied: { $ne: true },
          $or: [{ receivedQuantity: 0 }, { receivedQuantity: { $exists: false } }],
        },
        { $set: data },
        { new: true, runValidators: true },
      );
      if (!updated) throw new HttpError(409, "Purchase orders cannot be edited after receiving begins");
      res.json({ row: shape(name, updated) });
      return;
    }
    if (name === "employees") {
      const body = readBody(req);
      const role = employeeAccountRole(data.role || doc.role);
      if (role === "Admin" && req.user.role !== "Admin") {
        throw new HttpError(403, "Only an administrator can assign the Admin role");
      }
      if (role === "Sub-admin" && !["Admin", "Sub-admin"].includes(req.user.role)) {
        throw new HttpError(403, "Only an administrator can assign the Sub-admin role");
      }
      const loginId = String(doc.loginId || doc.code).trim().toUpperCase();
      const password = String(body.password || "").trim();
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          let user =
            (await User.findOne({ employeeCode: doc.code }).session(session)) ||
            (await User.findOne({ code: doc.loginId || doc.code }).session(session));
          const loginEmail = employeeLoginEmail(loginId);
          const duplicate = await User.findOne({
            $or: [{ code: loginId }, { email: loginEmail }],
          })
            .collation({ locale: "en", strength: 2 })
            .session(session);
          const duplicateEmployee = await Employee.findOne({
            loginId,
            _id: { $ne: doc._id },
          })
            .collation({ locale: "en", strength: 2 })
            .session(session);
          if (duplicate && (!user || String(duplicate._id) !== String(user._id))) {
            throw new HttpError(409, "That employee Login ID is already in use");
          }
          if (duplicateEmployee) {
            throw new HttpError(409, "That employee Login ID is already in use");
          }
          if (!user && !password) {
            throw new HttpError(400, "Password is required for the employee login");
          }
          Object.assign(doc, data);
          doc.loginId = loginId;
          await doc.save({ session });
          if (!user) {
            user = new User({
              code: loginId,
              name: doc.name,
              email: loginEmail,
              passwordHash: await hashPassword(password),
              role,
              employeeCode: doc.code,
            });
          } else {
            user.code = loginId;
            user.name = doc.name;
            user.email = loginEmail;
            user.role = role;
            user.employeeCode = doc.code;
            if (password) user.passwordHash = await hashPassword(password);
          }
          await user.save({ session });
        });
      } catch (error) {
        if (error?.code === 11000) {
          throw new HttpError(409, "That employee Login ID is already in use");
        }
        throw error;
      } finally {
        await session.endSession();
      }
      res.json({ row: shape(name, doc) });
      return;
    }
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
    if (["leaves", "expenses"].includes(name) && isSelfServiceUser(req.user)) {
      throw new HttpError(403, "Only HR managers and administrators can change request status");
    }
    if (name === "purchases") {
      if (doc.status !== "Draft" || status !== "Submitted") {
        throw new HttpError(400, "Only Draft purchase orders can be marked as Submitted");
      }
      doc.status = "Submitted";
      await doc.save();
      res.json({ row: shape(name, doc) });
      return;
    }
    const previous = doc.status;
    doc.status = status;
    await applyStatusChange(name, doc, previous, req.user);
    await doc.save();
    res.json({ row: shape(name, doc) });
  }),
);

router.get(
  "/records/purchases/:id/receipts",
  asyncRoute(async (req, res) => {
    guardRead(req, "purchases");
    const purchase = await modules.purchases.model.findOne({ code: req.params.id });
    if (!purchase) throw new HttpError(404, "Purchase order not found");
    const receipts = await GoodsReceipt.find({ purchaseRef: purchase._id }).sort({
      date: 1,
      createdAt: 1,
      _id: 1,
    });
    if (receipts.length) {
      res.json({ rows: receipts.map(receiptRow) });
      return;
    }
    const legacyHistory = await Transaction.find({
      reference: purchase.code,
      direction: "Stock in",
    }).sort({ date: 1, createdAt: 1 });
    res.json({
      rows: legacyHistory.map((entry) => ({
        id: entry.id,
        purchaseCode: purchase.code,
        vendor: purchase.vendor,
        material: entry.material,
        quantity: entry.quantity,
        date: entry.date,
        notes: "Existing stock history record",
        user: entry.user,
      })),
    });
  }),
);

router.post(
  "/records/purchases/:id/receipts",
  asyncRoute(async (req, res) => {
    guardWrite(req, "purchases");
    const body = readBody(req);
    const requestId = String(body.requestId || "").trim();
    const quantity = Number(body.quantity);
    const date = String(body.date || "").trim();
    const notes = String(body.notes || "").trim();
    if (requestId.length < 8 || requestId.length > 128) {
      throw new HttpError(400, "A valid receipt requestId is required");
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new HttpError(400, "Receiving quantity must be greater than zero");
    }
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00.000Z`) : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
      throw new HttpError(400, "Enter a valid receiving date");
    }
    if (notes.length > 2000) throw new HttpError(400, "Notes cannot exceed 2000 characters");

    const session = await modules.purchases.model.startSession();
    let result;
    const receiptCode = `GR-${crypto.randomUUID()}`;
    const transactionCode = `TX-${crypto.randomUUID()}`;
    try {
      try {
        result = await session.withTransaction(async () => {
          const previousReceipt = await GoodsReceipt.findOne({ requestId }).session(session);
          if (previousReceipt) {
            if (!sameReceiptRequest(previousReceipt, req.params.id, quantity, date, notes)) {
              throw new HttpError(409, "This receipt requestId was already used for a different receipt");
            }
            const previousPurchase = await modules.purchases.model
              .findById(previousReceipt.purchaseRef)
              .session(session);
            if (!previousPurchase) throw new HttpError(404, "Purchase order not found");
            return {
              row: shape("purchases", previousPurchase),
              receipt: receiptRow(previousReceipt),
              duplicate: true,
            };
          }

          const purchase = await modules.purchases.model.findOne({ code: req.params.id }).session(session);
          if (!purchase) throw new HttpError(404, "Purchase order not found");
          if (!["Submitted", "Partially Received", "Ordered", "In transit"].includes(purchase.status)) {
            throw new HttpError(400, "Only submitted purchase orders can receive materials");
          }
          const ordered = Number(purchase.quantity);
          const previouslyReceived = Number(purchase.receivedQuantity || 0);
          const remaining = ordered - previouslyReceived;
          if (!Number.isFinite(ordered) || ordered <= 0 || remaining <= 0) {
            throw new HttpError(400, "This purchase order has no remaining quantity");
          }
          if (quantity - remaining > 1e-9) {
            throw new HttpError(400, `Receiving quantity cannot exceed the remaining ${remaining}`);
          }

          const materialQuery = purchase.materialRef
            ? Material.findById(purchase.materialRef)
            : Material.findOne({ name: purchase.material });
          const material = await materialQuery.session(session);
          if (!material) throw new HttpError(404, "Purchase order material was not found");

          const received = Math.min(ordered, previouslyReceived + quantity);
          const fullyReceived = ordered - received <= 1e-9;
          const receipt = new GoodsReceipt({
            code: receiptCode,
            requestId,
            purchaseCode: purchase.code,
            purchaseRef: purchase._id,
            vendor: purchase.vendor,
            material: material.name,
            materialRef: material._id,
            quantity,
            date,
            notes,
            user: req.user.name,
            userRef: req.user._id,
          });
          await receipt.save({ session });

          purchase.receivedQuantity = received;
          purchase.status = fullyReceived ? "Received" : "Partially Received";
          purchase.receivedApplied = fullyReceived;
          if (purchase.transitApplied) {
            material.transit = Math.max(0, material.transit - quantity);
            if (fullyReceived) purchase.transitApplied = false;
          }
          material.stock += quantity;
          await purchase.save({ session });
          await material.save({ session });

          const stockHistory = new Transaction({
            code: transactionCode,
            material: material.name,
            materialRef: material._id,
            direction: "Stock in",
            quantity,
            reference: receipt.code,
            date,
            user: req.user.name,
            userRef: req.user._id,
          });
          await stockHistory.save({ session });
          await bumpMonth("purchase", (purchase.amount / ordered) * quantity, session);

          return {
            row: shape("purchases", purchase),
            receipt: receiptRow(receipt),
            duplicate: false,
          };
        });
      } catch (error) {
        if (error?.code !== 11000) throw error;
        const duplicate = await GoodsReceipt.findOne({ requestId });
        if (!duplicate) throw error;
        if (!sameReceiptRequest(duplicate, req.params.id, quantity, date, notes)) {
          throw new HttpError(409, "This receipt requestId was already used for a different receipt");
        }
        const purchase = await modules.purchases.model.findById(duplicate.purchaseRef);
        if (!purchase) throw new HttpError(404, "Purchase order not found");
        result = {
          row: shape("purchases", purchase),
          receipt: receiptRow(duplicate),
          duplicate: true,
        };
      }
    } finally {
      await session.endSession();
    }
    res.status(result.duplicate ? 200 : 201).json(result);
  }),
);

router.delete(
  "/records/:module/:id",
  asyncRoute(async (req, res) => {
    const name = req.params.module;
    guardWrite(req, name);
    if (["transactions", "low-stock"].includes(name)) throw new HttpError(403, "These records cannot be deleted");
    if (name === "purchases") {
      const doc = await modules.purchases.model.findOneAndDelete({
        code: req.params.id,
        status: { $in: ["Draft", "Submitted", "Ordered", "In transit"] },
        transitApplied: { $ne: true },
        receivedApplied: { $ne: true },
        $or: [{ receivedQuantity: 0 }, { receivedQuantity: { $exists: false } }],
      });
      if (doc) {
        res.json({ ok: true });
        return;
      }
      if (!(await modules.purchases.model.exists({ code: req.params.id }))) {
        throw new HttpError(404, "Record not found");
      }
      throw new HttpError(409, "Purchase orders cannot be deleted after receiving begins");
    }
    const requestFilter = await requestOwnerFilter(name, req.user);
    const doc = await modules[name].model.findOneAndDelete({
      code: req.params.id,
      ...requestFilter,
      ...(["leaves", "expenses"].includes(name) && isSelfServiceUser(req.user)
        ? { status: "Pending" }
        : {}),
    });
    if (!doc) throw new HttpError(404, "Record not found");
    if (name === "employees") {
      await User.deleteOne({ $or: [{ employeeCode: doc.code }, { code: doc.loginId }] });
    }
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
    const noteFilter =
      req.user.role === "Admin"
        ? {}
        : { category: { $nin: ["Material Requests", "Leave Requests"] } };
    const [materials, employees, vendors, customers, orders, leaves, monthly, notes, pendingMaterialRequests] = await Promise.all([
      Material.find().sort({ createdAt: -1 }),
      Employee.find().sort({ createdAt: -1 }),
      Vendor.find().sort({ createdAt: -1 }),
      Customer.find().sort({ createdAt: -1 }),
      SalesOrder.find().sort({ createdAt: -1 }),
      Leave.find().sort({ createdAt: -1 }),
      MonthlyStat.find().sort({ sort: 1 }),
      Notification.find(noteFilter).sort({ createdAt: -1 }).limit(8),
      req.user.role === "Admin" ? MaterialRequest.countDocuments({ status: "Pending" }) : 0,
    ]);
    res.json({
      user: publicUser(req.user),
      materials: materials.map((row) => shape("materials", row)),
      employees: employees.map((row) => shape("employees", row)),
      vendors: vendors.map((row) => shape("vendors", row)),
      customers: customers.map((row) => shape("customers", row)),
      orders: orders.map((row) => shape("sales-orders", row)),
      leaves: leaves.map((row) => shape("leaves", row)),
      pendingMaterialRequests,
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
      Leave.find(await requestOwnerFilter("leaves", req.user)).sort({ createdAt: -1 }),
      modules.expenses.model
        .find(await requestOwnerFilter("expenses", req.user))
        .sort({ createdAt: -1 }),
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
