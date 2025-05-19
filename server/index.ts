import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, submitCandidateTest } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 10000) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5001 (changed from 5000 to avoid conflict)
  const port = 5001;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Auto-submit background job
  setInterval(async () => {
    try {
      // Get only in-progress candidates
      const candidates = await storage.getCandidatesInProgress();
      console.log(candidates,'candidates');
      
      const now = new Date();
      for (const candidate of candidates) {
        // Get test duration
        const test = await storage.getTest(candidate.testId);
        if (!test) continue;
        if (!candidate.startedAt) continue;
        const startedAt = new Date(candidate.startedAt);
        const allowedMs = (test.duration + 5) * 60 * 1000; // duration + 5 min
        if (now.getTime() - startedAt.getTime() > allowedMs) {
          // Auto-submit directly
          await submitCandidateTest(candidate, true);
        }
      }
    } catch (err) {
      console.error("Auto-submit job error:", err);
    }
  }, 1 * 60 * 1000); // every 5 minutes
})();
