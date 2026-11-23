import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createApp } from "./server.js";
import { seedIfEmpty } from "./seed.js";

const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1 },
  binary: { version: "7.0.14" },
});
let server;

try {
  await mongoose.connect(replSet.getUri("buildcore"), {
    serverSelectionTimeoutMS: 15000,
  });
  await seedIfEmpty();

  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/api`;
  const call = async (path, method = "GET", body, token) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, data: await response.json() };
  };

  const login = await call("/auth/login", "POST", {
    email: "aarav@buildcore.com",
    password: "Inventory@123",
  });
  assert.equal(login.status, 200);
  const token = login.data.token;

  const adminLogin = await call("/auth/login", "POST", {
    email: "ishaan@buildcore.com",
    password: "Admin@123",
  });
  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.data.token;
  const employeeCreated = await call(
    "/records/employees",
    "POST",
    {
      id: "EMP-IGNORED",
      name: "Selftest Employee",
      loginId: "CUSTOM-LOGIN-IGNORED",
      role: "Manager",
      dept: "Warehouse",
      status: "Present",
      password: "Selftest@123",
    },
    adminToken,
  );
  assert.equal(employeeCreated.status, 201);
  assert.match(employeeCreated.data.row.id, /^EMP-[A-F0-9]{10}$/);
  assert.equal(employeeCreated.data.row.loginId, "ERP-10001");
  assert.equal(employeeCreated.data.credentials.loginId, "ERP-10001");
  const secondEmployee = await call(
    "/records/employees",
    "POST",
    {
      name: "Second Selftest Employee",
      loginId: "CUSTOM-LOGIN-IGNORED",
      role: "Employee",
      dept: "Warehouse",
      status: "Present",
      password: "Selftest@123",
    },
    adminToken,
  );
  assert.equal(secondEmployee.status, 201);
  assert.equal(secondEmployee.data.credentials.loginId, "ERP-10002");

  const employeeLogin = await call("/auth/login", "POST", {
    identifier: "erp-10001",
    password: "Selftest@123",
  });
  assert.equal(employeeLogin.status, 200);
  assert.equal(employeeLogin.data.user.role, "Manager");
  const managerToken = employeeLogin.data.token;
  assert.equal((await call("/materials", "GET", undefined, managerToken)).status, 403);
  assert.equal((await call("/dashboard", "GET", undefined, managerToken)).status, 403);
  assert.equal((await call("/records/leaves", "GET", undefined, managerToken)).status, 403);

  const materialOptions = await call(
    "/material-requests/material-options",
    "GET",
    undefined,
    managerToken,
  );
  assert.equal(materialOptions.status, 200);
  assert.ok(materialOptions.data.rows.length > 0);
  assert.equal("stock" in materialOptions.data.rows[0], false);
  const selectedMaterial = materialOptions.data.rows.find(
    (row) => row.name === "UltraTech OPC 53 Cement",
  );
  assert.ok(selectedMaterial);
  const invalidMaterialRequest = await call(
    "/material-requests",
    "POST",
    {
      company: "XYZ Company",
      materialId: "MAT-DOES-NOT-EXIST",
      quantity: 20,
      notes: "",
    },
    managerToken,
  );
  assert.equal(invalidMaterialRequest.status, 400);

  const managerRequest = await call(
    "/material-requests",
    "POST",
    {
      company: "XYZ Company",
      materialId: selectedMaterial.id,
      quantity: 20,
      notes: "Site delivery",
    },
    managerToken,
  );
  assert.equal(managerRequest.status, 201);
  assert.equal(managerRequest.data.row.requesterName, "Selftest Employee");
  assert.equal(managerRequest.data.row.company, "XYZ Company");
  assert.equal(managerRequest.data.row.material, selectedMaterial.name);
  assert.equal(managerRequest.data.row.unit, selectedMaterial.unit);
  assert.equal(managerRequest.data.row.status, "Pending");
  const adminNotifications = await call("/records/notifications", "GET", undefined, adminToken);
  assert.ok(
    adminNotifications.data.rows.some(
      (row) =>
        row.category === "Material Requests" &&
        row.title.includes(managerRequest.data.row.id) &&
        row.status === "Unread",
    ),
  );

  const otherEmployeeLogin = await call("/auth/login", "POST", {
    identifier: secondEmployee.data.credentials.loginId,
    password: "Selftest@123",
  });
  assert.equal(otherEmployeeLogin.status, 200);
  assert.equal(otherEmployeeLogin.data.user.role, "Employee");
  const employeeToken = otherEmployeeLogin.data.token;
  assert.equal((await call("/dashboard", "GET", undefined, employeeToken)).status, 403);
  assert.equal((await call("/records/employees", "GET", undefined, employeeToken)).status, 403);
  assert.equal((await call("/materials", "GET", undefined, employeeToken)).status, 403);
  const checkIn = await call(
    "/attendance/punch",
    "POST",
    { action: "in" },
    employeeToken,
  );
  assert.equal(checkIn.status, 200);
  const ownAttendance = await call("/records/attendance", "GET", undefined, employeeToken);
  assert.equal(ownAttendance.status, 200);
  assert.equal(ownAttendance.data.rows.length, 1);
  assert.equal(ownAttendance.data.rows[0].name, "Second Selftest Employee");
  assert.equal((await call("/records/attendance", "GET", undefined, managerToken)).status, 403);
  const checkOut = await call(
    "/attendance/punch",
    "POST",
    { action: "out" },
    employeeToken,
  );
  assert.equal(checkOut.status, 200);

  const leaveRequest = await call(
    "/records/leaves",
    "POST",
    { type: "Casual", from: "2026-12-01", to: "2026-12-02" },
    employeeToken,
  );
  assert.equal(leaveRequest.status, 201);
  assert.equal(leaveRequest.data.row.name, "Second Selftest Employee");
  assert.equal(leaveRequest.data.row.days, 2);
  assert.equal(leaveRequest.data.row.status, "Pending");
  const cancelledLeaveRequest = await call(
    "/records/leaves",
    "POST",
    { type: "Sick", from: "2026-12-03", to: "2026-12-03" },
    employeeToken,
  );
  assert.equal(cancelledLeaveRequest.status, 201);
  const ownLeaves = await call("/records/leaves", "GET", undefined, employeeToken);
  assert.deepEqual(
    ownLeaves.data.rows.map((row) => row.id),
    [cancelledLeaveRequest.data.row.id, leaveRequest.data.row.id],
  );
  const adminLeaves = await call("/records/leaves", "GET", undefined, adminToken);
  assert.ok(adminLeaves.data.rows.some((row) => row.id === leaveRequest.data.row.id));
  const leaveNotifications = await call("/records/notifications", "GET", undefined, adminToken);
  assert.ok(
    leaveNotifications.data.rows.some(
      (row) =>
        row.category === "Leave Requests" &&
        row.title.includes(leaveRequest.data.row.id),
    ),
  );
  const approvedLeave = await call(
    `/records/leaves/${leaveRequest.data.row.id}/status`,
    "PATCH",
    { status: "Approved" },
    adminToken,
  );
  assert.equal(approvedLeave.status, 200);
  assert.equal(approvedLeave.data.row.status, "Approved");
  const cancelledLeave = await call(
    `/records/leaves/${cancelledLeaveRequest.data.row.id}/status`,
    "PATCH",
    { status: "Cancelled" },
    adminToken,
  );
  assert.equal(cancelledLeave.status, 200);
  assert.equal(cancelledLeave.data.row.status, "Cancelled");

  const employeeRequest = await call(
    "/material-requests",
    "POST",
    {
      company: "Acme Ltd",
      materialId: selectedMaterial.id,
      quantity: 5,
      notes: "",
    },
    employeeToken,
  );
  assert.equal(employeeRequest.status, 201);
  assert.equal(employeeRequest.data.row.requesterName, "Second Selftest Employee");

  const ownManagerRequests = await call("/material-requests", "GET", undefined, managerToken);
  assert.deepEqual(ownManagerRequests.data.rows.map((row) => row.id), [managerRequest.data.row.id]);
  const ownEmployeeRequests = await call("/material-requests", "GET", undefined, employeeToken);
  assert.deepEqual(ownEmployeeRequests.data.rows.map((row) => row.id), [employeeRequest.data.row.id]);
  const adminRequests = await call("/material-requests", "GET", undefined, adminToken);
  assert.equal(adminRequests.data.rows.length, 2);
  const dashboardRequests = await call("/dashboard", "GET", undefined, adminToken);
  assert.equal(dashboardRequests.data.pendingMaterialRequests, 2);
  assert.ok(dashboardRequests.data.activities.some((activity) =>
    activity.what.includes(managerRequest.data.row.id),
  ));
  const forbiddenReview = await call(
    `/material-requests/${managerRequest.data.row.id}/status`,
    "PATCH",
    { status: "Approved" },
    managerToken,
  );
  assert.equal(forbiddenReview.status, 403);
  const approvedRequest = await call(
    `/material-requests/${managerRequest.data.row.id}/status`,
    "PATCH",
    { status: "Approved" },
    adminToken,
  );
  assert.equal(approvedRequest.status, 200);
  const cancelledRequest = await call(
    `/material-requests/${employeeRequest.data.row.id}/status`,
    "PATCH",
    { status: "Cancelled" },
    adminToken,
  );
  assert.equal(cancelledRequest.status, 200);
  const updatedOwnManagerRequests = await call("/material-requests", "GET", undefined, managerToken);
  assert.equal(updatedOwnManagerRequests.data.rows[0].status, "Approved");
  const updatedOwnEmployeeRequests = await call("/material-requests", "GET", undefined, employeeToken);
  assert.equal(updatedOwnEmployeeRequests.data.rows[0].status, "Cancelled");

  const legacyReceipts = await call(
    "/records/purchases/PO-118/receipts",
    "GET",
    undefined,
    token,
  );
  assert.equal(legacyReceipts.data.rows.length, 1);
  assert.equal(legacyReceipts.data.rows[0].quantity, 300);

  const materialName = "Goods Receipt Selftest Material";
  const material = await call(
    "/materials",
    "POST",
    {
      id: "MAT-GRSELFTEST",
      name: materialName,
      category: "Testing",
      unit: "units",
      stock: 0,
      transit: 0,
      reorder: 1,
      price: 1,
      vendor: "UltraTech Ltd",
    },
    token,
  );
  assert.equal(material.status, 201);

  const purchase = await call(
    "/records/purchases",
    "POST",
    {
      id: "PO-GRSELFTEST",
      vendor: "UltraTech Ltd",
      material: materialName,
      quantity: 100,
      amount: 100,
      date: "2026-11-23",
      status: "Draft",
    },
    token,
  );
  assert.equal(purchase.status, 201);
  assert.equal(purchase.data.row.status, "Draft");

  const draftReceipt = await call(
    "/records/purchases/PO-GRSELFTEST/receipts",
    "POST",
    {
      requestId: "selftest-draft-receipt",
      quantity: 1,
      date: "2026-11-23",
      notes: "",
    },
    token,
  );
  assert.equal(draftReceipt.status, 400);

  const submitted = await call(
    "/records/purchases/PO-GRSELFTEST/status",
    "PATCH",
    { status: "Submitted" },
    token,
  );
  assert.equal(submitted.status, 200);
  const statusBypass = await call(
    "/records/purchases/PO-GRSELFTEST/status",
    "PATCH",
    { status: "Received" },
    token,
  );
  assert.equal(statusBypass.status, 400);

  const firstReceipt = {
    requestId: "selftest-receipt-60",
    quantity: 60,
    date: "2026-11-23",
    notes: "First delivery",
  };
  const firstAttempts = await Promise.all([
    call(
      "/records/purchases/PO-GRSELFTEST/receipts",
      "POST",
      firstReceipt,
      token,
    ),
    call(
      "/records/purchases/PO-GRSELFTEST/receipts",
      "POST",
      firstReceipt,
      token,
    ),
  ]);
  assert.deepEqual(
    firstAttempts.map((attempt) => attempt.status).sort(),
    [200, 201],
  );
  const first = firstAttempts.find((attempt) => attempt.status === 201);
  assert.ok(first);
  assert.equal(first.data.row.status, "Partially Received");
  assert.equal(first.data.row.receivedQuantity, 60);
  assert.equal(first.data.row.pendingQuantity, 40);

  const duplicateConflict = await call(
    "/records/purchases/PO-GRSELFTEST/receipts",
    "POST",
    { ...firstReceipt, quantity: 61 },
    token,
  );
  assert.equal(duplicateConflict.status, 409);

  const materialAfterFirst = await call("/materials", "GET", undefined, token);
  assert.equal(
    materialAfterFirst.data.rows.find((row) => row.id === "MAT-GRSELFTEST")
      .stock,
    60,
  );

  const overReceipt = await call(
    "/records/purchases/PO-GRSELFTEST/receipts",
    "POST",
    {
      requestId: "selftest-over-receipt",
      quantity: 41,
      date: "2026-11-23",
      notes: "",
    },
    token,
  );
  assert.equal(overReceipt.status, 400);

  const finalReceipt = await call(
    "/records/purchases/PO-GRSELFTEST/receipts",
    "POST",
    {
      requestId: "selftest-receipt-40",
      quantity: 40,
      date: "2026-11-24",
      notes: "Final delivery",
    },
    token,
  );
  assert.equal(finalReceipt.status, 201);
  assert.equal(finalReceipt.data.row.status, "Received");
  assert.equal(finalReceipt.data.row.receivedQuantity, 100);
  assert.equal(finalReceipt.data.row.pendingQuantity, 0);

  const materialAfterFinal = await call("/materials", "GET", undefined, token);
  assert.equal(
    materialAfterFinal.data.rows.find((row) => row.id === "MAT-GRSELFTEST")
      .stock,
    100,
  );

  const receiptHistory = await call(
    "/records/purchases/PO-GRSELFTEST/receipts",
    "GET",
    undefined,
    token,
  );
  assert.equal(receiptHistory.data.rows.length, 2);
  assert.deepEqual(
    receiptHistory.data.rows.map((row) => row.quantity),
    [60, 40],
  );

  const stockHistory = await call(
    "/records/transactions",
    "GET",
    undefined,
    token,
  );
  const receiptTransactions = stockHistory.data.rows.filter((row) =>
    receiptHistory.data.rows.some((receipt) => receipt.id === row.reference),
  );
  assert.equal(receiptTransactions.length, 2);
  assert.deepEqual(
    receiptTransactions.map((row) => row.quantity).sort((a, b) => a - b),
    [40, 60],
  );

  console.log(
    "Self-test passed: employee login, own requests, and partial goods receiving",
  );
} finally {
  if (server)
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  await mongoose.disconnect();
  await replSet.stop();
}
