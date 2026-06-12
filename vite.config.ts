import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [
      react(),
      tailwindcss(),
      visualizer({
        filename: "reports/bundle-visualizer.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],

    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GOOGLE_MAPS_PLATFORM_KEY": JSON.stringify(
        env.GOOGLE_MAPS_PLATFORM_KEY || ""
      ),
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },

    server: {
      hmr: process.env.DISABLE_HMR !== "true",
    },

    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            firebase: ["firebase/app", "firebase/firestore", "firebase/auth"],
            icons: ["lucide-react"],
          },
        },
      },
    },
  };
});
