import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Set ELEA_BASE=/assistant-pme/ for GitHub Pages project sites. */
export default defineConfig({
  base: process.env.ELEA_BASE ?? "/",
  plugins: [react()],
});
