import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerMobileCors } from "./cors";
import { serveStatic } from "./static";
import { authRateLimit, apiRateLimit } from "./rateLimit";
import path from "path";
import fs from "fs";
import { LOCAL_STORAGE_DIR, LOCAL_STORAGE_URL_PREFIX } from "../storage";
import { initSentry } from "./sentry";
import compression from "compression";
import { captureMessage } from "@sentry/node";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Initialize Sentry for error tracking and performance monitoring
  initSentry();
  
  const app = express();
  const server = createServer(app);
  registerMobileCors(app);
  
  // Compression middleware for better performance
  if (process.env.NODE_ENV === "production") {
    app.use(compression());
  }
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Request logging middleware (production only)
  if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip || req.socket.remoteAddress,
        };
        console.log(JSON.stringify(logData));
        
        // Log slow requests to Sentry
        if (duration > 1000) {
          captureMessage(`Slow request detected`, {
            level: 'warning',
            extra: logData,
          });
        }
      });
      next();
    });
  }
  
  registerStorageProxy(app);
  
  // Health check endpoint for load balancers and monitoring
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    });
  });
  
  // Apply rate limiting
  app.use("/api/trpc", apiRateLimit);
  app.use("/api/trpc/auth.login", authRateLimit);
  app.use("/api/trpc/auth.signup", authRateLimit);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    // Serve local-storage for uploaded files
    if (fs.existsSync(LOCAL_STORAGE_DIR)) {
      app.use(LOCAL_STORAGE_URL_PREFIX, express.static(LOCAL_STORAGE_DIR));
    }
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  const host =
    process.env.HOST ||
    (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}/`);
  });
  
  // Graceful shutdown handlers
  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch(console.error);
