import { describe, expect, it } from "vitest";
import { z } from "zod";
import { dateTimeField, optionalDateTimeField } from "./validation";

describe("validation schema timezone tests", () => {
  const schema = z.object({
    start: dateTimeField("Vui lòng chọn thời gian bắt đầu."),
    deadline: optionalDateTimeField(),
  });

  it("parses valid datetime-local string to Date with Vietnam timezone", () => {
    const parsed = schema.parse({
      start: "2026-10-17T07:00",
      deadline: "2026-10-17T09:30",
    });

    expect(parsed.start).toBeInstanceOf(Date);
    expect(parsed.start.toISOString()).toBe("2026-10-17T00:00:00.000Z");

    expect(parsed.deadline).toBeInstanceOf(Date);
    expect(parsed.deadline?.toISOString()).toBe("2026-10-17T02:30:00.000Z");
  });

  it("handles null or empty optionalDateTimeField", () => {
    const parsed1 = schema.parse({
      start: "2026-10-17T07:00",
      deadline: null,
    });
    expect(parsed1.deadline).toBeNull();

    const parsed2 = schema.parse({
      start: "2026-10-17T07:00",
      deadline: "",
    });
    expect(parsed2.deadline).toBeNull();
  });

  it("rejects invalid date string", () => {
    expect(() =>
      schema.parse({
        start: "invalid-date",
        deadline: null,
      }),
    ).toThrow();
  });
});
