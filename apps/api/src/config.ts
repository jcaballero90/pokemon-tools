import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DEPLOY_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  PUBLIC_BASE_URL: z.url(),
  TRUSTED_ORIGINS: z.string().default(""),
  EDGE_CIDR: z.string().default(""),
  STATIC_DIR: z.string().optional(),
  SMTP_URL: z.string().optional(),
  EMAIL_FROM: z.preprocess((value) => value === "" ? undefined : value, z.email().optional())
});

export type Config = z.infer<typeof schema>;
export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const config = schema.parse(env);
  if (config.NODE_ENV === "production" && (!config.EDGE_CIDR || !config.PUBLIC_BASE_URL.startsWith("https://"))) {
    throw new Error("Production requires EDGE_CIDR and an HTTPS PUBLIC_BASE_URL");
  }
  return config;
}
