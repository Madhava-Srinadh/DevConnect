// vite.config.js
import { defineConfig, loadEnv } from "vite"; // Import loadEnv
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Accept mode parameter
  const env = loadEnv(mode, process.cwd(), ""); // Load env variables based on mode

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Use the development API base URL from env variables
        "/api": {
          target: env.VITE_API_BASE_URL.replace("/api", ""), // Remove /api for the target
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          secure: false, // Set to false if your backend is HTTP locally
        },
      },
    },
  };
});
