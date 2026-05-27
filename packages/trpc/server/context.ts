import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { SESSION_COOKIE_NAME } from "@repo/services/auth";
import { authService } from "./services";

function parseCookies(cookieHeader?: string) {
  const cookies = new Map<string, string>();
  if (!cookieHeader) return cookies;
  for (const cookie of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = cookie.trim().split("=");
    if (!rawKey) continue;
    cookies.set(rawKey, decodeURIComponent(rawValue.join("=")));
  }
  return cookies;
}

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies.get(SESSION_COOKIE_NAME) ?? null;
  const session = await authService.getSession(sessionToken);

  return {
    req,
    res,
    user: session?.user ?? null,
    session: session?.session ?? null,
    sessionToken,
    ipAddress:
      (req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket.remoteAddress) ??
      null,
    userAgent: req.headers["user-agent"] ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
