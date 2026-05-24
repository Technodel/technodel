import { create } from "zustand";
import { apiPath } from "@/lib/api-path";

interface WishlistProduct {
  id: string;
  slug: string;
  title: string;
  displayPrice: number;
  comparePrice: number | null;
  images: string;
  brand: string | null;
  stock: number;
  category: { slug: string } | null;
}

interface WishlistItem {
  id: string;
  productId: string;
  addedAt: string;
  product: WishlistProduct;
}

interface WishlistStore {
  items: WishlistItem[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (productId: string) => Promise<{ ok: boolean; error?: string }>;
  remove: (productId: string) => Promise<{ ok: boolean; error?: string }>;
  isInWishlist: (productId: string) => boolean;
  count: () => number;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  loading: false,

  fetch: async () => {
    try {
      set({ loading: true });
      const res = await fetch(apiPath("/api/wishlist"));
      if (res.ok) {
        const data = await res.json();
        set({ items: data.items || [] });
      }
    } catch {}
    finally { set({ loading: false }); }
  },

  add: async (productId) => {
    try {
      const res = await fetch(apiPath("/api/wishlist"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        const data = await res.json();
        return { ok: false, error: data.error || "Failed to add" };
      }
      const data = await res.json();
      if (data.item) {
        set((s) => ({ items: [data.item, ...s.items] }));
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error" };
    }
  },

  remove: async (productId) => {
    try {
      const res = await fetch(apiPath("/api/wishlist"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) return { ok: false, error: "Failed to remove" };
      set((s) => ({
        items: s.items.filter((i) => i.productId !== productId),
      }));
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error" };
    }
  },

  isInWishlist: (productId) => {
    return get().items.some((i) => i.productId === productId);
  },

  count: () => get().items.length,
}));
