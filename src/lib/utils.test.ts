import { describe, expect, it } from "vitest";
import { parseZonedTime, toDateTimeLocalValue, TIME_ZONE } from "./utils";

describe("timezone utils", () => {
  it("TIME_ZONE defaults to Asia/Ho_Chi_Minh", () => {
    expect(TIME_ZONE).toBe("Asia/Ho_Chi_Minh");
  });

  it("parseZonedTime correctly parses YYYY-MM-DDTHH:mm into UTC with +07:00 offset", () => {
    // 07:00 in Vietnam (+07:00) should be 00:00:00.000Z in UTC
    const date = parseZonedTime("2026-10-17T07:00");
    expect(date.toISOString()).toBe("2026-10-17T00:00:00.000Z");
  });

  it("parseZonedTime handles string with seconds", () => {
    // 14:30:15 in Vietnam (+07:00) should be 07:30:15.000Z in UTC
    const date = parseZonedTime("2026-10-17T14:30:15");
    expect(date.toISOString()).toBe("2026-10-17T07:30:15.000Z");
  });

  it("toDateTimeLocalValue formats UTC date back to Vietnam YYYY-MM-DDTHH:mm", () => {
    const utcDate = new Date("2026-10-17T00:00:00.000Z");
    const localStr = toDateTimeLocalValue(utcDate);
    expect(localStr).toBe("2026-10-17T07:00");
  });

  it("round-trips correctly between parseZonedTime and toDateTimeLocalValue", () => {
    const originalInput = "2026-11-20T19:45";
    const parsed = parseZonedTime(originalInput);
    const formatted = toDateTimeLocalValue(parsed);
    expect(formatted).toBe(originalInput);
  });
});
