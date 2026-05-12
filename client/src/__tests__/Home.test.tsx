import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  value: { user: null as unknown, isAuthenticated: false },
}));

vi.mock("/home/filth/easy-asphalt/client/src/_core/hooks/useAuth.ts", () => ({
  useAuth: () => authState.value,
}));

import Home from "../pages/Home";

function renderHome() {
  return renderToStaticMarkup(React.createElement(Home));
}

describe("Home landing page", () => {
  beforeEach(() => {
    authState.value = { user: null, isAuthenticated: false };
  });

  it("renders without crashing", () => {
    expect(renderHome()).toBeTruthy();
  });

  it("shows brand name", () => {
    expect(renderHome()).toMatch(/driveway/i);
  });

  it("shows sign in CTA for unauthenticated users", () => {
    expect(renderHome().toLowerCase()).toMatch(/sign in|get started/);
  });

  it("links landing CTAs to the login page", () => {
    expect(renderHome()).toContain('href="/login?returnTo=%2Festimator"');
  });

  it("shows the four step titles", () => {
    const html = renderHome();
    ["Capture", "Detect", "Price", "Share"].forEach(step => {
      expect(html).toContain(step);
    });
  });

  it("shows all four material names", () => {
    const html = renderHome();
    expect(html).toContain("Hot Mix Asphalt");
    expect(html).toContain("Asphalt Millings");
    expect(html).toMatch(/Tar (&amp;|&) Chip/);
    expect(html).toContain("Gravel");
  });
});

describe("Home landing page (authenticated)", () => {
  beforeEach(() => {
    authState.value = {
      user: { id: "u1", name: "Mike", email: "mike@test.com" },
      isAuthenticated: true,
    };
  });

  it("shows dashboard and new estimate links when logged in", () => {
    const html = renderHome().toLowerCase();
    expect(html).toContain("dashboard");
    expect(html).toContain("estimate");
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/estimator"');
  });
});
