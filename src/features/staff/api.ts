import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
  HotelMembership,
  HotelMembershipPayload,
  ListParams,
  PaginatedResponse,
  UUID
} from "@/lib/api/types";

export function listStaffMemberships(params?: ListParams) {
  return apiRequest<PaginatedResponse<HotelMembership>>(apiEndpoints.memberships, { params });
}

export function createStaffMembership(payload: HotelMembershipPayload) {
  return apiRequest<HotelMembership>(apiEndpoints.memberships, {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function updateStaffMembership(id: UUID, payload: Partial<HotelMembershipPayload>) {
  return apiRequest<HotelMembership>(`${apiEndpoints.memberships}${id}/`, {
    body: JSON.stringify(payload),
    method: "PATCH"
  });
}

export function deleteStaffMembership(id: UUID) {
  return apiRequest<void>(`${apiEndpoints.memberships}${id}/`, {
    method: "DELETE"
  });
}
