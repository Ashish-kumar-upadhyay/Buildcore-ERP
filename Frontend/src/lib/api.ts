export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Session = { token: string; user: SessionUser };

const KEY = "buildcore.session";

export function readSession(): Session | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (!session?.token || !session.user?.email) return null;
    return session;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: SessionUser) {
  localStorage.setItem(KEY, JSON.stringify({ token, user }));
}

export function clearSession() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function apiBase() {
  return import.meta.env["VITE_API_URL"] || "http://localhost:4000/api";
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = readSession()?.token;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${apiBase()}${path}`, { ...init, headers });
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  if (response.status === 401 && !path.startsWith("/auth/")) {
    clearSession();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.assign("/login");
    }
  }
  if (!response.ok) throw new ApiError(response.status, data.message || "Request failed");
  return data as T;
}

export async function login(email: string, password: string) {
  const data = await api<{ token: string; user: SessionUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveSession(data.token, data.user);
  return data.user;
}

export const roleAccounts: Record<string, { email: string; password: string }> = {
  Admin: { email: "ishaan@buildcore.com", password: "Admin@123" },
  "Sub-admin": { email: "ishita@buildcore.com", password: "Subadmin@123" },
  "HR Manager": { email: "priya@buildcore.com", password: "Hr@123456" },
  "Inventory Manager": { email: "aarav@buildcore.com", password: "Inventory@123" },
  "Sales Manager": { email: "rohan@buildcore.com", password: "Sales@12345" },
  "Sales Rep": { email: "karan@buildcore.com", password: "Salesrep@123" },
  Employee: { email: "ananya@buildcore.com", password: "Employee@123" },
};
