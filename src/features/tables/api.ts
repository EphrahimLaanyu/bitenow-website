import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { DiningTable, ListParams, PaginatedResponse } from "@/lib/api/types";

export function listTables(params?: ListParams) {
  return apiRequest<PaginatedResponse<DiningTable>>(apiEndpoints.tables, { params });
}
