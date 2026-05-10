import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock routing and auth so the component renders in isolation
vi.mock("wouter", () => ({
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
  useLocation: () => ["/", vi.fn()],
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, isAuthenticated: false }),
}));

vi.mock("@/const", () => ({
  getLoginUrl: () => "/auth/login",
}));

import Home from "../pages/Home";

describe("Home landing page", () => {
  it("renders without crashing", () => {
    const { container } = render(<Home />);
    expect(container).toBeTruthy();
  });

  it("shows brand name", () => {
    render(<Home />);
    expect(screen.getByText(/driveWayAI|driveway/i)).toBeTruthy();
  });

  it("shows sign in CTA for unauthenticated users", () => {
    render(<Home />);
    const ctaLinks = screen.getAllByRole("link");
    const hasSignIn = ctaLinks.some(el =>
      el.textContent?.toLowerCase().includes("sign in") ||
      el.textContent?.toLowerCase().includes("get started")
    );
    expect(hasSignIn).toBe(true);
  });

  it("links to auth login URL", () => {
    render(<Home />);
    const links = screen.getAllByRole("link");
    const hasAuthLink = links.some(el => el.getAttribute("href") === "/auth/login");
    expect(hasAuthLink).toBe(true);
  });

  it("shows the four step titles", () => {
    render(<Home />);
    ["Capture", "Detect", "Price", "Share"].forEach(step => {
      expect(screen.getByText(step)).toBeTruthy();
    });
  });

  it("shows all four material names", () => {
    render(<Home />);
    ["Hot Mix Asphalt", "Asphalt Millings", "Tar & Chip", "Gravel"].forEach(m => {
      expect(screen.getByText(m)).toBeTruthy();
    });
  });
});

describe("Home landing page (authenticated)", () => {
  beforeEach(() => {
    vi.mocked(require("@/_core/hooks/useAuth").useAuth).mockReturnValue({
      user: { id: "u1", name: "Mike", email: "mike@test.com" },
      isAuthenticated: true,
    });
  });

  it("shows dashboard and new estimate links when logged in", () => {
    render(<Home />);
    const links = screen.getAllByRole("link");
    const texts = links.map(l => l.textContent?.toLowerCase());
    expect(texts.some(t => t?.includes("dashboard"))).toBe(true);
    expect(texts.some(t => t?.includes("estimate"))).toBe(true);
  });
});
