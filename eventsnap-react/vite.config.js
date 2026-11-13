import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/", // absolute, so deep links like /admin load correctly
  css: {
    // admin.module.css classes like .btn-p become styles.btnP
    modules: { localsConvention: "camelCaseOnly" },
  },
});
