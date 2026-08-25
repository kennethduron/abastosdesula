import { describe, expect, it } from "vitest";

import {
  decidePresentationAutoAccess,
  isPresentationAutoAccessEnabled,
} from "./presentation-auto-access-policy";

describe("presentation auto access policy", () => {
  it("enables access only for the exact private flag value", () => {
    expect(isPresentationAutoAccessEnabled("true")).toBe(true);
    expect(isPresentationAutoAccessEnabled("TRUE")).toBe(false);
    expect(isPresentationAutoAccessEnabled("false")).toBe(false);
    expect(isPresentationAutoAccessEnabled(undefined)).toBe(false);
  });

  it("provisions an active identity without a recognized role", () => {
    expect(
      decidePresentationAutoAccess({
        enabled: true,
        authDisabled: false,
        authRole: undefined,
        profileActive: undefined,
        profileRole: undefined,
      }),
    ).toEqual({ action: "provision", role: "presentation_viewer" });
    expect(
      decidePresentationAutoAccess({
        enabled: true,
        authDisabled: false,
        authRole: "legacy_role",
        profileActive: true,
        profileRole: "legacy_role",
      }),
    ).toEqual({ action: "provision", role: "presentation_viewer" });
  });

  it("never overwrites a disabled profile or a valid privileged profile", () => {
    expect(
      decidePresentationAutoAccess({
        enabled: true,
        authDisabled: false,
        authRole: undefined,
        profileActive: false,
        profileRole: undefined,
      }),
    ).toEqual({ action: "deny", reason: "inactive" });
    expect(
      decidePresentationAutoAccess({
        enabled: true,
        authDisabled: false,
        authRole: undefined,
        profileActive: true,
        profileRole: "institutional_admin",
      }),
    ).toEqual({ action: "deny", reason: "role-conflict" });
  });

  it("refreshes a stale token when Authentication already has a valid role", () => {
    expect(
      decidePresentationAutoAccess({
        enabled: true,
        authDisabled: false,
        authRole: "merchant",
        profileActive: true,
        profileRole: "merchant",
      }),
    ).toEqual({ action: "refresh", role: "merchant" });
  });

  it("never converts a public merchant applicant into a presentation viewer", () => {
    expect(
      decidePresentationAutoAccess({
        enabled: true,
        authDisabled: false,
        authRole: "merchant_applicant",
        profileActive: true,
        profileRole: "merchant_applicant",
      }),
    ).toEqual({ action: "refresh", role: "merchant_applicant" });
  });

  it("denies unrecognized roles when the server flag is off", () => {
    expect(
      decidePresentationAutoAccess({
        enabled: false,
        authDisabled: false,
        authRole: undefined,
        profileActive: undefined,
        profileRole: undefined,
      }),
    ).toEqual({ action: "deny", reason: "disabled" });
  });
});
