import "server-only";

import type { Auth, DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, type Firestore } from "firebase-admin/firestore";

import { isUserRole } from "@/domain";

import {
  decidePresentationAutoAccess,
  isPresentationAutoAccessEnabled,
} from "./presentation-auto-access-policy";

export type PresentationAutoAccessResult =
  { status: "denied" } | { status: "refresh-required" };

export async function resolvePresentationAutoAccess({
  auth,
  db,
  decoded,
}: {
  auth: Auth;
  db: Firestore;
  decoded: DecodedIdToken;
}): Promise<PresentationAutoAccessResult> {
  if (!isPresentationAutoAccessEnabled(process.env.PRESENTATION_AUTO_ACCESS)) {
    return { status: "denied" };
  }

  const authUser = await auth.getUser(decoded.uid);
  const userReference = db.collection("users").doc(decoded.uid);
  const userSnapshot = await userReference.get();
  const profile = userSnapshot.data();
  const authRole = authUser.customClaims?.role;
  const decision = decidePresentationAutoAccess({
    enabled: true,
    authDisabled: authUser.disabled,
    authRole,
    profileActive: profile?.active,
    profileRole: profile?.role,
  });

  if (decision.action === "deny") return { status: "denied" };
  if (
    decision.action === "refresh" &&
    decision.role !== "presentation_viewer"
  ) {
    return { status: "refresh-required" };
  }

  const email = authUser.email ?? decoded.email;
  if (typeof email !== "string" || email.length === 0) {
    return { status: "denied" };
  }

  const synchronized = await db.runTransaction(async (transaction) => {
    const latestSnapshot = await transaction.get(userReference);
    const latestProfile = latestSnapshot.data();
    const latestDecision = decidePresentationAutoAccess({
      enabled: true,
      authDisabled: authUser.disabled,
      authRole,
      profileActive: latestProfile?.active,
      profileRole: latestProfile?.role,
    });
    if (latestDecision.action === "deny") {
      return false;
    }

    transaction.set(
      userReference,
      {
        uid: decoded.uid,
        email: email.toLowerCase(),
        role: "presentation_viewer",
        active: true,
        ...(!latestProfile?.createdAt
          ? { createdAt: FieldValue.serverTimestamp() }
          : {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  });
  if (!synchronized) return { status: "denied" };

  if (!isUserRole(authRole)) {
    const {
      role: _role,
      businessId: _businessId,
      ...otherClaims
    } = authUser.customClaims ?? {};
    void _role;
    void _businessId;
    await auth.setCustomUserClaims(decoded.uid, {
      ...otherClaims,
      role: "presentation_viewer",
    });
  }

  return { status: "refresh-required" };
}
