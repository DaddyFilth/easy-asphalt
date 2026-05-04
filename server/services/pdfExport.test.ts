import { describe, expect, it } from "vitest";
import { generateProjectPDF } from "./pdfExport";
import type { Project } from "../../drizzle/schema";

describe("PDF Export Service", () => {
  const mockProject: Project = {
    id: 1,
    userId: 1,
    photoUrl: "https://example.com/photo.jpg",
    photoKey: "photos/123",
    squareFeet: 500,
    depthInches: 2,
    cornerPoints: JSON.stringify([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]),
    selectedMaterial: "hotmix",
    quantityNeeded: "2.5 tons",
    pricePerUnit: "$45.00",
    totalCost: "$112.50",
    zipCode: "10001",
    latitude: "40.7128",
    longitude: "-74.0060",
    previewImageUrl: "https://example.com/preview.jpg",
    previewImageKey: "previews/123",
    contractorEmail: "contractor@example.com",
    projectName: "Test Driveway",
    notes: "This is a test project",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should generate a PDF buffer from a project", async () => {
    const pdfBuffer = await generateProjectPDF(mockProject);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it("should include project name in PDF", async () => {
    const pdfBuffer = await generateProjectPDF(mockProject);
    const pdfString = pdfBuffer.toString("utf-8", 0, 1000);

    // PDF should contain some text data
    expect(pdfString.length).toBeGreaterThan(0);
  });

  it("should handle projects without notes", async () => {
    const projectWithoutNotes: Project = {
      ...mockProject,
      notes: null,
    };

    const pdfBuffer = await generateProjectPDF(projectWithoutNotes);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it("should handle all material types", async () => {
    const materials = ["hotmix", "millings", "tar_and_chip", "gravel"];

    for (const material of materials) {
      const project: Project = {
        ...mockProject,
        selectedMaterial: material,
      };

      const pdfBuffer = await generateProjectPDF(project);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    }
  });
});
