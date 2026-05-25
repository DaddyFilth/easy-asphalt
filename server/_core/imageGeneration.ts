import { GoogleGenerativeAI } from "@google/generative-ai";
import { storagePut } from "../storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
  key?: string;
  mimeType?: string;
  usedFallback?: boolean;
};

async function fetchImageAsBase64(
  url: string
): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(
      `Failed to fetch source image (${response.status} ${response.statusText})`
    );
  const buffer = await response.arrayBuffer();
  return {
    base64: Buffer.from(buffer).toString("base64"),
    mimeType: response.headers.get("content-type") || "image/jpeg",
  };
}

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const originalImage = options.originalImages?.[0];

  if (!ENV.geminiApiKey) {
    if (!ENV.isProduction && originalImage?.url) {
      return {
        url: originalImage.url,
        mimeType: originalImage.mimeType,
        usedFallback: true,
      };
    }
    throw new Error(
      "Image generation is not configured: set GEMINI_API_KEY"
    );
  }

  const genAI = new GoogleGenerativeAI(ENV.geminiApiKey);
  const model = genAI.getGenerativeModel(
    { model: "gemini-3-pro-image" },
    { baseUrl: ENV.geminiApiEndpoint }
  );

  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [
    { text: options.prompt },
  ];

  if (originalImage?.url) {
    const source = await fetchImageAsBase64(originalImage.url);
    parts.push({
      inlineData: { mimeType: source.mimeType, data: source.base64 },
    });
  }

  const response = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: { responseModalities: ["IMAGE"] } as any,
  });

  const candidate = response.response.candidates?.[0];
  const part = candidate?.content?.parts?.[0];

  if (!part || !("inlineData" in part) || !part.inlineData?.data) {
    throw new Error("Gemini did not return an image in the response");
  }

  const base64Data = part.inlineData.data;
  const mimeType = part.inlineData.mimeType || "image/png";
  const buffer = Buffer.from(base64Data, "base64");

  const { key, url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    mimeType
  );

  return { key, url, mimeType };
}
