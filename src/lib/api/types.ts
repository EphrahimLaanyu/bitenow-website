export type UUID = string;
export type ISODateTime = string;
export type DecimalString = string;

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ListParams = {
  hotel?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  search?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type TokenPair = {
  access: string;
  refresh: string;
};

export type CurrentUser = {
  id?: UUID;
  email?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  username?: string;
  [key: string]: unknown;
} | null;

export type Hotel = {
  id: UUID;
  name: string;
  code: string;
  timezone: string;
  currency: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type HotelPayload = {
  name: string;
  code: string;
  timezone?: string;
  currency?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
};

export type Role = "owner" | "admin" | "manager" | "cashier" | "chef" | "waiter";
export type HotelMembership = {
  id: UUID;
  user: UUID;
  hotel: UUID;
  role?: Role;
  is_active?: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type HotelMembershipPayload = {
  user: UUID;
  hotel: UUID;
  role?: Role;
  is_active?: boolean;
};

export type DiningTableStatus = "available" | "occupied" | "reserved" | "out_of_service";
export type DiningTable = {
  id: UUID;
  hotel: UUID;
  table_number: string;
  capacity?: number;
  status?: DiningTableStatus;
  notes?: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type MenuItem = {
  id: UUID;
  hotel: UUID;
  category: UUID | null;
  name: string;
  slug: string;
  description?: string;
  sku?: string;
  price: DecimalString;
  is_available?: boolean;
  prep_time_minutes?: number;
  image_url?: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type MenuItemPayload = {
  hotel: UUID;
  category?: UUID | null;
  name: string;
  slug: string;
  description?: string;
  sku: string;
  price?: DecimalString;
  is_available?: boolean;
  prep_time_minutes?: number;
  image_url?: string;
};

export type MenuCategory = {
  id: UUID;
  hotel: UUID;
  name: string;
  slug: string;
  sort_order?: number;
  is_active?: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type MenuCategoryPayload = {
  hotel: UUID;
  name: string;
  slug: string;
  sort_order?: number;
  is_active?: boolean;
};

export type OrderType = "dine_in" | "takeaway" | "delivery";
export type OrderStatus =
  | "draft"
  | "placed"
  | "accepted"
  | "in_preparation"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type Order = {
  id: UUID;
  hotel: UUID;
  order_number: string;
  created_by: UUID;
  table: UUID | null;
  order_type?: OrderType;
  status?: OrderStatus;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  total_amount?: DecimalString;
  placed_at: ISODateTime | null;
  completed_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type Payment = {
  id: UUID;
  order: UUID;
  method: string;
  status?: PaymentStatus;
  amount: DecimalString;
  transaction_reference?: string;
  received_by: UUID | null;
  paid_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};

export type Notification = {
  id: UUID;
  hotel: UUID;
  user: UUID | null;
  category: string;
  title: string;
  message: string;
  payload?: unknown;
  is_read?: boolean;
  read_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
};
