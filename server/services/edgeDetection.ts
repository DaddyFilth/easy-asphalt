import { invokeLLM } from "../_core/llm";

/**
 * Use LLM vision to analyze a driveway photo and detect corner points
 * Returns normalized coordinates as percentage of image dimensions
 */
export async function detectDrivewayEdges(photoUrl: string): Promise<{
  corners: Array<{ x: number; y: number }>;
  confidence: number;
  description: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing driveway photos and identifying the boundaries of driveways.
          
When given a driveway photo, you must:
1. Identify the four corners of the driveway (top-left, top-right, bottom-right, bottom-left)
2. Return coordinates as percentages (0-100) of the image width and height
3. Provide a confidence score (0-1) for your detection
4. Describe what you see

Return ONLY valid JSON in this exact format:
{
  "corners": [
    {"x": 10, "y": 15},
    {"x": 90, "y": 20},
    {"x": 85, "y": 95},
    {"x": 15, "y": 90}
  ],
  "confidence": 0.95,
  "description": "Clear rectangular driveway with defined edges"
}`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this driveway photo and detect its corners.",
            },
            {
              type: "image_url",
              image_url: {
                url: photoUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "driveway_corners",
          strict: true,
          schema: {
            type: "object",
            properties: {
              corners: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    x: { type: "number" },
                    y: { type: "number" },
                  },
                  required: ["x", "y"],
                },
                minItems: 4,
                maxItems: 4,
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              description: { type: "string" },
            },
            required: ["corners", "confidence", "description"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      throw new Error("Invalid response from LLM");
    }

    const parsed = JSON.parse(content);
    return {
      corners: parsed.corners,
      confidence: parsed.confidence,
      description: parsed.description,
    };
  } catch (error) {
    console.error("[Edge Detection] Error:", error);
    throw new Error(
      `Failed to detect driveway edges: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Calculate square footage from corner points and image dimensions
 * Uses the Shoelace formula for polygon area calculation
 */
export function calculateSquareFeetFromCorners(
  corners: Array<{ x: number; y: number }>,
  imageWidth: number,
  imageHeight: number,
  pixelsPerFoot: number = 0.1 // Calibration factor - adjust based on real-world reference
): number {
  // Convert percentage coordinates to pixel coordinates
  const pixelCorners = corners.map(corner => ({
    x: (corner.x / 100) * imageWidth,
    y: (corner.y / 100) * imageHeight,
  }));

  // Apply Shoelace formula to calculate area in pixels
  let area = 0;
  for (let i = 0; i < pixelCorners.length; i++) {
    const current = pixelCorners[i];
    const next = pixelCorners[(i + 1) % pixelCorners.length];
    area += current.x * next.y - next.x * current.y;
  }
  area = Math.abs(area) / 2;

  // Convert pixel area to square feet using calibration factor
  const squareFeet = Math.round(area * pixelsPerFoot * pixelsPerFoot);
  return Math.max(squareFeet, 100); // Minimum 100 sq ft to avoid unrealistic values
}
