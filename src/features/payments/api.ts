import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { ListParams, PaginatedResponse, Payment } from "@/lib/api/types";

export function listPayments(params?: ListParams) {
  return apiRequest<PaginatedResponse<Payment>>(apiEndpoints.payments, {
    hotelId: params?.hotel,
    params
  });
}
