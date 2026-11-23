import mongoose from "mongoose";

const transform = (_doc, ret) => {
  ret.id = ret.code;
  delete ret._id;
  delete ret.__v;
  delete ret.code;
  delete ret.passwordHash;
  delete ret.resetTokenHash;
  delete ret.resetTokenExpires;
  return ret;
};

const base = {
  timestamps: true,
  toJSON: { virtuals: true, transform },
  toObject: { virtuals: true, transform },
};

const code = { type: String, required: true, unique: true, trim: true };

export const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      code,
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      passwordHash: { type: String, required: true },
      role: {
        type: String,
        required: true,
        enum: [
          "Admin",
          "Sub-admin",
          "HR Manager",
          "Inventory Manager",
          "Sales Manager",
          "Employee",
          "Sales Rep",
        ],
      },
      employeeCode: { type: String, default: "" },
      resetTokenHash: String,
      resetTokenExpires: Date,
    },
    base,
  ),
);

export const Department = mongoose.model(
  "Department",
  new mongoose.Schema(
    {
      code,
      name: { type: String, required: true, trim: true },
      manager: { type: String, default: "" },
      managerRef: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      location: { type: String, default: "" },
      status: { type: String, default: "Active" },
    },
    base,
  ),
);

export const Employee = mongoose.model(
  "Employee",
  new mongoose.Schema(
    {
      code,
      name: { type: String, required: true, trim: true },
      role: { type: String, default: "" },
      dept: { type: String, default: "" },
      departmentRef: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
      status: { type: String, default: "Present" },
      checkIn: { type: String, default: "—" },
    },
    base,
  ),
);

export const Vendor = mongoose.model(
  "Vendor",
  new mongoose.Schema(
    {
      code,
      name: { type: String, required: true, trim: true },
      contact: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      category: { type: String, default: "" },
      status: { type: String, default: "Active" },
    },
    base,
  ),
);

export const Customer = mongoose.model(
  "Customer",
  new mongoose.Schema(
    {
      code,
      name: { type: String, required: true, trim: true },
      contact: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      city: { type: String, default: "" },
      status: { type: String, default: "Active" },
    },
    base,
  ),
);

export const Material = mongoose.model(
  "Material",
  new mongoose.Schema(
    {
      code,
      name: { type: String, required: true, trim: true },
      category: { type: String, default: "" },
      unit: { type: String, default: "" },
      stock: { type: Number, default: 0 },
      transit: { type: Number, default: 0 },
      reorder: { type: Number, default: 0 },
      price: { type: Number, default: 0 },
      vendor: { type: String, default: "" },
      vendorRef: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    },
    base,
  ),
);

export const Purchase = mongoose.model(
  "Purchase",
  new mongoose.Schema(
    {
      code,
      vendor: { type: String, required: true },
      vendorRef: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
      material: { type: String, required: true },
      materialRef: { type: mongoose.Schema.Types.ObjectId, ref: "Material" },
      quantity: { type: Number, required: true },
      amount: { type: Number, required: true },
      date: { type: String, default: "" },
      status: { type: String, default: "Draft" },
      transitApplied: { type: Boolean, default: false },
      receivedApplied: { type: Boolean, default: false },
    },
    base,
  ),
);

