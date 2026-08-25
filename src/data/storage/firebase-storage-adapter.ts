import "client-only";

import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

import { getFirebaseApp } from "@/data/adapters/firebase/app-client";
import type { MerchantImageStorage } from "@/data/storage/contracts";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maximumBytes = 5 * 1024 * 1024;

function safeSegment(value: string) {
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(value)) {
    throw new Error("Identificador de almacenamiento inválido.");
  }
  return value;
}

export class FirebaseMerchantImageStorage implements MerchantImageStorage {
  async upload({
    businessId,
    kind,
    file,
  }: Parameters<MerchantImageStorage["upload"]>[0]) {
    if (!allowedTypes.has(file.type))
      throw new Error("Usa una imagen JPG, PNG o WebP.");
    if (file.size <= 0 || file.size > maximumBytes)
      throw new Error("La imagen debe pesar menos de 5 MB.");
    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
    const filename = `${crypto.randomUUID()}.${extension}`;
    const path = `businesses/${safeSegment(businessId)}/${kind}/${filename}`;
    const reference = ref(getStorage(getFirebaseApp()), path);
    await uploadBytes(reference, file, {
      contentType: file.type,
      cacheControl: "public,max-age=31536000,immutable",
      customMetadata: { businessId, kind },
    });
    return { path, url: await getDownloadURL(reference) };
  }
}
