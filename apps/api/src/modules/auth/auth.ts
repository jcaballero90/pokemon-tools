import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import nodemailer from "nodemailer";
import type { Config } from "../../config.js";
import type { Database } from "../../db.js";

export function createAuth(db: Database, config: Config) {
  const transport = config.SMTP_URL && config.EMAIL_FROM ? nodemailer.createTransport(config.SMTP_URL) : null;
  return betterAuth({
    database: prismaAdapter(db, { provider: "postgresql" }),
    baseURL: config.PUBLIC_BASE_URL,
    secret: config.BETTER_AUTH_SECRET,
    trustedOrigins: [config.PUBLIC_BASE_URL, ...config.TRUSTED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: Boolean(transport),
      sendResetPassword: transport ? async ({ user, url }) => {
        await transport.sendMail({ from: config.EMAIL_FROM, to: user.email, subject: "Reset your Pokémon Tools password", text: `Reset your password: ${url}` });
      } : undefined
    },
    emailVerification: transport ? {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        await transport.sendMail({ from: config.EMAIL_FROM, to: user.email, subject: "Verify your Pokémon Tools email", text: `Verify your email: ${url}` });
      }
    } : undefined,
    advanced: { useSecureCookies: config.PUBLIC_BASE_URL.startsWith("https://"), ipAddress: { ipAddressHeaders: ["x-real-ip"] } },
    rateLimit: { enabled: true, window: 60, max: 100 }
  });
}
export type Auth = ReturnType<typeof createAuth>;
