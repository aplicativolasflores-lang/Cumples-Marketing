import { handleUpload } from "@vercel/blob/client";
import {
  ApiRequest,
  ApiResponse,
  hasValidAdminSession,
  isSameOriginRequest,
} from "../server/admin-auth.js";

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
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

  try {
    const jsonResponse = await handleUpload({
      body: body as Parameters<typeof handleUpload>[0]["body"],
      request: request as unknown as Request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["audio/*"],
        maximumSizeInBytes: 3.5 * 1024 * 1024,
      }),
      onUploadCompleted: async () => undefined,
    });

    return response.status(200).json(jsonResponse);
  } catch {
    return response.status(500).json({ error: "No se pudo preparar la subida del audio." });
  }
}
