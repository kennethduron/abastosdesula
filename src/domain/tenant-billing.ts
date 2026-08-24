import type { DemoEntity, EntityId, IsoDateTime } from "@/domain/shared";

export type TenantLeaseStatus = "active" | "pending" | "inactive";
export type TenantAccountStatus = "current" | "pending" | "overdue";
export type TenantPaymentStatus = "paid" | "pending" | "overdue" | "partial";

export interface TenantAccount extends DemoEntity {
  businessId: EntityId;
  businessName: string;
  responsibleName: string;
  stallLabel?: string;
  categoryName: string;
  leaseStatus: TenantLeaseStatus;
  nextDueDate: IsoDateTime;
  monthlyAmountMinor: number;
  outstandingBalanceMinor: number;
  accountStatus: TenantAccountStatus;
}

export interface TenantPayment extends DemoEntity {
  businessId: EntityId;
  period: string;
  dueDate: IsoDateTime;
  concept: string;
  amountMinor: number;
  paidAmountMinor: number;
  status: TenantPaymentStatus;
  paidAt?: IsoDateTime;
  reference?: string;
}
