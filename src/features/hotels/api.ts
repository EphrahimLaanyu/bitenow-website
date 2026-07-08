import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { Hotel, HotelPayload, ListParams, PaginatedResponse, UUID } from "@/lib/api/types";

export function listHotels(params?: ListParams) {
  return apiRequest<PaginatedResponse<Hotel>>(apiEndpoints.hotels, { params });
}

export function getHotel(id: UUID) {
  return apiRequest<Hotel>(`${apiEndpoints.hotels}${id}/`);
}

export function createHotel(payload: HotelPayload) {
  return apiRequest<Hotel>(apiEndpoints.hotels, {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function updateHotel(id: UUID, payload: Partial<HotelPayload>) {
  return apiRequest<Hotel>(`${apiEndpoints.hotels}${id}/`, {
    body: JSON.stringify(payload),
    method: "PATCH"
  });
}

export function deleteHotel(id: UUID) {
  return apiRequest<void>(`${apiEndpoints.hotels}${id}/`, {
    method: "DELETE"
  });
}
