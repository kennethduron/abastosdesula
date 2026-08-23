import { publicQuoteRequestSchema } from "@/domain";
import { isFirebaseAdminConfigured } from "@/data/adapters/firebase/admin-config";
import { SlidingWindowRateLimiter } from "@/server/security/sliding-window-rate-limit";
import { hasTrustedSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

const limiter = new SlidingWindowRateLimiter(5, 60_000);

export async function POST(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return Response.json(
      { error: "Firebase no configurado." },
      { status: 503 },
    );
  }
  if (!hasTrustedSameOrigin(request)) {
    return Response.json({ error: "Origen no autorizado." }, { status: 403 });
  }
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const clientKey = forwarded || request.headers.get("x-real-ip") || "unknown";
  const limit = limiter.consume(clientKey);
  if (!limit.allowed) {
    return Response.json(
      { error: "Demasiadas solicitudes. Intenta nuevamente en un momento." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.retryAfterMs / 1_000)),
        },
      },
    );
  }
  const parsed = publicQuoteRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: "Datos de solicitud inválidos." },
      { status: 400 },
    );
  }
  try {
    const { createFirebaseQuoteRequest } =
      await import("@/data/adapters/firebase/quote-request-writer");
    const result = await createFirebaseQuoteRequest(parsed.data);
    return Response.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No fue posible guardar.";
    const status =
      message.includes("pertenecer") || message.includes("encontrado")
        ? 400
        : 503;
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : "unknown";
    if (status === 503) {
      console.error("[firebase-quotes] write failed", { code });
    }
    return Response.json(
      {
        error:
          status === 400 ? message : "No fue posible guardar la solicitud.",
      },
      { status },
    );
  }
}
