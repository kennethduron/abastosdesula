import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  runTransaction,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const projectId = "demo-abastosdesula";
const [host = "127.0.0.1", portText = "8080"] = (
  process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080"
).split(":");
let environment;

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host,
      port: Number(portText),
      rules: readFileSync("firebase/firestore.rules", "utf8"),
    },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, "users", "merchant-a"), {
        role: "merchant",
        active: true,
      }),
      setDoc(doc(db, "users", "merchant-b"), {
        role: "merchant",
        active: true,
      }),
      setDoc(doc(db, "users", "admin"), {
        role: "institutional_admin",
        active: true,
      }),
      setDoc(doc(db, "users", "presentation"), {
        role: "presentation_viewer",
        active: true,
      }),
      setDoc(doc(db, "users", "mismatched-viewer"), {
        role: "merchant",
        active: true,
      }),
      setDoc(doc(db, "users", "applicant"), {
        role: "merchant_applicant",
        active: true,
        status: "pending",
      }),
      setDoc(doc(db, "merchantApplications", "application-a"), {
        userId: "applicant",
        status: "pending",
        businessName: "Negocio aspirante",
      }),
      setDoc(doc(db, "quoteRequests", "quote-a"), {
        businessId: "business-a",
        customerId: "customer-a",
        status: "new",
      }),
      setDoc(doc(db, "quoteRequests", "quote-b"), {
        businessId: "business-b",
        customerId: "customer-b",
        status: "new",
      }),
      setDoc(doc(db, "customers", "customer-a"), {
        businessId: "business-a",
        name: "Cliente A",
      }),
      setDoc(doc(db, "products", "product-a"), {
        id: "product-a",
        businessId: "business-a",
        status: "active",
        name: "Producto A",
        stock: 10,
        minimumStock: 2,
      }),
      setDoc(doc(db, "products", "product-private-a"), {
        id: "product-private-a",
        businessId: "business-a",
        status: "inactive",
        name: "Producto privado A",
        stock: 1,
        minimumStock: 1,
      }),
      setDoc(doc(db, "activities", "activity-a"), {
        businessId: "business-a",
        type: "quote_request_created",
      }),
      setDoc(doc(db, "notifications", "notification-a"), {
        businessId: "business-a",
        type: "quote_request_created",
        readAt: null,
      }),
      setDoc(doc(db, "tenantAccounts", "business-a"), {
        businessId: "business-a",
        businessName: "Negocio A",
        accountStatus: "current",
      }),
      setDoc(doc(db, "tenantAccounts", "business-b"), {
        businessId: "business-b",
        businessName: "Negocio B",
        accountStatus: "pending",
      }),
      setDoc(doc(db, "tenantPayments", "payment-a"), {
        businessId: "business-a",
        period: "Agosto 2026",
        paidAmountMinor: 500000,
      }),
      setDoc(doc(db, "tenantPayments", "payment-b"), {
        businessId: "business-b",
        period: "Agosto 2026",
        paidAmountMinor: 0,
      }),
      setDoc(doc(db, "commercialSpaces", "space-public"), {
        id: "space-public",
        title: "Local comercial",
        published: true,
      }),
      setDoc(doc(db, "commercialSpaces", "space-hidden"), {
        id: "space-hidden",
        title: "Local oculto",
        published: false,
      }),
      setDoc(doc(db, "leasingInquiries", "leasing-a"), {
        id: "leasing-a",
        reference: "LAS-20260828-ABC123",
        commercialSpaceId: "space-public",
        customerName: "Interesado",
        phone: "99990000",
        status: "new",
      }),
      setDoc(doc(db, "leasingActivities", "leasing-activity-a"), {
        inquiryId: "leasing-a",
        type: "created",
      }),
      setDoc(doc(db, "institutionalNotifications", "leasing-notification-a"), {
        inquiryId: "leasing-a",
        type: "leasing_inquiry_created",
        readAt: null,
      }),
    ]);
  });
});

after(async () => {
  await environment?.cleanup();
});

function merchant(uid, businessId) {
  return environment
    .authenticatedContext(uid, {
      role: "merchant",
      businessId,
    })
    .firestore();
}

function institutional(uid, role) {
  return environment.authenticatedContext(uid, { role }).firestore();
}

