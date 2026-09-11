import { defineConfig } from "vite";
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  server: { port: 5173, proxy: { "/api": "http://localhost:3001" } }
});
