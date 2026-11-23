import dotenv from "dotenv";
import { start } from "./server.js";

dotenv.config();
start().catch((error) => {
  console.error(error);
  process.exit(1);
});
