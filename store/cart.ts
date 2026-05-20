import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
  variantId?: string;
  variantLabel?: string;
}

interface CartStore {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: string, variantId?: string) => void;
  update: (productId: string, qty: number, variantId?: string) => void;
  clear: () => void;
  count: () => number;
  total: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const existing = get().items.find(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );
        if (existing) {
          set({ items: get().items.map((i) =>
            i.productId === item.productId && i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          )});
        } else {
          set({ items: [...get().items, item] });
        }
      },
      remove: (productId, variantId) =>
        set({ items: get().items.filter((i) => !(i.productId === productId && i.variantId === variantId)) }),
      update: (productId, qty, variantId) =>
        set({ items: get().items.map((i) =>
          i.productId === productId && i.variantId === variantId ? { ...i, quantity: qty } : i
        )}),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
      total: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
    }),
    { name: "tn-cart" }
  )
);
