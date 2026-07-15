import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { AuditLog, ListParams, PaginatedResponse, UUID } from "@/lib/api/types";

export function listAuditLogs(params?: ListParams, hotelId?: UUID) {
  return apiRequest<PaginatedResponse<AuditLog>>(apiEndpoints.auditLogs, {
    hotelId: hotelId ?? params?.hotel,
    params
  });
}
