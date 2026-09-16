import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { trackProductEvent } from "./productAnalytics";

const { trackMock } = vi.hoisted(() => ({
  trackMock: vi.fn(),
}));

vi.mock("@vercel/analytics", () => ({
  track: trackMock,
}));

describe("product analytics", () => {
  beforeEach(() => {
    trackMock.mockReset();
  });

  it("forwards an approved event and its bounded source", async () => {
    trackProductEvent({ name: "signup_start", source: "profile_control" });

    await waitFor(() =>
      expect(trackMock).toHaveBeenCalledWith("signup_start", {
        source: "profile_control",
      }),
    );
  });

  it("does not let blocked analytics break the product action", () => {
    trackMock.mockImplementation(() => {
      throw new Error("Analytics blocked");
    });

    expect(() =>
      trackProductEvent({ name: "timer_start", source: "primary_timer_control" }),
    ).not.toThrow();
  });
});
