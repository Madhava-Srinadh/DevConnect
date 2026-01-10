// vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); // Still load env variables

  return {
    plugins: [react()],
    server: {
      port: 5173, // Your frontend development server port
      // Proxy configuration removed
    },
    build: {
      sourcemap: false, // Disable source maps globally
    },
  };
});
