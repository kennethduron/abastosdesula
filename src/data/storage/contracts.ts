export type MerchantImageKind = "logo" | "cover" | "product";

export interface MerchantImageUpload {
  businessId: string;
  kind: MerchantImageKind;
  file: File;
}

export interface MerchantImageResult {
  url: string;
  path: string;
}

export interface MerchantImageStorage {
  upload(input: MerchantImageUpload): Promise<MerchantImageResult>;
}
