import { create } from "zustand";
import { persist } from "zustand/middleware";

type Currency = "USD" | "LBP";

// LBP rate — adjust as needed
const LBP_RATE = 89500;

interface CurrencyStore {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (usdPrice: number) => string;
  convert: (usdPrice: number) => number;
  rate: number;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: "USD",
      rate: LBP_RATE,
      setCurrency: (c) => set({ currency: c }),
      convert: (usdPrice) => {
        const { currency, rate } = get();
        return currency === "LBP" ? usdPrice * rate : usdPrice;
      },
      format: (usdPrice) => {
        const { currency, rate } = get();
        if (currency === "LBP") {
          const lbp = Math.round(usdPrice * rate);
          return `${lbp.toLocaleString("en-US")} LBP`;
        }
        return `$${Math.round(usdPrice).toLocaleString("en-US")}`;
      },
    }),
    { name: "tn-currency" }
  )
);
