export type EntityId = string;
export type IsoDateTime = string;

export interface DemoEntity {
  id: EntityId;
  isDemo: true;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface PageRequest {
  page: number;
  pageSize: number;
}

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Money {
  amountMinor: number;
  currency: "HNL";
}
