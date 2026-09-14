import { describe, expect, it } from "bun:test";
import { formatElapsedTime } from "../../src/client/presenter/timer";

describe("Presenter timer", () => {
  it("formats elapsed time below one hour as minutes and seconds", () => {
    expect(formatElapsedTime(0)).toBe("00:00");
    expect(formatElapsedTime(65_000)).toBe("01:05");
    expect(formatElapsedTime(3_599_000)).toBe("59:59");
  });

  it("includes hours after the first hour", () => {
    expect(formatElapsedTime(3_661_000)).toBe("01:01:01");
  });

  it("clamps negative and non-finite durations to zero", () => {
    expect(formatElapsedTime(-1)).toBe("00:00");
    expect(formatElapsedTime(Number.NaN)).toBe("00:00");
    expect(formatElapsedTime(Number.POSITIVE_INFINITY)).toBe("00:00");
  });
});