function applicant(uid = "applicant") {
  return environment
    .authenticatedContext(uid, { role: "merchant_applicant" })
    .firestore();
}

describe("Firestore multitenant rules", () => {
  it("exposes only published commercial spaces to the public", async () => {
    const publicDb = environment.unauthenticatedContext().firestore();
    await assertSucceeds(
      getDoc(doc(publicDb, "commercialSpaces", "space-public")),
    );
    await assertFails(
      getDoc(doc(publicDb, "commercialSpaces", "space-hidden")),
    );
    await assertFails(
      setDoc(doc(publicDb, "leasingInquiries", "public-write"), {
        status: "new",
      }),
    );
  });

  it("keeps leasing personal data restricted to institutional administrators", async () => {
    const admin = institutional("admin", "institutional_admin");
    const presentation = institutional("presentation", "presentation_viewer");
    const merchantDb = merchant("merchant-a", "business-a");
    await assertSucceeds(getDoc(doc(admin, "leasingInquiries", "leasing-a")));
    await assertSucceeds(
      updateDoc(doc(admin, "leasingInquiries", "leasing-a"), {
        status: "contacted",
      }),
    );
    await assertFails(
      getDoc(doc(presentation, "leasingInquiries", "leasing-a")),
    );
    await assertFails(getDoc(doc(merchantDb, "leasingInquiries", "leasing-a")));
    await assertFails(
      getDoc(doc(presentation, "leasingActivities", "leasing-activity-a")),
    );
    await assertSucceeds(
      getDoc(
        doc(admin, "institutionalNotifications", "leasing-notification-a"),
      ),
    );
    await assertFails(
      updateDoc(doc(presentation, "commercialSpaces", "space-public"), {
        published: false,
      }),
    );
  });
  it("keeps applicants outside admin, CRM, products and other applications", async () => {
    const db = applicant();
    await assertSucceeds(
      getDoc(doc(db, "merchantApplications", "application-a")),
    );
    await assertFails(getDoc(doc(db, "quoteRequests", "quote-a")));
    await assertFails(getDoc(doc(db, "customers", "customer-a")));
    await assertFails(getDoc(doc(db, "products", "product-private-a")));
    await assertFails(
      updateDoc(doc(db, "merchantApplications", "application-a"), {
        status: "approved",
      }),
    );
  });

  it("allows product management only inside the merchant business", async () => {
    const merchantA = merchant("merchant-a", "business-a");
    const product = {
      id: "product-new-a",
      businessId: "business-a",
      status: "active",
      name: "Producto nuevo",
      stock: 3,
      minimumStock: 1,
      published: false,
    };
    await assertSucceeds(
      setDoc(doc(merchantA, "products", product.id), product),
    );
    await assertFails(
      setDoc(doc(merchantA, "products", "product-new-b"), {
        ...product,
        id: "product-new-b",
        businessId: "business-b",
      }),
    );
    await assertSucceeds(
      updateDoc(doc(merchantA, "products", product.id), { published: true }),
    );
  });

  it("records an atomic inventory movement without allowing negative or foreign stock", async () => {
    const merchantA = merchant("merchant-a", "business-a");
    await assertSucceeds(
      runTransaction(merchantA, async (transaction) => {
        const productReference = doc(merchantA, "products", "product-a");
        const product = await transaction.get(productReference);
        transaction.update(productReference, { stock: 7 });
        transaction.set(doc(merchantA, "inventoryMovements", "movement-a"), {
          id: "movement-a",
          businessId: "business-a",
          productId: "product-a",
          type: "exit",
          quantity: 3,
          previousStock: product.data().stock,
          newStock: 7,
          reason: "Salida confirmada",
          createdBy: "merchant-a",
        });
      }),
    );
    const merchantB = merchant("merchant-b", "business-b");
    await assertFails(
      setDoc(doc(merchantB, "inventoryMovements", "movement-b"), {
        id: "movement-b",
        businessId: "business-a",
        productId: "product-a",
        type: "adjustment",
        quantity: 1,
        previousStock: 7,
        newStock: 1,
        reason: "Manipulación",
        createdBy: "merchant-b",
      }),
    );
  });
  it("rejects anonymous access to private quote requests", async () => {
    const db = environment.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "quoteRequests", "quote-a")));
  });

  it("allows a merchant to read and update only its own quote", async () => {
    const db = merchant("merchant-a", "business-a");
    await assertSucceeds(getDoc(doc(db, "quoteRequests", "quote-a")));
    await assertSucceeds(
      updateDoc(doc(db, "quoteRequests", "quote-a"), { status: "in_review" }),
    );
    await assertFails(getDoc(doc(db, "quoteRequests", "quote-b")));
    await assertFails(
      updateDoc(doc(db, "quoteRequests", "quote-b"), { status: "cancelled" }),
    );
  });

  it("rejects manual businessId reassignment", async () => {
    const db = merchant("merchant-a", "business-a");
    await assertFails(
      updateDoc(doc(db, "quoteRequests", "quote-a"), {
        businessId: "business-b",
      }),
    );
    await assertFails(
      updateDoc(doc(db, "products", "product-a"), {
        businessId: "business-b",
      }),
    );
  });

  it("isolates private customers and inactive products by tenant", async () => {
    const merchantA = merchant("merchant-a", "business-a");
    const merchantB = merchant("merchant-b", "business-b");
    await assertSucceeds(getDoc(doc(merchantA, "customers", "customer-a")));
    await assertSucceeds(
      getDoc(doc(merchantA, "products", "product-private-a")),
    );
    await assertFails(getDoc(doc(merchantB, "customers", "customer-a")));
    await assertFails(getDoc(doc(merchantB, "products", "product-private-a")));
  });

  it("allows workflow fields but rejects customer or item tampering", async () => {
    const db = merchant("merchant-a", "business-a");
    await assertSucceeds(
      updateDoc(doc(db, "quoteRequests", "quote-a"), {
        status: "quoted",
        history: [{ status: "quoted", changedAt: "2026-08-22T00:00:00.000Z" }],
      }),
    );
    await assertFails(
      updateDoc(doc(db, "quoteRequests", "quote-a"), {
        customerName: "Contacto manipulado",
      }),
    );
    await assertFails(
      updateDoc(doc(db, "quoteRequests", "quote-a"), {
        status: "arbitrary_status",
      }),
    );
  });

  it("allows a merchant to create only a valid manual request for its business", async () => {
    const merchantA = merchant("merchant-a", "business-a");
    const manualRequest = {
      id: "quote-manual-a",
      businessId: "business-a",
      customerId: "customer-a",
      customerName: "Cliente A",
      customerType: "business",
      phone: "99990000",
      source: "phone",
      fulfillment: "coordinate",
      items: [{ productId: "product-a", quantity: 2, unit: "unidad" }],
      status: "new",
      history: [{ status: "new", changedAt: "2026-08-23T00:00:00.000Z" }],
      internalNotes: [],
      followUps: [],
      activity: [],
    };
    await assertSucceeds(
      setDoc(doc(merchantA, "quoteRequests", "quote-manual-a"), manualRequest),
    );
    await assertFails(
      setDoc(doc(merchantA, "quoteRequests", "quote-manual-b"), {
        ...manualRequest,
        id: "quote-manual-b",
        businessId: "business-b",
      }),
    );
  });

  it("allows private CRM workflow updates and rejects identity changes", async () => {
    const db = merchant("merchant-a", "business-a");
    await assertSucceeds(
      updateDoc(doc(db, "quoteRequests", "quote-a"), {
        internalNotes: [
          {
            id: "note-a",
            body: "Precio especial",
            createdAt: "2026-08-23T00:00:00.000Z",
          },
        ],
        followUps: [
          {
            id: "follow-a",
            title: "Llamar",
            dueAt: "2026-08-25T15:00:00.000Z",
            status: "pending",
          },
        ],
        activity: [
          {
            id: "activity-a",
            type: "note_added",
            description: "Nota agregada",
            createdAt: "2026-08-23T00:00:00.000Z",
          },
        ],
      }),
    );
    await assertFails(
      updateDoc(doc(db, "quoteRequests", "quote-a"), {
        phone: "00000000",
      }),
    );
  });

  it("allows customer notes without allowing contact or tenant changes", async () => {
    const db = merchant("merchant-a", "business-a");
    await assertSucceeds(
      updateDoc(doc(db, "customers", "customer-a"), {
        internalNotes: [
          {
            id: "note-a",
            body: "Cliente frecuente",
            createdAt: "2026-08-23T00:00:00.000Z",
          },
        ],
      }),
    );
    await assertFails(
      updateDoc(doc(db, "customers", "customer-a"), {
        phone: "00000000",
      }),
    );
  });

  it("keeps detailed quotes private from institutional admin", async () => {
    const db = environment
      .authenticatedContext("admin", {
        role: "institutional_admin",
      })
      .firestore();
    await assertFails(getDoc(doc(db, "quoteRequests", "quote-a")));
    await assertFails(getDoc(doc(db, "customers", "customer-a")));
    const activity = await assertSucceeds(
      getDoc(doc(db, "activities", "activity-a")),
    );
    assert.equal(activity.data()?.type, "quote_request_created");
  });

  it("keeps merchant notifications isolated by business", async () => {
    const merchantA = merchant("merchant-a", "business-a");
    const merchantB = merchant("merchant-b", "business-b");
    await assertSucceeds(
      getDoc(doc(merchantA, "notifications", "notification-a")),
    );
    await assertFails(
      getDoc(doc(merchantB, "notifications", "notification-a")),
    );
    await assertSucceeds(
      updateDoc(doc(merchantA, "notifications", "notification-a"), {
        readAt: "2026-08-22T00:00:00.000Z",
      }),
    );
    await assertFails(
      updateDoc(doc(merchantA, "notifications", "notification-a"), {
        type: "tampered",
      }),
    );
  });

  it("isolates every tenant account and payment between merchants", async () => {
    const merchantA = merchant("merchant-a", "business-a");
    const merchantB = merchant("merchant-b", "business-b");

    await assertSucceeds(
      getDoc(doc(merchantA, "tenantAccounts", "business-a")),
    );
    await assertSucceeds(getDoc(doc(merchantA, "tenantPayments", "payment-a")));
    await assertFails(getDoc(doc(merchantA, "tenantAccounts", "business-b")));
    await assertFails(getDoc(doc(merchantA, "tenantPayments", "payment-b")));
    await assertFails(getDoc(doc(merchantB, "tenantAccounts", "business-a")));
    await assertFails(getDoc(doc(merchantB, "tenantPayments", "payment-a")));
  });

  it("allows institutional readers to consult billing without private CRM access", async () => {
    const admin = institutional("admin", "institutional_admin");
    const presentation = institutional("presentation", "presentation_viewer");

    await assertSucceeds(getDoc(doc(admin, "tenantAccounts", "business-a")));
    await assertSucceeds(
      getDoc(doc(presentation, "tenantAccounts", "business-a")),
    );
    await assertSucceeds(
      getDoc(doc(presentation, "tenantPayments", "payment-b")),
    );
    await assertFails(getDoc(doc(presentation, "quoteRequests", "quote-a")));
    await assertFails(getDoc(doc(presentation, "customers", "customer-a")));
  });

  it("requires an active profile whose role matches the verified claim", async () => {
    const missingProfile = institutional(
      "unprovisioned-viewer",
      "presentation_viewer",
    );
    const mismatchedProfile = institutional(
      "mismatched-viewer",
      "presentation_viewer",
    );

    await assertFails(
      getDoc(doc(missingProfile, "tenantAccounts", "business-a")),
    );
    await assertFails(
      getDoc(doc(mismatchedProfile, "tenantAccounts", "business-a")),
    );
  });

  it("keeps presentation and administrative billing access read only", async () => {
    const presentation = institutional("presentation", "presentation_viewer");
    const admin = institutional("admin", "institutional_admin");

    await assertFails(
      updateDoc(doc(presentation, "tenantAccounts", "business-a"), {
        accountStatus: "overdue",
      }),
    );
    await assertFails(
      setDoc(doc(presentation, "tenantPayments", "payment-new"), {
        businessId: "business-a",
        paidAmountMinor: 1,
      }),
    );
    await assertFails(
      updateDoc(doc(admin, "tenantPayments", "payment-a"), {
        paidAmountMinor: 1,
      }),
    );
  });
});
