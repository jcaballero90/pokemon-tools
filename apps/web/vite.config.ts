import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { "/api": "http://127.0.0.1:4000" } },
  test: { environment: "jsdom", exclude: ["e2e/**", "**/node_modules/**", "**/dist/**"] }
});
