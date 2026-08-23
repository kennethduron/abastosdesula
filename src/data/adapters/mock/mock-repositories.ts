import {
  publicQuoteRequestSchema,
  type Activity,
  type Cart,
  type Customer,
  type EntityId,
  type MerchantUser,
  type Notification,
  type Promotion,
  type PublicQuoteRequestInput,
  type QuoteRequest,
  type QuoteRequestStatus,
  type User,
} from "@/domain";
import type {
  ActivityRepository,
  BusinessRepository,
  CartRepository,
  CategoryRepository,
  CommerceRepositories,
  CustomerRepository,
  MerchantQuery,
  MerchantRepository,
  NotificationRepository,
  ProductRepository,
  PromotionRepository,
  QuoteRequestQuery,
  QuoteRequestRepository,
  UserRepository,
} from "@/data/repositories";
import {
  demoBusinesses,
  demoCategories,
  demoMerchants,
  demoProducts,
} from "@/data/adapters/mock/demo-data";

const clone = <T>(value: T): T => structuredClone(value);
const now = () => new Date().toISOString();
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-HN");

class MockBusinessRepository implements BusinessRepository {
  async list() {
    return clone(demoBusinesses);
  }

  async getById(id: EntityId) {
    return clone(demoBusinesses.find((business) => business.id === id) ?? null);
  }
}

class MockMerchantRepository implements MerchantRepository {
  async list(query: MerchantQuery = {}) {
    const search = query.search ? normalize(query.search) : null;
    return clone(
      demoMerchants.filter((merchant) => {
        if (query.status && merchant.status !== query.status) return false;
        if (
          query.categoryId &&
          !merchant.categoryIds.includes(query.categoryId)
        ) {
          return false;
        }
        if (
          search &&
          !normalize(
            `${merchant.displayName} ${merchant.description}`,
          ).includes(search)
        ) {
          return false;
        }
        return true;
      }),
    );
  }

  async getBySlug(slug: string) {
    return clone(
      demoMerchants.find((merchant) => merchant.slug === slug) ?? null,
    );
  }

  async getByBusinessId(businessId: EntityId) {
    return clone(
      demoMerchants.find((merchant) => merchant.businessId === businessId) ??
        null,
    );
  }
}

class MockCategoryRepository implements CategoryRepository {
  async list() {
    return clone(demoCategories);
  }

  async getBySlug(slug: string) {
    return clone(
      demoCategories.find((category) => category.slug === slug) ?? null,
    );
  }
}

class MockProductRepository implements ProductRepository {
  async list(query: Parameters<ProductRepository["list"]>[0] = {}) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(48, Math.max(1, query.pageSize ?? 12));
    const search = query.search ? normalize(query.search) : null;
    const filtered = demoProducts.filter((product) => {
      if (query.businessId && product.businessId !== query.businessId)
        return false;
      if (query.categoryId && product.categoryId !== query.categoryId)
        return false;
      if (query.availability && product.availability !== query.availability)
        return false;
      if (query.featured !== undefined && product.featured !== query.featured)
        return false;
      if (
        search &&
        !normalize(`${product.name} ${product.description}`).includes(search)
      )
        return false;
      return true;
    });
    const start = (page - 1) * pageSize;

    return clone({
      items: filtered.slice(start, start + pageSize),
      page,
      pageSize,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
    });
  }

  async getById(id: EntityId) {
    return clone(demoProducts.find((product) => product.id === id) ?? null);
  }

  async getBySlug(businessId: EntityId, slug: string) {
    return clone(
      demoProducts.find(
        (product) => product.businessId === businessId && product.slug === slug,
      ) ?? null,
    );
  }
}

class MockCustomerRepository implements CustomerRepository {
  private readonly customers: Customer[] = [];

  async listByBusiness(businessId: EntityId) {
    return clone(
      this.customers.filter((customer) => customer.businessId === businessId),
    );
  }

  async getById(businessId: EntityId, id: EntityId) {
    return clone(
      this.customers.find(
        (customer) => customer.businessId === businessId && customer.id === id,
      ) ?? null,
    );
  }

  async save(customer: Customer) {
    const existing = this.customers.findIndex(({ id }) => id === customer.id);
    if (existing >= 0) this.customers[existing] = clone(customer);
    else this.customers.push(clone(customer));
    return clone(customer);
  }
}

class MockQuoteRequestRepository implements QuoteRequestRepository {
  private readonly requests: QuoteRequest[] = [];
  private sequence = 0;

  constructor(private readonly customers: CustomerRepository) {}

