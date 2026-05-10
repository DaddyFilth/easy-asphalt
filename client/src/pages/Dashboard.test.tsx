import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

const dashboardState = vi.hoisted(() => ({
  data: [] as Array<Record<string, unknown>> | undefined,
  isLoading: false,
}));

const mutationState = vi.hoisted(() => ({
  deleteMutate: vi.fn(),
  shareMutate: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      role: "user",
    },
  }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    projects: {
      list: {
        useQuery: () => ({
          data: dashboardState.data,
          isLoading: dashboardState.isLoading,
          refetch: vi.fn(),
        }),
      },
      delete: {
        useMutation: () => ({
          mutate: mutationState.deleteMutate,
          isPending: false,
        }),
      },
      createShareLink: {
        useMutation: () => ({
          mutate: mutationState.shareMutate,
          isPending: false,
        }),
      },
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("wouter", async () => {
  const ReactModule = await import("react");

  return {
    Link: ({ href, children }: { href: string; children?: React.ReactNode }) =>
      ReactModule.createElement("a", { href }, children),
  };
});

function renderDashboard() {
  return renderToStaticMarkup(React.createElement(Dashboard));
}

describe("Dashboard", () => {
  beforeEach(() => {
    dashboardState.data = [];
    dashboardState.isLoading = false;
    mutationState.deleteMutate.mockReset();
    mutationState.shareMutate.mockReset();
  });

  it("renders the dashboard header and empty project state", () => {
    const html = renderDashboard();

    expect(html).toContain("My Projects");
    expect(html).toContain("New Estimate");
    expect(html).toContain("No projects yet. Create your first driveway estimate!");
    expect(html).toContain("Start Estimating");
    expect(html).toContain('href="/estimator"');
  });

  it("renders project details when projects are available", () => {
    dashboardState.data = [
      {
        id: 42,
        projectName: "Oak Ridge Driveway",
        createdAt: new Date("2026-05-10T12:00:00.000Z"),
        previewImageUrl: "/preview.jpg",
        photoUrl: "/photo.jpg",
        squareFeet: 1200,
        selectedMaterial: "hotmix",
        totalCost: "$3,200.00",
      },
    ];

    const html = renderDashboard();

    expect(html).toContain("Oak Ridge Driveway");
    expect(html).toContain("1200 sq ft");
    expect(html).toContain("Hot Mix Asphalt");
    expect(html).toContain("$3,200.00");
    expect(html).toContain('href="/project/42"');
    expect(html).toContain('alt="Oak Ridge Driveway"');
  });
});
