import { db } from "./client";
import { apiLogs } from "./schema";

export interface LogApiCallParams {
  workspaceId?: string | null;
  service: "gemini" | "voyage";
  endpoint: string;
  status: "success" | "error";
  latencyMs?: number;
  tokensUsed?: number;
  errorMessage?: string;
}

export async function logApiCall(params: LogApiCallParams) {
  try {
    await db.insert(apiLogs).values({
      workspaceId: params.workspaceId || null,
      service: params.service,
      endpoint: params.endpoint,
      status: params.status,
      latencyMs: params.latencyMs || null,
      tokensUsed: params.tokensUsed || null,
      errorMessage: params.errorMessage || null,
    });
  } catch (err) {
    console.error("[logApiCall] Failed to log API call to database:", err);
  }
}
