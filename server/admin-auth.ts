import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "las_flores_admin";
const SESSION_SECONDS = 8 * 60 * 60;

export type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

export type ApiResponse = {
  setHeader(name: string, value: string | string[]): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
};

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

function signature(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function constantTimeMatches(value: string, expected: string) {
  const secret = sessionSecret();
  if (!secret) return false;

  const valueDigest = createHmac("sha256", secret).update(value).digest();
  const expectedDigest = createHmac("sha256", secret).update(expected).digest();
  return timingSafeEqual(valueDigest, expectedDigest);
}

export function hasAdminConfiguration() {
  return Boolean(
    process.env.ADMIN_USERNAME &&
      process.env.ADMIN_PASSWORD &&
      sessionSecret().length >= 32,
  );
}

export function credentialsAreValid(username: string, password: string) {
  if (!hasAdminConfiguration()) return false;
  return (
    constantTimeMatches(username, process.env.ADMIN_USERNAME ?? "") &&
    constantTimeMatches(password, process.env.ADMIN_PASSWORD ?? "")
  );
}

export function createAdminCookie() {
  const payload = Buffer.from(
    JSON.stringify({
      username: process.env.ADMIN_USERNAME,
      expiresAt: Date.now() + SESSION_SECONDS * 1000,
    }),
  ).toString("base64url");
  const token = `${payload}.${signature(payload)}`;
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`;
}

export function clearAdminCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export function hasValidAdminSession(request: ApiRequest) {
  if (!hasAdminConfiguration()) return false;

  const cookieHeader = request.headers.cookie;
  if (typeof cookieHeader !== "string") return false;

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  const token = cookie?.slice(COOKIE_NAME.length + 1);
  if (!token) return false;

  const [payload, providedSignature, extra] = token.split(".");
  if (!payload || !providedSignature || extra !== undefined) return false;

  const expectedSignature = Buffer.from(signature(payload), "base64url");
  const receivedSignature = Buffer.from(providedSignature, "base64url");
  if (
    expectedSignature.length !== receivedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    return false;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      username?: string;
      expiresAt?: number;
    };
    return (
      session.username === process.env.ADMIN_USERNAME &&
      typeof session.expiresAt === "number" &&
      session.expiresAt > Date.now()
    );
  } catch {
    return false;
  }
}

export function isSameOriginRequest(request: ApiRequest) {
  const origin = request.headers.origin;
  const forwardedHost = request.headers["x-forwarded-host"];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) ?? request.headers.host;
  if (typeof origin !== "string" || typeof host !== "string") return false;

  try {
    return new URL(origin).host === host.split(",")[0].trim();
  } catch {
    return false;
  }
}