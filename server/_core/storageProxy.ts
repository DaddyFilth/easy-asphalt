import type { Express } from "express";
import { LOCAL_STORAGE_DIR, LOCAL_STORAGE_URL_PREFIX } from "../storage";
import path from "node:path";
import { ENV } from "./env";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export function registerStorageProxy(app: Express) {
  app.get(`${LOCAL_STORAGE_URL_PREFIX}/*`, (req, res) => {
    if (ENV.isProduction) {
      res.status(404).send("Not found");
      return;
    }

    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    const filePath = path.resolve(LOCAL_STORAGE_DIR, key);
    if (!filePath.startsWith(`${LOCAL_STORAGE_DIR}${path.sep}`)) {
      res.status(400).send("Invalid storage key");
      return;
    }

    res.set("Cache-Control", "no-store");
    res.sendFile(filePath, err => {
      if (err && !res.headersSent) {
        res.status(404).send("Stored file not found");
      }
    });
  });

  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.s3Bucket) {
      res.status(404).send("Not found");
      return;
    }

    try {
      const client = new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
      });
      const command = new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key });
      const s3Response = await client.send(command);
      const stream = s3Response.Body as NodeJS.ReadableStream | undefined;
      if (!stream) {
        res.status(502).send("Storage backend error");
        return;
      }

      if (s3Response.ContentType) {
        res.set("Content-Type", s3Response.ContentType);
      }
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      stream.pipe(res);
    } catch (err) {
      console.error("[StorageProxy] S3 error:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
