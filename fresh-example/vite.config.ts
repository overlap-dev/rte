import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { fresh } from "@fresh/plugin-vite";

export default defineConfig({
  plugins: [
    fresh(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "react": "preact/compat",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
  },
});
