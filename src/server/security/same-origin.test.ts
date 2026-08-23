import { describe, expect, it } from "vitest";

import { hasTrustedSameOrigin } from "./same-origin";

describe("hasTrustedSameOrigin", () => {
  it("accepts a matching browser origin", () => {
    const request = new Request(
      "https://abastosdesula.vercel.app/api/session",
      {
        headers: { origin: "https://abastosdesula.vercel.app" },
      },
    );
    expect(hasTrustedSameOrigin(request)).toBe(true);
  });

  it("uses trusted proxy host and protocol", () => {
    const request = new Request("http://internal:3000/api/session", {
      headers: {
        origin: "https://demo.example.com",
        "x-forwarded-host": "demo.example.com",
        "x-forwarded-proto": "https",
      },
    });
    expect(hasTrustedSameOrigin(request)).toBe(true);
  });

  it("rejects missing, cross-site or downgraded origins", () => {
    expect(
      hasTrustedSameOrigin(new Request("https://demo.example.com/api/session")),
    ).toBe(false);
    expect(
      hasTrustedSameOrigin(
        new Request("https://demo.example.com/api/session", {
          headers: { origin: "https://attacker.example" },
        }),
      ),
    ).toBe(false);
    expect(
      hasTrustedSameOrigin(
        new Request("https://demo.example.com/api/session", {
          headers: { origin: "http://demo.example.com" },
        }),
      ),
    ).toBe(false);
  });
});
