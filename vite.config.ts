import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vinext()],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 3000,
  },
});
