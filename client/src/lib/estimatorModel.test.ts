import { describe, expect, it } from "vitest";

import {
  buildPolygonClipPath,
  createInitialEstimatorState,
  formatUsd,
  getLiveOverlayStyle,
  parseCurrency,
} from "./estimatorModel";

describe("estimatorModel", () => {
  it("creates a clean initial estimator state", () => {
    const state = createInitialEstimatorState();

    expect(state.photoUrl).toBeNull();
    expect(state.corners).toEqual([]);
    expect(state.depthInches).toBe(2);
    expect(state.projectName).toBe("");
  });

  it("formats and parses currency values", () => {
    expect(formatUsd(1234.5)).toBe("$1,234.50");
    expect(parseCurrency("$1,234.50")).toBe(1234.5);
  });

  it("builds a fallback polygon when corners are missing", () => {
    expect(buildPolygonClipPath([])).toBe(
      "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
    );
  });

  it("builds polygon clip paths from driveway corners", () => {
    expect(
      buildPolygonClipPath([
        { x: 10, y: 15 },
        { x: 90, y: 15 },
        { x: 75, y: 80 },
      ])
    ).toBe("polygon(10% 15%, 90% 15%, 75% 80%)");
  });

  it("returns live overlay styles for selected material", () => {
    const style = getLiveOverlayStyle("gravel");

    expect(style.backgroundColor).toContain("rgba");
    expect(style.backgroundBlendMode).toBe("normal, screen, multiply");
  });
});
