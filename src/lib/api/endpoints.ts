export const apiEndpoints = {
  auth: {
    me: "/api/v1/auth/me/",
    token: "/api/v1/auth/token/",
    refresh: "/api/v1/auth/token/refresh/"
  },
  hotels: "/api/v1/hotels/",
  memberships: "/api/v1/memberships/",
  menu: {
    categories: "/api/v1/menu/categories/",
    items: "/api/v1/menu/items/"
  },
  tables: "/api/v1/tables/",
  orders: "/api/v1/orders/",
  orderItems: "/api/v1/order-items/",
  payments: "/api/v1/payments/",
  notifications: "/api/v1/notifications/",
  auditLogs: "/api/v1/audit-logs/"
} as const;
