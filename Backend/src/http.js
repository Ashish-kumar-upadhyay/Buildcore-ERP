export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function readBody(req) {
  const source = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
  const clean = {};
  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith("$") || key.includes(".")) continue;
    clean[key] = value;
  }
  return clean;
}
