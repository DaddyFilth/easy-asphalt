import { ENV } from "./_core/env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const LOCAL_STORAGE_URL_PREFIX = "/local-storage";
export const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), ".local-storage");

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function getLocalStoragePath(key: string) {
  const filePath = path.resolve(LOCAL_STORAGE_DIR, key);
  if (!filePath.startsWith(`${LOCAL_STORAGE_DIR}${path.sep}`)) {
    throw new Error("Invalid local storage key");
  }
  return filePath;
}

function canUseS3(): boolean {
  return !!(ENV.s3Bucket && process.env.AWS_ACCESS_KEY_ID);
}

function getS3Client(): S3Client {
  return new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
  });
}

async function localStoragePut(
  relKey: string,
  data: Buffer | Uint8Array | string
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const filePath = getLocalStoragePath(key);
  const payload = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, payload, { flag: "wx" });
  return { key, url: `${LOCAL_STORAGE_URL_PREFIX}/${key}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (!canUseS3()) {
    return localStoragePut(relKey, data);
  }

  const key = appendHashSuffix(normalizeKey(relKey));
  const body = typeof data === "string" ? data : new Uint8Array(data);

  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: ENV.s3Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return {
    key,
    url: `/manus-storage/${key}`,
  };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  if (!canUseS3()) {
    return { key, url: `${LOCAL_STORAGE_URL_PREFIX}/${key}` };
  }
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);

  if (!canUseS3()) {
    return `${LOCAL_STORAGE_URL_PREFIX}/${key}`;
  }

  const client = getS3Client();
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key }),
    { expiresIn: 3600 }
  );
  return url;
}
