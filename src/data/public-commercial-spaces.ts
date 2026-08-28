import "server-only";

import type { CommercialSpace } from "@/domain";
import { presentationCommercialSpaces } from "@/data/commercial-spaces";
import { isFirebaseAdminConfigured } from "@/data/adapters/firebase/admin-config";

function dateValue(value: unknown, fallback: string) {
  if (value && typeof value === "object" && "toDate" in value) {
    const date = (value as { toDate(): Date }).toDate();
    return date.toISOString();
  }
  return typeof value === "string" ? value : fallback;
}

function mergeSpace(
  base: CommercialSpace | undefined,
  id: string,
  data: FirebaseFirestore.DocumentData,
): CommercialSpace | null {
  if (!base && (!Array.isArray(data.images) || typeof data.slug !== "string"))
    return null;
  const fallback = base ?? presentationCommercialSpaces[0];
  return {
    ...fallback,
    ...data,
    id,
    images: Array.isArray(data.images) ? data.images : fallback.images,
    coverImage: data.coverImage ?? fallback.coverImage,
    createdAt: dateValue(data.createdAt, fallback.createdAt),
    updatedAt: dateValue(data.updatedAt, fallback.updatedAt),
  } as CommercialSpace;
}

export async function getPublicCommercialSpaces() {
  if (!isFirebaseAdminConfigured()) return presentationCommercialSpaces;
  try {
    const { getFirebaseAdminDb } =
      await import("@/data/adapters/firebase/admin");
    const snapshot = await getFirebaseAdminDb()
      .collection("commercialSpaces")
      .limit(100)
      .get();
    const overrides = new Map(snapshot.docs.map((doc) => [doc.id, doc.data()]));
    const controlled = presentationCommercialSpaces
      .map((space) => {
        const data = overrides.get(space.id);
        return data ? mergeSpace(space, space.id, data) : space;
      })
      .filter((space): space is CommercialSpace => Boolean(space?.published));
    const additions = snapshot.docs
      .filter(
        (doc) =>
          !presentationCommercialSpaces.some((space) => space.id === doc.id),
      )
      .map((doc) => mergeSpace(undefined, doc.id, doc.data()))
      .filter((space): space is CommercialSpace => Boolean(space?.published));
    return [...controlled, ...additions];
  } catch {
    return presentationCommercialSpaces;
  }
}

export async function getPublicCommercialSpace(idOrSlug: string) {
  return (await getPublicCommercialSpaces()).find(
    (space) => space.id === idOrSlug || space.slug === idOrSlug,
  );
}
