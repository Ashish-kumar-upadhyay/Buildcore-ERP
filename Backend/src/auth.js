import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "./models.js";
import { HttpError } from "./http.js";

const secret = () => process.env.JWT_SECRET || "buildcore-erp-dev-secret";

export function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, secret(), {
    expiresIn: process.env.JWT_EXPIRES || "12h",
  });
}

export function publicUser(user) {
  return { id: user.code, name: user.name, email: user.email, role: user.role };
}

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new HttpError(401, "Sign in required");
    const payload = jwt.verify(token, secret());
    const user = await User.findById(payload.sub);
    if (!user) throw new HttpError(401, "Sign in required");
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof HttpError) next(error);
    else next(new HttpError(401, "Sign in required"));
  }
}

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters");
  }
  return bcrypt.hash(password, 10);
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function newResetToken() {
  return crypto.randomBytes(24).toString("hex");
}
