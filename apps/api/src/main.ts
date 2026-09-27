import { readConfig } from "./config.js";
import { createDb } from "./db.js";
import { buildApp } from "./app.js";

const config = readConfig();
const db = createDb(config.DATABASE_URL);
const app = await buildApp(config, db);
app.addHook("onClose", () => db.$disconnect());
await app.listen({ host: config.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1", port: config.PORT });
