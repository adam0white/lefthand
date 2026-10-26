import { defineConfig } from "vite";
export default defineConfig({
  plugins: [
    {
      name: "encoded-godot-preview",
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.match(/^\/engine\/game-[a-f0-9]+\.wasm$/)) {
            res.setHeader("Content-Encoding", "gzip");
            res.setHeader("Content-Type", "application/wasm");
          }
          next();
        });
      },
    },
  ],
  server: { host: "127.0.0.1" },
  build: { target: "esnext" },
});
