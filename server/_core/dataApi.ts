export type DataApiCallOptions = {
  baseUrl: string;
  apiKey?: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
};

export async function callDataApi(
  apiId: string,
  options: DataApiCallOptions
): Promise<unknown> {
  const baseUrl = options.baseUrl;
  const apiKey = options.apiKey;
  if (!baseUrl) {
    throw new Error("External API base URL is required");
  }

  const normalized = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const fullUrl = new URL("webdevtoken.v1.WebDevService/CallApi", normalized).toString();

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      apiId,
      query: options.query,
      body: options.body,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Data API request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (payload && typeof payload === "object" && "jsonData" in payload) {
    try {
      return JSON.parse((payload as Record<string, string>).jsonData ?? "{}");
    } catch {
      return (payload as Record<string, unknown>).jsonData;
    }
  }
  return payload;
}
