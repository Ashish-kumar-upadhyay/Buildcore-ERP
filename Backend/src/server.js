import express from "express";
import cors from "cors";
import helmet from "helmet";
import { connectDatabase } from "./db.js";
import { HttpError } from "./http.js";
import routes from "./routes.js";
import { seedIfEmpty } from "./seed.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: true, allowedHeaders: ["Content-Type", "Authorization"] }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", routes);
  app.use((error, _req, res, _next) => {
    if (error?.code === 11000) {
      res.status(409).json({ message: "A record with this reference already exists" });
      return;
    }
    const status = error instanceof HttpError ? error.status : error.status || 500;
    if (status >= 500) console.error(error);
    res.status(status).json({ message: status >= 500 ? "Something went wrong" : error.message });
  });
  return app;
}

export async function start(options = {}) {
  if (options.mongoUri) process.env.MONGO_URI = options.mongoUri;
  if (options.dataPath) process.env.MONGO_DATA_PATH = options.dataPath;
  await connectDatabase();
  await seedIfEmpty();
  const app = createApp();
  const port = options.port ?? Number(process.env.PORT || 4000);
  const server = await new Promise((resolve) => {
    const listener = app.listen(port, () => resolve(listener));
  });
  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  console.log(`BuildCore ERP API listening on http://localhost:${actualPort}`);
  return {
    server,
    baseUrl: `http://127.0.0.1:${actualPort}`,
  };
}
