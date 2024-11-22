import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  query,
  queryAll,
  nextTick,
  isPromise,
  runAsPromise,
  forceReflow,
  getContextualAttr,
} from "./index";

// Mocking the document and requestAnimationFrame for Node.js environment
const mockElement = {
  closest: vi.fn(),
  getBoundingClientRect: vi.fn(),
  hasAttribute: vi.fn(),
  getAttribute: vi.fn(),
} as unknown as HTMLElement;

const mockDocument = {
  body: {
    innerHTML: "",
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
    getBoundingClientRect: vi.fn(),
  },
  createElement: vi.fn(() => mockElement),
  getElementById: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
};

global.document = mockDocument as unknown as Document;
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("query", () => {
  it("should return the first matching element", () => {
    (document.querySelector as vi.Mock).mockReturnValue(mockElement);
    const element = query(".test");
    expect(document.querySelector).toHaveBeenCalledWith(".test");
    expect(element).toBe(mockElement);
  });

  it("should return null if no element matches", () => {
    (document.querySelector as vi.Mock).mockReturnValue(null);
    const element = query(".nonexistent");
    expect(document.querySelector).toHaveBeenCalledWith(".nonexistent");
    expect(element).toBeNull();
  });
});

describe("queryAll", () => {
  it("should return all matching elements", () => {
    const mockElements = [{} as HTMLElement, {} as HTMLElement];
    (document.querySelectorAll as vi.Mock).mockReturnValue(mockElements);
    const elements = queryAll(".test");
    expect(document.querySelectorAll).toHaveBeenCalledWith(".test");
    expect(elements).toEqual(mockElements);
  });

  it("should return an empty array if no elements match", () => {
    (document.querySelectorAll as vi.Mock).mockReturnValue([]);
    const elements = queryAll(".nonexistent");
    expect(document.querySelectorAll).toHaveBeenCalledWith(".nonexistent");
    expect(elements).toHaveLength(0);
  });
});

describe("nextTick", () => {
  it("should resolve after the next event loop", async () => {
    const mockFn = vi.fn();
    await nextTick().then(mockFn);
    expect(mockFn).toHaveBeenCalled();
  });
});

describe("isPromise", () => {
  it("should return true for Promise objects", () => {
    const promise = new Promise((resolve) => resolve());
    expect(isPromise(promise)).toBe(true);
  });

  it("should return true for Thenable objects", () => {
    const thenable = { then: () => {} };
    expect(isPromise(thenable)).toBe(true);
  });

  it("should return false for non-Promise objects", () => {
    expect(isPromise({})).toBe(false);
    expect(isPromise(null)).toBe(false);
    expect(isPromise(undefined)).toBe(false);
    expect(isPromise(123)).toBe(false);
    expect(isPromise("string")).toBe(false);
  });
});

describe("runAsPromise", () => {
  it("should resolve with the result of a synchronous function", async () => {
    const syncFn = () => 42;
    await expect(runAsPromise(syncFn)).resolves.toBe(42);
  });

  it("should resolve with the result of an asynchronous function", async () => {
    const asyncFn = () => Promise.resolve(42);
    await expect(runAsPromise(asyncFn)).resolves.toBe(42);
  });

  it("should reject if the function throws an error", async () => {
    const errorFn = () => {
      throw new Error("Test error");
    };
    await expect(runAsPromise(errorFn)).rejects.toThrow("Test error");
  });

  it("should reject if the async function rejects", async () => {
    const asyncErrorFn = () => Promise.reject(new Error("Async error"));
    await expect(runAsPromise(asyncErrorFn)).rejects.toThrow("Async error");
  });
});

describe("forceReflow", () => {
  it("should force reflow on the given element", () => {
    const element = document.createElement("div");
    const spy = vi.spyOn(element, "getBoundingClientRect");
    forceReflow(element);
    expect(spy).toHaveBeenCalled();
  });

  it("should force reflow on the body if no element is provided", () => {
    const spy = vi.spyOn(document.body, "getBoundingClientRect");
    forceReflow();
    expect(spy).toHaveBeenCalled();
  });
});

describe("getContextualAttr", () => {
  it("should return the attribute value from the closest element", () => {
    (document.getElementById as vi.Mock).mockReturnValue(mockElement);
    vi.spyOn(mockElement, "closest").mockReturnValue(mockElement);
    (mockElement.hasAttribute as vi.Mock).mockReturnValue(true);
    (mockElement.getAttribute as vi.Mock).mockReturnValue("value");
    const child = document.getElementById("child");
    expect(getContextualAttr(child!, "data-test")).toBe("value");
  });

  it("should return true if the attribute is present without a value", () => {
    (document.getElementById as vi.Mock).mockReturnValue(mockElement);
    vi.spyOn(mockElement, "closest").mockReturnValue(mockElement);
    (mockElement.hasAttribute as vi.Mock).mockReturnValue(true);
    (mockElement.getAttribute as vi.Mock).mockReturnValue(null);
    const child = document.getElementById("child");
    expect(getContextualAttr(child!, "data-test")).toBe(true);
  });

  it("should return undefined if no element has the attribute", () => {
    (document.getElementById as vi.Mock).mockReturnValue(mockElement);
    vi.spyOn(mockElement, "closest").mockReturnValue(null);
    const child = document.getElementById("child");
    expect(getContextualAttr(child!, "data-test")).toBeUndefined();
  });
});
