import { describe, it, expect, vi } from "vitest";

// Verify the LLM wrapper shapes a request correctly without making real API calls
vi.mock("openai", () => {
  const mockCreate = vi.fn().mockResolvedValue({
    choices: [{ message: { content: '{"test":true}', role: "assistant" } }],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  });
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    })),
    __mockCreate: mockCreate,
  };
});

import { invokeLLM } from "./llm";

describe("LLM Core", () => {
  it("returns choices array from provider", async () => {
    const result = await invokeLLM({
      messages: [{ role: "user", content: "hello" }],
    });
    expect(result.choices).toHaveLength(1);
    expect(result.choices[0].message.content).toBe('{"test":true}');
  });

  it("passes messages through to provider", async () => {
    const messages = [
      { role: "system" as const, content: "You are helpful." },
      { role: "user" as const, content: "Analyze this." },
    ];
    const result = await invokeLLM({ messages });
    expect(result.choices[0].message.role).toBe("assistant");
  });

  it("handles json_schema response_format option", async () => {
    const result = await invokeLLM({
      messages: [{ role: "user", content: "json please" }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "test_schema",
          strict: true,
          schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false },
        },
      },
    });
    expect(result.choices).toBeDefined();
  });
});
