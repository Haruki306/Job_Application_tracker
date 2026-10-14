import { auth } from "@/lib/auth";
import { parseApplicationFields, type ApplicationFields } from "@/lib/applications";

export async function getUserId(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user.id ?? null;
}

export function mutationHasTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const configuredOrigin = new URL(
      process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    ).origin;
    return new URL(origin).origin === configuredOrigin;
  } catch {
    return false;
  }
}

export async function readApplicationFields(
  request: Request,
): Promise<{ fields: ApplicationFields } | { error: Response }> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 16_384) {
    return { error: Response.json({ error: "Application details are too large." }, { status: 413 }) };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: Response.json({ error: "Request body must be valid JSON." }, { status: 400 }) };
  }

  const fields = parseApplicationFields(body);
  if (!fields) {
    return { error: Response.json({ error: "Application details are invalid." }, { status: 400 }) };
  }
  return { fields };
}
