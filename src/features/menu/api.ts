import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
  ListParams,
  MenuCategory,
  MenuCategoryPayload,
  MenuItem,
  MenuItemPayload,
  PaginatedResponse,
  UUID
} from "@/lib/api/types";

export function listMenuCategories(params?: ListParams) {
  return apiRequest<PaginatedResponse<MenuCategory>>(apiEndpoints.menu.categories, {
    hotelId: params?.hotel,
    params
  });
}

export function getMenuCategory(id: UUID, hotelId?: UUID) {
  return apiRequest<MenuCategory>(`${apiEndpoints.menu.categories}${id}/`, {
    hotelId
  });
}

export function createMenuCategory(payload: MenuCategoryPayload) {
  return apiRequest<MenuCategory>(apiEndpoints.menu.categories, {
    body: JSON.stringify(payload),
    hotelId: payload.hotel,
    method: "POST"
  });
}

export function updateMenuCategory(id: UUID, payload: Partial<MenuCategoryPayload>) {
  return apiRequest<MenuCategory>(`${apiEndpoints.menu.categories}${id}/`, {
    body: JSON.stringify(payload),
    hotelId: payload.hotel,
    method: "PATCH"
  });
}

export function deleteMenuCategory(id: UUID, hotelId?: UUID) {
  return apiRequest<void>(`${apiEndpoints.menu.categories}${id}/`, {
    hotelId,
    method: "DELETE"
  });
}

export function listMenuItems(params?: ListParams) {
  return apiRequest<PaginatedResponse<MenuItem>>(apiEndpoints.menu.items, {
    hotelId: params?.hotel,
    params
  });
}

export function getMenuItem(id: UUID, hotelId?: UUID) {
  return apiRequest<MenuItem>(`${apiEndpoints.menu.items}${id}/`, {
    hotelId
  });
}

export function createMenuItem(payload: MenuItemPayload) {
  return apiRequest<MenuItem>(apiEndpoints.menu.items, {
    body: JSON.stringify(payload),
    hotelId: payload.hotel,
    method: "POST"
  });
}

export function updateMenuItem(id: UUID, payload: Partial<MenuItemPayload>) {
  return apiRequest<MenuItem>(`${apiEndpoints.menu.items}${id}/`, {
    body: JSON.stringify(payload),
    hotelId: payload.hotel,
    method: "PATCH"
  });
}

export function deleteMenuItem(id: UUID, hotelId?: UUID) {
  return apiRequest<void>(`${apiEndpoints.menu.items}${id}/`, {
    hotelId,
    method: "DELETE"
  });
}
