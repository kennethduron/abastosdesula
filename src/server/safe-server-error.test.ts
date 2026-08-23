import { afterEach, describe, expect, it } from "vitest";

import { getSanitizedServerError } from "./safe-server-error";

const originalEmail = process.env.FIREBASE_CLIENT_EMAIL;
const originalPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

afterEach(() => {
  process.env.FIREBASE_CLIENT_EMAIL = originalEmail;
  process.env.FIREBASE_PRIVATE_KEY = originalPrivateKey;
});

describe("getSanitizedServerError", () => {
  it("preserves diagnostics while redacting credential values", () => {
    process.env.FIREBASE_CLIENT_EMAIL = "service@example.invalid";
    process.env.FIREBASE_PRIVATE_KEY =
      "-----BEGIN PRIVATE KEY-----secret-----END PRIVATE KEY-----";
    const error = Object.assign(
      new Error(
        `Credential service@example.invalid rejected -----BEGIN PRIVATE KEY-----secret-----END PRIVATE KEY-----`,
      ),
      { code: "app/invalid-credential" },
    );

    const result = getSanitizedServerError(error, "credential-cert");

    expect(result.stage).toBe("credential-cert");
    expect(result.code).toBe("app/invalid-credential");
    expect(result.message).not.toContain("service@example.invalid");
    expect(result.message).not.toContain("secret");
    expect(result.message).toContain("[REDACTED]");
  });
});
