// Local development / standalone Node server entrypoint.
// The actual Express app + routes live in api/index.ts (self-contained inside
// the /api folder) so that Vercel's serverless Function builder can trace and
// bundle it correctly without needing to reach outside /api.
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import app from "./api/index";

const PORT = 3000;

// Vite Middleware for development / Static file serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Decul Map AI Chatbot server running on http://0.0.0.0:${PORT}`);
  });
}

// Start server locally / on Cloud Run (Vercel uses serverless /api/index.ts directly)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
