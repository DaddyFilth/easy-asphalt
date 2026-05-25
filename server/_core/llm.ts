import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = { type: "text"; text: string };
export type ImageContent = {
  type: "image_url";
  image_url: { url: string; detail?: "auto" | "low" | "high" };
};
export type FileContent = {
  type: "file_url";
  file_url: { url: string; mime_type?: string };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: { name: string; description?: string; parameters?: Record<string, unknown> };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = { type: "function"; function: { name: string } };
export type ToolChoice = ToolChoicePrimitive | ToolChoiceByName | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: Role; content: string | Array<TextContent | ImageContent | FileContent>; tool_calls?: ToolCall[] };
    finish_reason: string | null;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
};

export type JsonSchema = { name: string; schema: Record<string, unknown>; strict?: boolean };
export type OutputSchema = JsonSchema;
export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

function toGeminiParts(content: MessageContent | MessageContent[]): Part[] {
  const parts: Part[] = [];
  const items = Array.isArray(content) ? content : [content];
  for (const item of items) {
    if (typeof item === "string") {
      parts.push({ text: item });
    } else if (item.type === "text") {
      parts.push({ text: item.text });
    } else if (item.type === "image_url") {
      parts.push({ text: `[Image: ${item.image_url.url}]` });
    } else if (item.type === "file_url") {
      parts.push({ text: `[File: ${item.file_url.url}]` });
    }
  }
  return parts;
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(ENV.geminiApiKey);
  const model = genAI.getGenerativeModel(
    { model: ENV.llmModel || "gemini-2.5-flash" },
    { baseUrl: ENV.geminiApiEndpoint }
  );

  const history: { role: "user" | "model"; parts: Part[] }[] = [];
  let lastUserParts: Part[] | undefined;

  for (const msg of params.messages) {
    const parts = toGeminiParts(msg.content);
    if (msg.role === "system") {
      const systemText = parts.map(p => "text" in p ? p.text : "").filter(Boolean).join("\n");
      history.unshift({ role: "user", parts: [{ text: `[System]: ${systemText}` }] });
    } else if (msg.role === "user") {
      lastUserParts = parts;
    } else if (msg.role === "assistant") {
      history.push({ role: "model", parts });
    }
  }

  const generationConfig: Record<string, unknown> = {};
  if (params.response_format?.type === "json_schema") {
    generationConfig.responseMimeType = "application/json";
  }

  try {
    const result = await model.generateContent({
      contents: [
        ...history,
        ...(lastUserParts ? [{ role: "user" as const, parts: lastUserParts }] : []),
      ],
      generationConfig,
    });

    const text = result.response.text();
    const candidate = result.response.candidates?.[0];

    return {
      id: "gemini-" + Date.now(),
      created: Math.floor(Date.now() / 1000),
      model: ENV.llmModel,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: text,
          },
          finish_reason: candidate?.finishReason ?? "stop",
        },
      ],
      usage: {
        prompt_tokens: result.response.usageMetadata?.promptTokenCount ?? 0,
        completion_tokens: result.response.usageMetadata?.candidatesTokenCount ?? 0,
        total_tokens: result.response.usageMetadata?.totalTokenCount ?? 0,
      },
    };
  } catch (error) {
    throw new Error(
      `LLM invoke failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
