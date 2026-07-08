import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";

export function listAuditLogs(params?: { page?: number; page_size?: number; search?: string }) {
  return apiRequest<unknown>(apiEndpoints.auditLogs, { params });
}
