import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project sites use /repository-name/ as their base path.
// Local development and root-domain hosting use /.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/",
});
