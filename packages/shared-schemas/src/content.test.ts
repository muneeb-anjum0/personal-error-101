import { describe, expect, it } from "vitest";
import { linkSchema } from "./content.js";

describe("public content links", () => {
  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd"
  ])("rejects the unsafe URL scheme in %s", (url) => {
    expect(linkSchema.safeParse({ label: "Unsafe", url }).success).toBe(false);
  });

  it.each(["https://example.com/project", "http://localhost:3000/project"])(
    "accepts a web URL such as %s",
    (url) => {
      expect(linkSchema.safeParse({ label: "Project", url }).success).toBe(true);
    }
  );
});
