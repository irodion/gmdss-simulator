import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vite-plus/test";
import "../../../i18n/index.ts";

import { ChannelExplorer } from "./ChannelExplorer.tsx";

vi.mock("../../../lib/api-client.ts", () => ({
  apiFetch: vi.fn(),
  ApiError: class extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

import { apiFetch } from "../../../lib/api-client.ts";

const mockJurisdictions = [
  { id: "international", label: "International (ITU)" },
  { id: "us", label: "United States (FCC)" },
];

const mockDetail = {
  id: "international",
  label: "International (ITU)",
  channelPlan: {
    "16": {
      purpose: "Distress, safety, and calling",
      type: "voice",
      tx_allowed: true,
    },
    "70": {
      purpose: "Digital Selective Calling",
      type: "dsc_only",
      tx_allowed: false,
    },
  },
  callingChannel: 16,
  dscChannel: 70,
  notes: "Standard ITU plan",
};

beforeEach(() => {
  vi.mocked(apiFetch).mockImplementation((path: string) => {
    if (path === "/api/content/jurisdictions") return Promise.resolve(mockJurisdictions);
    if (path.startsWith("/api/content/jurisdictions/")) return Promise.resolve(mockDetail);
    return Promise.reject(new Error("unexpected"));
  });
});

describe("ChannelExplorer", () => {
  test("renders channel table after loading", async () => {
    const { container } = render(<ChannelExplorer />);
    await waitFor(() => {
      expect(container.querySelector(".data-table")).not.toBeNull();
    });
    expect(container.textContent).toContain("Distress, safety, and calling");
    expect(container.textContent).toContain("Digital Selective Calling");
  });

  test("shows jurisdiction selector", async () => {
    render(<ChannelExplorer />);
    await waitFor(() => {
      expect(screen.getByText("Jurisdiction")).toBeDefined();
    });
  });

  test("filters by channel type", async () => {
    const { container } = render(<ChannelExplorer />);
    await waitFor(() => {
      expect(container.textContent).toContain("Distress");
    });

    const typeSelect = container.querySelectorAll(".form-select")[1]!;
    fireEvent.change(typeSelect, { target: { value: "dsc_only" } });

    expect(container.textContent).toContain("Digital Selective Calling");
    expect(container.textContent).not.toContain("Distress, safety, and calling");
  });

  test("shows notes when available", async () => {
    const { container } = render(<ChannelExplorer />);
    await waitFor(() => {
      expect(container.textContent).toContain("Standard ITU plan");
    });
  });

  test("handles null notes without crashing", async () => {
    vi.mocked(apiFetch).mockImplementation((path: string) => {
      if (path === "/api/content/jurisdictions") return Promise.resolve(mockJurisdictions);
      return Promise.resolve({ ...mockDetail, notes: null });
    });
    const { container } = render(<ChannelExplorer />);
    await waitFor(() => {
      expect(container.querySelector(".data-table")).not.toBeNull();
    });
    expect(container.textContent).not.toContain("Standard ITU plan");
  });

  test("sorts alphanumeric channel keys correctly", async () => {
    vi.mocked(apiFetch).mockImplementation((path: string) => {
      if (path === "/api/content/jurisdictions") return Promise.resolve(mockJurisdictions);
      return Promise.resolve({
        ...mockDetail,
        channelPlan: {
          "22A": { purpose: "Coast Guard simplex", type: "voice", tx_allowed: true },
          "9": { purpose: "Calling", type: "voice", tx_allowed: true },
          "16": { purpose: "Distress", type: "voice", tx_allowed: true },
        },
      });
    });
    const { container } = render(<ChannelExplorer />);
    await waitFor(() => {
      expect(container.querySelector(".data-table")).not.toBeNull();
    });
    const cells = container.querySelectorAll("td:first-child");
    const order = [...cells].map((td) => td.textContent);
    expect(order).toEqual(["Ch. 9", "Ch. 16", "Ch. 22A"]);
  });
});
