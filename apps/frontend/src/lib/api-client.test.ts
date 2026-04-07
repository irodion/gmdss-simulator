import { describe, expect, test, vi, beforeEach } from "vite-plus/test";
import { apiFetch, ApiError } from "./api-client.ts";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("apiFetch", () => {
  test("makes a GET request with credentials", async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ data: "test" }) };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const result = await apiFetch("/api/test");
    expect(result).toEqual({ data: "test" });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/test"),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  test("throws ApiError on non-ok response", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({ error: "Not found" }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    try {
      await apiFetch("/api/missing");
      expect.unreachable("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(404);
    }
  });

  test("sends POST with JSON body", async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ success: true }) };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    await apiFetch("/api/submit", {
      method: "POST",
      body: JSON.stringify({ answer: "b" }),
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/submit"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ answer: "b" }),
      }),
    );
  });
});
