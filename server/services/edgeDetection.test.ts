import { describe, it, expect } from "vitest";
import { calculateSquareFeetFromCorners } from "./edgeDetection";

describe("Edge Detection Service", () => {
  describe("calculateSquareFeetFromCorners", () => {
    it("should calculate area for a rectangle", () => {
      const corners = [
        { x: 10, y: 10 },
        { x: 90, y: 10 },
        { x: 90, y: 90 },
        { x: 10, y: 90 },
      ];
      const imageWidth = 1000;
      const imageHeight = 1000;
      const pixelsPerFoot = 0.1;

      const squareFeet = calculateSquareFeetFromCorners(
        corners,
        imageWidth,
        imageHeight,
        pixelsPerFoot
      );
      expect(squareFeet).toBeGreaterThan(0);
      expect(squareFeet).toBeLessThanOrEqual(10000); // Reasonable upper bound
    });

    it("should return minimum 100 sq ft", () => {
      // Very small corners
      const corners = [
        { x: 40, y: 40 },
        { x: 60, y: 40 },
        { x: 60, y: 60 },
        { x: 40, y: 60 },
      ];
      const imageWidth = 1000;
      const imageHeight = 1000;
      const pixelsPerFoot = 0.01; // Very small calibration

      const squareFeet = calculateSquareFeetFromCorners(
        corners,
        imageWidth,
        imageHeight,
        pixelsPerFoot
      );
      expect(squareFeet).toBeGreaterThanOrEqual(100);
    });

    it("should handle different image dimensions", () => {
      const corners = [
        { x: 10, y: 10 },
        { x: 90, y: 10 },
        { x: 90, y: 90 },
        { x: 10, y: 90 },
      ];

      const result1 = calculateSquareFeetFromCorners(corners, 1000, 1000, 0.1);
      const result2 = calculateSquareFeetFromCorners(corners, 2000, 2000, 0.1);

      // Larger image should give larger area
      expect(result2).toBeGreaterThan(result1);
    });

    it("should handle different calibration factors", () => {
      const corners = [
        { x: 10, y: 10 },
        { x: 90, y: 10 },
        { x: 90, y: 90 },
        { x: 10, y: 90 },
      ];
      const imageWidth = 1000;
      const imageHeight = 1000;

      const result1 = calculateSquareFeetFromCorners(
        corners,
        imageWidth,
        imageHeight,
        0.05
      );
      const result2 = calculateSquareFeetFromCorners(
        corners,
        imageWidth,
        imageHeight,
        0.1
      );

      // Higher calibration factor should give larger area
      expect(result2).toBeGreaterThan(result1);
    });

    it("should handle non-rectangular shapes", () => {
      // Trapezoid shape
      const corners = [
        { x: 20, y: 10 },
        { x: 80, y: 10 },
        { x: 90, y: 90 },
        { x: 10, y: 90 },
      ];
      const imageWidth = 1000;
      const imageHeight = 1000;

      const squareFeet = calculateSquareFeetFromCorners(
        corners,
        imageWidth,
        imageHeight,
        0.1
      );
      expect(squareFeet).toBeGreaterThan(0);
      expect(squareFeet).toBeLessThanOrEqual(10000);
    });
  });
});