  async create(rawInput: PublicQuoteRequestInput) {
    const input = publicQuoteRequestSchema.parse(rawInput);
    const products = input.items.map((item) => {
      const product = demoProducts.find(({ id }) => id === item.productId);
      if (!product || product.businessId !== input.businessId) {
        throw new Error(
          "Todos los productos deben pertenecer al mismo negocio.",
        );
      }
      return { product, item };
    });
    const createdAt = now();
    const suffix = String(++this.sequence).padStart(4, "0");
    const customerId = `customer-demo-${suffix}`;
    const customer: Customer = {
      id: customerId,
      businessId: input.businessId,
      name: input.customerName,
      type: input.customerType,
      phone: input.phone,
      whatsapp: input.whatsapp,
      notes: input.notes,
      isDemo: true,
      createdAt,
      updatedAt: createdAt,
    };
    await this.customers.save(customer);

    const request: QuoteRequest = {
      id: `quote-demo-${suffix}`,
      businessId: input.businessId,
      customerId,
      customerName: input.customerName,
      customerType: input.customerType,
      phone: input.phone,
      whatsapp: input.whatsapp,
      fulfillment: input.fulfillment,
      notes: input.notes,
      items: products.map(({ product, item }) => ({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unit: item.unit,
      })),
      status: "new",
      history: [{ status: "new", changedAt: createdAt }],
      isDemo: true,
      createdAt,
      updatedAt: createdAt,
    };
    this.requests.push(request);
    return clone(request);
  }

  async listByBusiness(businessId: EntityId, query: QuoteRequestQuery = {}) {
    const search = query.search ? normalize(query.search) : null;
    return clone(
      this.requests.filter((request) => {
        if (request.businessId !== businessId) return false;
        if (query.status && request.status !== query.status) return false;
        if (
          search &&
          !normalize(`${request.customerName} ${request.id}`).includes(search)
        )
          return false;
        return true;
      }),
    );
  }

  async getById(businessId: EntityId, id: EntityId) {
    return clone(
      this.requests.find(
        (request) => request.businessId === businessId && request.id === id,
      ) ?? null,
    );
  }

  async updateStatus(
    businessId: EntityId,
    id: EntityId,
    status: QuoteRequestStatus,
    actorUserId?: EntityId,
  ) {
    const request = this.requests.find(
      (candidate) => candidate.businessId === businessId && candidate.id === id,
    );
    if (!request) throw new Error("Solicitud no encontrada para este negocio.");
    const changedAt = now();
    request.status = status;
    request.updatedAt = changedAt;
    request.history.push({ status, changedAt, changedByUserId: actorUserId });
    return clone(request);
  }
}

class MockCartRepository implements CartRepository {
  private cart: Cart = {
    businessId: null,
    items: [],
    updatedAt: "2026-08-22T00:00:00.000Z",
  };

  async get() {
    return clone(this.cart);
  }

  async save(cart: Cart) {
    this.cart = clone(cart);
    return clone(this.cart);
  }

  async clear() {
    this.cart = { businessId: null, items: [], updatedAt: now() };
    return clone(this.cart);
  }
}

const demoUsers: User[] = [];
const demoMemberships: MerchantUser[] = [];

class MockUserRepository implements UserRepository {
  async getById(id: EntityId) {
    return clone(demoUsers.find((user) => user.id === id) ?? null);
  }

  async getMerchantMembership(userId: EntityId) {
    return clone(
      demoMemberships.find((membership) => membership.userId === userId) ??
        null,
    );
  }
}

class MemoryNotificationRepository implements NotificationRepository {
  private readonly records: Notification[] = [];
  async listByBusiness(businessId: EntityId) {
    return clone(this.records.filter((item) => item.businessId === businessId));
  }
  async save(notification: Notification) {
    this.records.push(clone(notification));
    return clone(notification);
  }
}

class MemoryActivityRepository implements ActivityRepository {
  private readonly records: Activity[] = [];
  async listByBusiness(businessId: EntityId) {
    return clone(this.records.filter((item) => item.businessId === businessId));
  }
  async save(activity: Activity) {
    this.records.push(clone(activity));
    return clone(activity);
  }
}

class MockPromotionRepository implements PromotionRepository {
  private readonly records: Promotion[] = [];
  async listByBusiness(businessId: EntityId) {
    return clone(this.records.filter((item) => item.businessId === businessId));
  }
}

export function createMockRepositories(): CommerceRepositories {
  const customers = new MockCustomerRepository();
  return {
    businesses: new MockBusinessRepository(),
    merchants: new MockMerchantRepository(),
    categories: new MockCategoryRepository(),
    products: new MockProductRepository(),
    customers,
    quoteRequests: new MockQuoteRequestRepository(customers),
    cart: new MockCartRepository(),
    users: new MockUserRepository(),
    notifications: new MemoryNotificationRepository(),
    activities: new MemoryActivityRepository(),
    promotions: new MockPromotionRepository(),
  };
}
