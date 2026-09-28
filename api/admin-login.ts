import {
  ApiRequest,
  ApiResponse,
  createAdminCookie,
  credentialsAreValid,
  hasAdminConfiguration,
  isSameOriginRequest,
} from "../server/admin-auth";

export default function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!isSameOriginRequest(request)) {
    return response.status(403).json({ error: "Forbidden" });
  }

  if (!hasAdminConfiguration()) {
    return response.status(503).json({ error: "Admin access is not configured" });
  }

  let body = request.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return response.status(400).json({ error: "Invalid request" });
    }
  }

  const credentials = body as { username?: unknown; password?: unknown } | null;
  if (
    typeof credentials?.username !== "string" ||
    typeof credentials.password !== "string" ||
    credentials.username.length > 200 ||
    credentials.password.length > 200 ||
    !credentialsAreValid(credentials.username, credentials.password)
  ) {
    return response.status(401).json({ error: "Invalid credentials" });
  }

  response.setHeader("Set-Cookie", createAdminCookie());
  return response.status(200).json({ authenticated: true });
}