export const Transaction = mongoose.model(
  "Transaction",
  new mongoose.Schema(
    {
      code,
      material: { type: String, required: true },
      materialRef: { type: mongoose.Schema.Types.ObjectId, ref: "Material" },
      direction: { type: String, required: true },
      quantity: { type: Number, required: true },
      reference: { type: String, default: "" },
      date: { type: String, default: "" },
      user: { type: String, default: "" },
      userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    base,
  ),
);

export const Attendance = mongoose.model(
  "Attendance",
  new mongoose.Schema(
    {
      code,
      name: { type: String, required: true },
      employeeRef: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      dept: { type: String, default: "" },
      date: { type: String, default: "" },
      checkIn: { type: String, default: "—" },
      checkOut: { type: String, default: "—" },
      status: { type: String, default: "Present" },
    },
    base,
  ),
);

export const Shift = mongoose.model(
  "Shift",
  new mongoose.Schema(
    {
      userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
      checkIn: Date,
      checkOut: Date,
    },
    { timestamps: true },
  ),
);

export const Leave = mongoose.model(
  "Leave",
  new mongoose.Schema(
    {
      code,
      name: { type: String, required: true },
      employeeRef: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      type: { type: String, default: "Casual" },
      from: { type: String, default: "" },
      to: { type: String, default: "" },
      days: { type: Number, default: 1 },
      status: { type: String, default: "Pending" },
    },
    base,
  ),
);

export const Expense = mongoose.model(
  "Expense",
  new mongoose.Schema(
    {
      code,
      name: { type: String, required: true },
      employeeRef: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      category: { type: String, default: "" },
      amount: { type: Number, default: 0 },
      date: { type: String, default: "" },
      status: { type: String, default: "Pending" },
    },
    base,
  ),
);

export const Representative = mongoose.model(
  "Representative",
  new mongoose.Schema(
    {
      code,
      name: { type: String, required: true },
      employeeRef: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      role: { type: String, default: "" },
      territory: { type: String, default: "" },
      target: { type: Number, default: 0 },
      status: { type: String, default: "Present" },
    },
    base,
  ),
);

export const Lead = mongoose.model(
  "Lead",
  new mongoose.Schema(
    {
      code,
      name: { type: String, required: true },
      value: { type: Number, default: 0 },
      rep: { type: String, default: "" },
      repRef: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      status: { type: String, default: "New" },
    },
    base,
  ),
);

export const Quotation = mongoose.model(
  "Quotation",
  new mongoose.Schema(
    {
      code,
      customer: { type: String, required: true },
      customerRef: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
      material: { type: String, required: true },
      materialRef: { type: mongoose.Schema.Types.ObjectId, ref: "Material" },
      quantity: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
      date: { type: String, default: "" },
      validity: { type: String, default: "" },
      status: { type: String, default: "Draft" },
    },
    base,
  ),
);

export const SalesOrder = mongoose.model(
  "SalesOrder",
  new mongoose.Schema(
    {
      code,
      customer: { type: String, required: true },
      customerRef: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
      items: { type: String, default: "" },
      lines: [{ material: String, materialRef: mongoose.Schema.Types.ObjectId, quantity: Number }],
      amount: { type: Number, default: 0 },
      status: { type: String, default: "Draft" },
      date: { type: String, default: "" },
      rep: { type: String, default: "" },
      repRef: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      stockApplied: { type: Boolean, default: false },
    },
    base,
  ),
);

export const Payment = mongoose.model(
  "Payment",
  new mongoose.Schema(
    {
      code,
      customer: { type: String, required: true },
      customerRef: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
      order: { type: String, default: "" },
      orderRef: { type: mongoose.Schema.Types.ObjectId, ref: "SalesOrder" },
      amount: { type: Number, default: 0 },
      method: { type: String, default: "Bank transfer" },
      date: { type: String, default: "" },
      status: { type: String, default: "Pending" },
    },
    base,
  ),
);

export const Notification = mongoose.model(
  "Notification",
  new mongoose.Schema(
    {
      code,
      title: { type: String, required: true },
      user: { type: String, default: "System" },
      userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      date: { type: String, default: "" },
      status: { type: String, default: "Unread" },
      category: { type: String, default: "Sales" },
      tone: { type: String, default: "info" },
    },
    base,
  ),
);

export const MonthlyStat = mongoose.model(
  "MonthlyStat",
  new mongoose.Schema(
    {
      m: { type: String, required: true, unique: true },
      sales: { type: Number, default: 0 },
      purchase: { type: Number, default: 0 },
      sort: { type: Number, default: 0 },
    },
    { timestamps: true },
  ),
);

export const AccessRequest = mongoose.model(
  "AccessRequest",
  new mongoose.Schema(
    {
      email: { type: String, required: true, lowercase: true, trim: true },
      role: { type: String, default: "Employee" },
      status: { type: String, default: "Open" },
    },
    { timestamps: true },
  ),
);
