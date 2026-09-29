import { list, put } from "@vercel/blob";
import {
  ApiRequest,
  ApiResponse,
  hasValidAdminSession,
  isSameOriginRequest,
} from "../server/admin-auth.js";

const CONFIG_PATH = "site-settings/greeting.json";

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method === "GET") {
    try {
      const { blobs } = await list({ prefix: CONFIG_PATH, limit: 1 });
      const configBlob = blobs.find((blob) => blob.pathname === CONFIG_PATH);
      if (!configBlob) return response.status(404).json({ error: "Not found" });

      const configResponse = await fetch(configBlob.url, { cache: "no-store" });
      if (!configResponse.ok) throw new Error("Could not read greeting config");
      return response.status(200).json(await configResponse.json());
    } catch {
      return response.status(503).json({ error: "Shared greeting storage is unavailable" });
    }
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!isSameOriginRequest(request) || !hasValidAdminSession(request)) {
    return response.status(403).json({ error: "Forbidden" });
  }

  let body = request.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return response.status(400).json({ error: "Invalid request" });
    }
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return response.status(400).json({ error: "Invalid greeting" });
  }

  const greeting = body as { audioUrl?: unknown };
  const serializedGreeting = JSON.stringify(body);
  if (
    serializedGreeting.length > 64 * 1024 ||
    (typeof greeting.audioUrl === "string" && greeting.audioUrl.startsWith("data:"))
  ) {
    return response.status(413).json({ error: "Greeting is too large to publish" });
  }

  try {
    const blob = await put(CONFIG_PATH, serializedGreeting, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json; charset=utf-8",
    });
    return response.status(200).json({ saved: true, url: blob.url });
  } catch {
    return response.status(503).json({ error: "Could not save shared greeting" });
  }
}
