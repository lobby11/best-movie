import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // ✅ new-tailwind integration
     process.env.VITE_BASE_PATH || "/best-movie",
  ],
});
