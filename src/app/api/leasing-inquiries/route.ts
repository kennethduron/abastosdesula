import { isFirebaseAdminConfigured } from "@/data/adapters/firebase/admin-config";
import { publicLeasingInquirySchema } from "@/domain";
import { requestClientKey } from "@/server/merchant-self-service/shared";
import { SlidingWindowRateLimiter } from "@/server/security/sliding-window-rate-limit";
import { hasTrustedSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";
const limiter = new SlidingWindowRateLimiter(4, 10 * 60_000);

export async function POST(request: Request) {
  if (!isFirebaseAdminConfigured())
    return Response.json(
      { error: "El servicio de solicitudes no está disponible temporalmente." },
      { status: 503 },
    );
  if (!hasTrustedSameOrigin(request))
    return Response.json({ error: "Origen no autorizado." }, { status: 403 });
  const limit = limiter.consume(requestClientKey(request));
  if (!limit.allowed)
    return Response.json(
      {
        error:
          "Se han enviado varias solicitudes. Intenta nuevamente más tarde.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
        },
      },
    );
  const parsed = publicLeasingInquirySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: "Revisa la información ingresada." },
      { status: 400 },
    );
  if (parsed.data.website)
    return Response.json(
      { error: "No fue posible procesar la solicitud." },
      { status: 400 },
    );
  try {
    const { createFirebaseLeasingInquiry } =
      await import("@/data/adapters/firebase/leasing-inquiry-writer");
    const result = await createFirebaseLeasingInquiry(parsed.data);
    return Response.json(result, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const clientError = message.includes("seleccionado");
    if (!clientError)
      console.error("[leasing-inquiry] write failed", {
        code:
          typeof error === "object" && error && "code" in error
            ? String(error.code)
            : "unknown",
      });
    return Response.json(
      { error: clientError ? message : "No fue posible guardar la solicitud." },
      { status: clientError ? 400 : 503 },
    );
  }
}
