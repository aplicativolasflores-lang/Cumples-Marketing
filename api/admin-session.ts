import {
  ApiRequest,
  ApiResponse,
  clearAdminCookie,
  hasValidAdminSession,
} from "../server/admin-auth.js";

export default function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method === "GET") {
    return response.status(200).json({ authenticated: hasValidAdminSession(request) });
  }

  if (request.method === "DELETE") {
    response.setHeader("Set-Cookie", clearAdminCookie());
    return response.status(200).json({ authenticated: false });
  }

  response.setHeader("Allow", "GET, DELETE");
  return response.status(405).json({ error: "Method not allowed" });
}