import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

let memory = null;

export async function connectDatabase() {
  let uri = process.env.MONGO_URI?.trim();
  if (!uri) {
    const dbPath = path.resolve(process.env.MONGO_DATA_PATH || "data/mongo");
    fs.mkdirSync(dbPath, { recursive: true });
    memory = await MongoMemoryReplSet.create({
      replSet: { count: 1 },
      instanceOpts: [{ dbPath, storageEngine: "wiredTiger" }],
      binary: { version: "7.0.14" },
    });
    uri = memory.getUri("buildcore");
    console.log(`Local MongoDB ready (data directory: ${dbPath})`);
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const { host, name } = mongoose.connection;
  console.log(`Connected to MongoDB database "${name}" at ${host}`);
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memory) {
    await memory.stop({ doCleanup: false, force: false });
    memory = null;
  }
}
