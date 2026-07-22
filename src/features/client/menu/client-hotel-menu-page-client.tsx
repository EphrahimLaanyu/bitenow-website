"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock, ImageIcon, Search, ShoppingCart, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Hotel, MenuCategory, MenuItem } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/token-storage";
import { saveActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { addCartItem } from "@/features/client/cart/cart-storage";
import { getHotel } from "@/features/hotels/api";
import { listMenuCategories, listMenuItems } from "@/features/menu/api";
import TiltedCard from "@/components/ui/tilted-card";

export function ClientHotelMenuPageClient({ hotelId }: { hotelId: string }) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
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
          "The backend currently requires sign-in before it returns menus. Please sign in to browse this hotel menu until public menu endpoints are enabled."
        );
      }

      saveActiveHotelId(hotelId);
      const [hotelResponse, categoriesResponse, itemsResponse] = await Promise.all([
        getHotel(hotelId),
        listMenuCategories({ hotel: hotelId, page_size: 100 }),
        listMenuItems({ hotel: hotelId, page_size: 100 })
      ]);

      setHotel(hotelResponse);
      setCategories(sortCategories(categoriesResponse.results.filter((category) => category.is_active !== false)));
      setItems(sortItems(itemsResponse.results));
    } catch (menuError) {
      setError(getApiErrorMessage(menuError));
      setCategories([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = submittedSearch.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory = activeCategoryId === "all" || item.category === activeCategoryId;
      const matchesSearch =
        !normalizedSearch ||
        [item.name, item.description, item.sku]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategoryId, items, submittedSearch]);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search.trim());
  }

  function handleAddToCart(item: MenuItem) {
    addCartItem({
      currency: hotel?.currency,
      hotelId,
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
      <div className="space-y-6 md:space-y-8">
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
      <Card className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-red-800">{error}</p>
        {error.includes("requires sign-in") ? (
          <Link
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
            href={`/login?next=${encodeURIComponent(`/client/hotels/${hotelId}/menu`)}`}
          >
            Sign in to browse menu
          </Link>
        ) : null}
      </Card>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <Link 
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900" 
        href={`/client/hotels/${hotelId}`}
      >
        <ArrowLeft aria-hidden size={16} />
        Back to hotel
      </Link>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <Badge variant="outline" className="font-medium text-slate-600 border-slate-200">
            Hotel menu
          </Badge>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl lg:text-4xl">
            {hotel?.name ? `${hotel.name} Menu` : "Menu"}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-500">
            Browse available meals by category, price, preparation time, and availability.
          </p>
        </div>

        <form className="grid gap-3 sm:gap-4 sm:grid-cols-[1fr_auto]" onSubmit={handleSearch}>
          <Input
            className="h-10 border-slate-200 bg-white placeholder:text-slate-400 focus:border-[var(--accent)] shadow-sm"
            label="Search menu"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Burger, fries, drinks..."
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
          {filteredItems.map((item) => (
            <MenuItemCard
              added={addedItemId === item.id}
              category={item.category ? categoryById.get(item.category) : undefined}
              currency={hotel?.currency}
              item={item}
              key={item.id}
              onAdd={handleAddToCart}
            />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <Search className="mb-3 text-slate-300" size={32} />
          <p className="text-sm font-medium text-slate-500">No menu items matched this filter.</p>
        </Card>
      )}
    </div>
  );
}

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
      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-all ${
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${
        active ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"
      }`}>
        {count}
      </span>
    </button>
  );
}

function MenuItemCard({
  added,
  category,
  currency,
  item,
  onAdd
}: {
  added: boolean;
  category?: MenuCategory;
  currency?: string;
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}) {
  return (
    <Card className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-sm transition-shadow hover:shadow-md">
      {item.image_url ? (
        <div className="relative h-48 overflow-hidden border-b border-slate-100 bg-slate-100">
          <TiltedCard
            imageSrc={item.image_url}
            altText={item.name}
            captionText={item.name}
            containerHeight="100%"
            containerWidth="100%"
            imageHeight="100%"
            imageWidth="100%"
            rotateAmplitude={12}
            scaleOnHover={1.15}
            showMobileWarning={false}
            showTooltip={true}
          />
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center bg-slate-50 text-slate-300 border-b border-slate-100">
          <ImageIcon aria-hidden size={40} />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold tracking-tight text-slate-900 line-clamp-1">{item.name}</h3>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {category?.name ?? "Uncategorized"}
            </p>
          </div>
          <Badge 
            variant={item.is_available === false ? "destructive" : "secondary"}
            className={item.is_available === false ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}
          >
            {item.is_available === false ? "Unavailable" : "Available"}
          </Badge>
        </div>

        <p className="mt-4 line-clamp-3 min-h-[4rem] text-sm leading-relaxed text-slate-600">
          {item.description || "No description listed yet."}
        </p>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <p className="text-xl font-bold tracking-tight text-slate-900">{formatMoney(item.price, currency)}</p>
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
            <Clock aria-hidden size={16} className="text-slate-400" />
            {item.prep_time_minutes ?? 0} min
          </p>
        </div>

        <Button
          className={`mt-5 w-full h-11 rounded-lg font-medium shadow-sm transition-all ${
            added ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent" : ""
          }`}
          disabled={item.is_available === false}
          onClick={() => onAdd(item)}
          type="button"
          variant={added ? "primary" : "secondary"} 
        >
          {added ? <Check aria-hidden size={18} className="mr-2" /> : <ShoppingCart aria-hidden size={18} className="mr-2 text-slate-500" />}
          {added ? "Added to cart" : "Add to cart"}
        </Button> 
      </div>
    </Card>
  );
}

function sortCategories(categories: MenuCategory[]) {
  return [...categories].sort((first, second) => {
    const firstOrder = first.sort_order ?? 0;
    const secondOrder = second.sort_order ?? 0;
    if (firstOrder !== secondOrder) return firstOrder - secondOrder;
    return first.name.localeCompare(second.name);
  });
}

function sortItems(items: MenuItem[]) {
  return [...items].sort((first, second) => first.name.localeCompare(second.name));
}

function formatMoney(value: string | number | undefined, currency = "KES") {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-KE", {
    currency,
    style: "currency"
  }).format(Number.isFinite(amount) ? amount : 0);
}