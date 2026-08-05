import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "../src/lib/serialize-json-ld";

describe("serializeJsonLd", () => {
  it("neutralizes characters that can escape or alter a script element", () => {
    const serialized = serializeJsonLd({
      content: "</script><script>alert('injected')</script>&\u2028\u2029"
    });

    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain(">");
    expect(serialized).not.toContain("&");
    expect(serialized).toContain("\\u003c/script\\u003e");
    expect(JSON.parse(serialized)).toEqual({
      content: "</script><script>alert('injected')</script>&\u2028\u2029"
    });
  });
});
