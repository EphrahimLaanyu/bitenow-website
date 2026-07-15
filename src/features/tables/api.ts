import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
  DiningTable,
  DiningTablePayload,
  ListParams,
  PaginatedResponse,
  UUID
} from "@/lib/api/types";

export function listTables(params?: ListParams) {
  return apiRequest<PaginatedResponse<DiningTable>>(apiEndpoints.tables, {
    hotelId: params?.hotel,
    params
  });
}

export function createTable(payload: DiningTablePayload) {
  return apiRequest<DiningTable>(apiEndpoints.tables, {
    body: JSON.stringify(payload),
    hotelId: payload.hotel,
    method: "POST"
  });
}

export function updateTable(id: UUID, payload: Partial<DiningTablePayload>) {
  return apiRequest<DiningTable>(`${apiEndpoints.tables}${id}/`, {
    body: JSON.stringify(payload),
    hotelId: payload.hotel,
    method: "PATCH"
  });
}

export function deleteTable(id: UUID, hotelId?: UUID) {
  return apiRequest<void>(`${apiEndpoints.tables}${id}/`, {
    hotelId,
    method: "DELETE"
  });
}
