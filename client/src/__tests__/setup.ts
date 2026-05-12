import "@testing-library/jest-dom";
import { afterAll, beforeAll, vi } from "vitest";

// Suppress React act() warnings in test output
const reactTestGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

if (typeof reactTestGlobal.IS_REACT_ACT_ENVIRONMENT === "undefined") {
  reactTestGlobal.IS_REACT_ACT_ENVIRONMENT = true;
}

// Stub browser APIs not available in jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, "scrollTo", { writable: true, value: vi.fn() });

// Silence console.error for expected React warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].includes("Warning:")) return;
    originalError(...args);
  };
});
afterAll(() => { console.error = originalError; });
