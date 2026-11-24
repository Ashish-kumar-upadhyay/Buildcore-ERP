# BuildCore ERP — Interview Project Overview

> Use this as a quick preparation sheet. The short and detailed pitches below describe what is in the repository; personalize the parts about your own contribution before the interview.

## 30-second project pitch

**BuildCore ERP is a web-based ERP for building-materials businesses. It brings inventory, purchasing, sales, and employee operations into one workspace. The frontend is built with React and TypeScript using TanStack Start and TanStack Router; a JavaScript and Express API handles business operations; MongoDB with Mongoose stores the data. The system includes role-based access, workflows such as purchase receiving and sales dispatch, and a dashboard for operational reporting.**

## Project at a glance

- **Product:** An ERP workspace tailored to building-material suppliers and construction operations.
- **Goal:** Keep stock, supplier/customer records, orders, payments, and staff activity connected instead of tracking them in separate tools.
- **Shape:** A React web app communicates with a JSON REST API. The API applies business rules and persists records in MongoDB.
- **Audience:** Administrators, inventory and sales teams, HR, managers, employees, and sales representatives.

## Main features

### Dashboard and reporting

- Dashboard with stock, people, customer/vendor, sales-order, and recent-activity summaries.
- Sales and purchase trends, plus reports covering monthly figures, materials, and employees.
- Low-stock alerts based on material reorder levels.

### Inventory and purchasing

- Material catalogue with categories, units, prices, vendors, current stock, transit quantities, and reorder levels.
- Record stock movements and view a transaction history.
- Create purchase orders and track their status from draft/submission through partial or full receipt.
- Record goods receipts; receiving material updates stock and creates traceable receipt and stock-history records.

### Sales and customer management

- Manage customers, sales representatives, and leads through a sales pipeline.
- Create and track quotations, sales orders, and customer payments.
- On dispatch, sales-order items are checked against available stock and inventory is reduced.
- Business events can create in-app notifications.

### People operations

- Manage employees, departments, and attendance.
- Employee self-service for check-in/check-out and leave requests.
- Track leave and expense requests through approval workflows.
- Employee creation also provisions a workspace account and login ID.

### Access and usability

- Role-aware access for administrators, HR, inventory, sales, managers, employees, and sales representatives.
- Responsive layouts, search/filtering, forms, dialogs, charts, light/dark appearance, and mobile navigation.

## Technology stack

| Area | Technologies |
|---|---|
| Frontend language | **TypeScript** (`.ts` / `.tsx`); React components use JSX/TSX |
| Frontend framework and routing | React 19, TanStack Start, TanStack Router |
| UI and styling | Tailwind CSS 4, CSS, Radix UI, Lucide icons |
| Motion and charts | Framer Motion, Recharts |
| Frontend tooling and tests | Vite, TypeScript, Vitest, Testing Library |
| Backend language | **JavaScript** using ES modules (`.js`) |
| Backend framework | Node.js, Express |
| Database and data layer | MongoDB, Mongoose |
| Authentication and middleware | JWT, bcryptjs, Helmet, CORS, express-rate-limit |

### Languages to say in an interview

> “The frontend is written in TypeScript with React and TSX, and the backend is written in JavaScript on Node.js. The interface is styled with Tailwind CSS and regular CSS. MongoDB is the database.”

## High-level architecture

```text
Browser
  React + TypeScript UI
  TanStack Start / Router
  Shared UI components, forms, tables, and charts
          |
          | JSON requests; Bearer token for authenticated API calls
          v
  Express REST API (Node.js / JavaScript)
  Authentication, role checks, validation, and ERP workflows
          |
          | Mongoose
          v
  MongoDB
  Users, materials, purchases, receipts, transactions,
  customers, sales, employees, attendance, requests, and notifications
```

### Important code locations

- `Frontend/src/routes/` — file-based pages such as dashboard, inventory, purchases, sales, HR, reports, and login.
- `Frontend/src/components/erp/` — shared ERP shell and reusable business forms/panels.
- `Frontend/src/lib/api.ts` — API requests and client session handling.
- `Frontend/src/lib/module-config.ts` — frontend metadata for configurable record modules.
- `Backend/src/routes.js` — REST endpoints.
- `Backend/src/registry.js` — backend module definitions and role permissions.
- `Backend/src/domain.js` — shared validation, record relationships, stock, and status-change rules.
- `Backend/src/models.js` — Mongoose data models.
- `Backend/src/db.js` — MongoDB connection setup.

## Business workflows worth explaining

### Purchase receipt updates inventory

1. A user creates a purchase order with a vendor, material, and quantity.
2. The order can be received in multiple deliveries.
3. Each valid receipt increases material stock, updates the received/pending quantities, and records receipt and stock-history entries.
4. The order becomes partially received or received depending on the remaining quantity.

### Sales dispatch checks stock

1. A sales order is associated with a customer and one or more material items.
2. When it is dispatched, the API checks that enough stock is available.
3. It reduces stock, records stock-out transactions, updates sales totals, and creates an activity notification.

### Leave approval and employee self-service

Employees can submit leave requests and record attendance. Approval permissions are restricted to designated administrative/HR roles; approving leave updates the employee status and generates a notification.

## Security and access-control points

- Login verifies password hashes and returns a signed JWT.
- The frontend sends the token in the `Authorization: Bearer ...` header for authenticated API calls.
- Backend module permissions distinguish who may read and write each record type; the server enforces these checks.
- Passwords are hashed with bcryptjs. Login attempts are rate-limited, and Helmet is enabled for HTTP security headers.
- The UI adapts to roles, but **the backend is the source of authorization enforcement**.

## Running and testing locally

Run each service in its own terminal:

```sh
cd Backend
npm install
npm run dev
```

```sh
cd Frontend
npm install
npm run dev
```

- The backend defaults to port `4000`.
- The frontend API base can be configured with `VITE_API_URL`; otherwise it defaults to `http://localhost:4000/api`.
- The backend accepts `MONGO_URI` for a MongoDB connection. Without it, the repository configures a local MongoDB memory-server data directory.
- Frontend tests: `npm test` (Vitest).
- Backend self-test: `npm test` (Node.js self-test script).

## Interview questions you may get

**Why use MongoDB here?**  
The application has several related business record types and uses Mongoose schemas to define and validate them. References connect related records such as purchase orders, materials, vendors, and receipts.

**How do you prevent a sales dispatch from overselling stock?**  
The backend checks available stock for each order line before applying the dispatch. If a line cannot be fulfilled, it rejects the status change; successful dispatches reduce stock and add transaction history.

**How is access controlled?**  
Each authenticated request has a user role. Backend module metadata defines which roles can read or write, and route handlers enforce the permissions before changing data.

**What was an important design decision?**  
Keeping workflow rules in the API instead of relying only on the UI. For example, receiving a purchase order changes stock, so that operation and its validation belong on the backend.

**What would you improve next?**  
Add more end-to-end coverage for multi-step purchasing and sales workflows, expand audit/history views, and connect external identity providers if real OAuth sign-in is required.

## Be precise about the current implementation

- The sign-in screen’s Google/GitHub/Microsoft options are **preview/demo UI**, not production OAuth integrations. Do not describe them as live social login.
- Describe the dashboards and reports as the project currently implements them; avoid claiming integrations or real-time external data sources that are not in the repository.
- Explain your personal contribution accurately. This file describes the project, not which parts you individually authored.
