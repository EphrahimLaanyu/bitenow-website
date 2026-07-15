import type { Hotel } from "@/lib/api/types";

type HotelVisualFields = {
  description?: string;
  gallery?: string[];
  image?: string;
  images?: string[];
  image_url?: string;
  location?: string;
  logo?: string;
  logo_url?: string;
  opening_hours?: string | Record<string, string>;
  photo_url?: string;
  photos?: string[];
  restaurant_info?: string;
  short_description?: string;
};

export function getHotelDescription(hotel: Hotel) {
  const fields = hotel as Hotel & HotelVisualFields;
  return (
    fields.description ||
    fields.short_description ||
    `Order food, track your meal, and manage your visit at ${hotel.name}.`
  );
}

export function getHotelImageUrl(hotel: Hotel) {
  const fields = hotel as Hotel & HotelVisualFields;
  return fields.image_url || fields.photo_url || fields.image || fields.logo_url || fields.logo || "";
}

export function getHotelLocation(hotel: Hotel) {
  const fields = hotel as Hotel & HotelVisualFields;
  return fields.location || hotel.address || hotel.timezone || "Location not listed";
}

export function getHotelGallery(hotel: Hotel) {
  const fields = hotel as Hotel & HotelVisualFields;
  const images = [
    ...(fields.gallery ?? []),
    ...(fields.images ?? []),
    ...(fields.photos ?? []),
    getHotelImageUrl(hotel)
  ];

  return Array.from(new Set(images.filter(Boolean)));
}

export function getHotelRestaurantInfo(hotel: Hotel) {
  const fields = hotel as Hotel & HotelVisualFields;
  return (
    fields.restaurant_info ||
    `${hotel.name} supports guest food ordering through the hotel ordering system.`
  );
}

export function getHotelOpeningHours(hotel: Hotel) {
  const fields = hotel as Hotel & HotelVisualFields;

  if (!fields.opening_hours) return "Opening hours not listed";
  if (typeof fields.opening_hours === "string") return fields.opening_hours;

  return Object.entries(fields.opening_hours)
    .map(([day, hours]) => `${day}: ${hours}`)
    .join("\n");
}

export function getHotelInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
