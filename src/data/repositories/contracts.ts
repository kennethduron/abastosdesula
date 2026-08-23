import type {
  Activity,
  Business,
  Cart,
  Category,
  Customer,
  EntityId,
  Merchant,
  MerchantUser,
  Notification,
  PageResult,
  Product,
  ProductQuery,
  Promotion,
  PublicQuoteRequestInput,
  QuoteRequest,
  QuoteRequestStatus,
  User,
} from "@/domain";

export interface BusinessRepository {
  list(): Promise<Business[]>;
  getById(id: EntityId): Promise<Business | null>;
}

export interface MerchantQuery {
  search?: string;
  categoryId?: EntityId;
  status?: Merchant["status"];
}

export interface MerchantRepository {
  list(query?: MerchantQuery): Promise<Merchant[]>;
  getBySlug(slug: string): Promise<Merchant | null>;
  getByBusinessId(businessId: EntityId): Promise<Merchant | null>;
}

export interface CategoryRepository {
  list(): Promise<Category[]>;
  getBySlug(slug: string): Promise<Category | null>;
}

export interface ProductRepository {
  list(query?: ProductQuery): Promise<PageResult<Product>>;
  getById(id: EntityId): Promise<Product | null>;
  getBySlug(businessId: EntityId, slug: string): Promise<Product | null>;
}

export interface CustomerRepository {
  listByBusiness(businessId: EntityId): Promise<Customer[]>;
  getById(businessId: EntityId, id: EntityId): Promise<Customer | null>;
  save(customer: Customer): Promise<Customer>;
}

export interface QuoteRequestQuery {
  status?: QuoteRequestStatus;
  search?: string;
}

export interface QuoteRequestRepository {
  create(input: PublicQuoteRequestInput): Promise<QuoteRequest>;
  listByBusiness(
    businessId: EntityId,
    query?: QuoteRequestQuery,
  ): Promise<QuoteRequest[]>;
  getById(businessId: EntityId, id: EntityId): Promise<QuoteRequest | null>;
  updateStatus(
    businessId: EntityId,
    id: EntityId,
    status: QuoteRequestStatus,
    actorUserId?: EntityId,
  ): Promise<QuoteRequest>;
}

export interface CartRepository {
  get(): Promise<Cart>;
  save(cart: Cart): Promise<Cart>;
  clear(): Promise<Cart>;
}

export interface UserRepository {
  getById(id: EntityId): Promise<User | null>;
  getMerchantMembership(userId: EntityId): Promise<MerchantUser | null>;
}

export interface NotificationRepository {
  listByBusiness(businessId: EntityId): Promise<Notification[]>;
  save(notification: Notification): Promise<Notification>;
}

export interface ActivityRepository {
  listByBusiness(businessId: EntityId): Promise<Activity[]>;
  save(activity: Activity): Promise<Activity>;
}

export interface PromotionRepository {
  listByBusiness(businessId: EntityId): Promise<Promotion[]>;
}

export interface CommerceRepositories {
  businesses: BusinessRepository;
  merchants: MerchantRepository;
  categories: CategoryRepository;
  products: ProductRepository;
  customers: CustomerRepository;
  quoteRequests: QuoteRequestRepository;
  cart: CartRepository;
  users: UserRepository;
  notifications: NotificationRepository;
  activities: ActivityRepository;
  promotions: PromotionRepository;
}
