"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Clock, ImageIcon, Search, ShoppingCart, Utensils, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Hotel, MenuCategory, MenuItem } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/token-storage";
import { addCartItem } from "@/features/client/cart/cart-storage";
import { listHotels } from "@/features/hotels/api";
import { listMenuCategories, listMenuItems } from "@/features/menu/api";
import { cn } from "@/lib/utils";

export function ClientMenuPageClient() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [addedItemId, setAddedItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMenu() {
    setError(null);
    setLoading(true);

    try {
      if (!getAccessToken()) {
        throw new Error(
          "The backend currently requires sign-in before it returns menus. Please sign in to browse menus."
        );
      }

      const [hotelsResponse, categoriesResponse, itemsResponse] = await Promise.all([
        listHotels({ page_size: 100 }),
        listMenuCategories({ page_size: 100 }),
        listMenuItems({ page_size: 100 })
      ]);

      setHotels(hotelsResponse.results.filter((h) => h.is_active !== false));
      setCategories(sortCategories(categoriesResponse.results.filter((category) => category.is_active !== false)));
      setItems(sortItems(itemsResponse.results));
    } catch (menuError) {
      setError(getApiErrorMessage(menuError));
      setCategories([]);
      setItems([]);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMenu();
  }, []);

  const hotelMap = useMemo(() => {
    return new Map(hotels.map(h => [h.id, h]));
  }, [hotels]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = submittedSearch.trim().toLowerCase();

    return items.filter((item) => {
      // If the item doesn't belong to an active hotel, hide it
      if (!hotelMap.has(item.hotel)) return false;

      const matchesCategory = activeCategoryId === "all" || item.category === activeCategoryId;
      const matchesSearch =
        !normalizedSearch ||
        [item.name, item.description, item.sku, hotelMap.get(item.hotel)?.name]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategoryId, items, submittedSearch, hotelMap]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search.trim());
  }

  function handleAddToCart(item: MenuItem) {
    const hotel = hotelMap.get(item.hotel);
    
    addCartItem({
      currency: hotel?.currency,
      hotelId: item.hotel,
      imageUrl: item.image_url,
      itemId: item.id,
      name: item.name,
      prepTimeMinutes: item.prep_time_minutes,
      price: item.price,
      quantity: 1
    });
    setAddedItemId(item.id);
    window.setTimeout(() => setAddedItemId(null), 1500);
  }

  if (loading) {
    return (
      <div className="space-y-6 md:space-y-8 pb-20">
        <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="h-[420px] animate-pulse rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm" key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm pb-20">
        <p className="text-sm font-medium text-red-800">{error}</p>
        {error.includes("requires sign-in") ? (
          <Link
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
            href={`/login?next=${encodeURIComponent(`/client/menu`)}`}
          >
            Sign in to browse menus
          </Link>
        ) : null}
      </Card>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <Badge variant="outline" className="font-medium text-slate-600 border-slate-200">
            Global Menu
          </Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
            Discover Meals
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-500">
            Browse our entire collection of delicious meals across all available hotels.
          </p>
        </div>

        <form className="grid gap-3 sm:gap-4 sm:grid-cols-[1fr_auto]" onSubmit={handleSearch}>
          <Input
            className="h-10 border-slate-200 bg-white placeholder:text-slate-400 focus:border-[var(--accent)] shadow-sm"
            label="Search all menus"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Burger, fries, hotel..."
            value={search}
          />
          <Button className="h-10 self-end font-medium shadow-sm" type="submit" variant="secondary">
            <Search aria-hidden size={16} className="mr-2 text-slate-500" />
            Search
          </Button>
        </form>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <CategoryTab
          active={activeCategoryId === "all"}
          count={items.length}
          label="All"
          onClick={() => setActiveCategoryId("all")}
        />
        {categories.map((category) => (
          <CategoryTab
            active={activeCategoryId === category.id}
            count={items.filter((item) => item.category === category.id).length}
            key={category.id}
            label={category.name}
            onClick={() => setActiveCategoryId(category.id)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2.5 border-t border-slate-200 pt-6 mt-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-slate-500 border border-slate-100">
          <Utensils aria-hidden size={16} />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Menu items</h2>
        <Badge variant="secondary" className="ml-1 bg-slate-100 text-slate-700 hover:bg-slate-100 font-medium">
          {filteredItems.length}
        </Badge>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const isAdded = addedItemId === item.id;
            const hotel = hotelMap.get(item.hotel);
            
            return (
              <Card className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-sm transition-shadow hover:shadow-md" key={item.id}>
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                  {item.image_url ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url("${item.image_url}")` }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-300">
                      <ImageIcon aria-hidden size={48} strokeWidth={1} />
                    </div>
                  )}
                  {hotel && (
                    <div className="absolute left-3 top-3">
                      <Badge variant="secondary" className="bg-white/95 text-slate-700 shadow-sm backdrop-blur-md border border-slate-200 font-medium flex items-center gap-1.5">
                        <Building2 aria-hidden size={12} className="text-slate-400" />
                        {hotel.name}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-slate-900 line-clamp-1">{item.name}</h3>
                      {item.sku ? <p className="mt-1 text-xs text-slate-400">SKU: {item.sku}</p> : null}
                    </div>
                    <span className="shrink-0 rounded-lg bg-slate-50 px-2.5 py-1 text-sm font-bold text-slate-900 border border-slate-100">
                      {hotel?.currency} {Number(item.price).toLocaleString()}
                    </span>
                  </div>

                  {item.description ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
                      {item.description}
                    </p>
                  ) : null}

                  <div className="mt-4 mb-6 flex flex-wrap gap-2">
                    {item.prep_time_minutes ? (
                      <Badge variant="secondary" className="bg-slate-50 text-slate-600 hover:bg-slate-50 border border-slate-100 font-medium">
                        <Clock aria-hidden size={12} className="mr-1.5 text-slate-400" />
                        {item.prep_time_minutes} min
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-auto pt-1">
                    <Button
                      className={cn(
                        "w-full h-10 rounded-lg font-medium shadow-sm transition-all duration-300",
                        isAdded ? "bg-green-600 hover:bg-green-700" : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                      )}
                      disabled={!item.is_available}
                      onClick={() => handleAddToCart(item)}
                    >
                      {isAdded ? (
                        <>
                          <Check aria-hidden size={16} className="mr-2" />
                          Added to cart
                        </>
                      ) : !item.is_available ? (
                        "Out of stock"
                      ) : (
                        <>
                          <ShoppingCart aria-hidden size={16} className="mr-2" />
                          Add to cart
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
            <Search size={24} />
          </div>
          <p className="text-lg font-semibold text-slate-900">No items found</p>
          <p className="mt-1 text-sm text-slate-500">Try adjusting your search or category filter.</p>
        </Card>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// HELPER COMPONENTS & FUNCTIONS
// ----------------------------------------------------------------------

function CategoryTab({
  active,
  count,
  label,
  onClick
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "group flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      )}
      onClick={onClick}
      type="button"
    >
      {label}
      <span
        className={cn(
          "flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-bold transition-colors",
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function sortCategories(categories: MenuCategory[]) {
  return [...categories].sort((a, b) => {
    const orderA = a.sort_order ?? 999;
    const orderB = b.sort_order ?? 999;
    return orderA - orderB || a.name.localeCompare(b.name);
  });
}

function sortItems(items: MenuItem[]) {
  return [...items].sort((a, b) => {
    if (a.is_available === b.is_available) {
      return a.name.localeCompare(b.name);
    }
    return a.is_available ? -1 : 1;
  });
}
