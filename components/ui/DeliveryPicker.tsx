"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiPath } from "@/lib/api-path";

interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  minOrder: number;
  freeAbove: number | null;
  estimateDays: string;
  isActive: boolean;
}

interface Props {
  subtotal: number;
  onDeliveryChange: (fee: number, zoneName: string) => void;
}

export default function DeliveryPicker({ subtotal, onDeliveryChange }: Props) {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(apiPath("/api/delivery"))
      .then((r) => r.json())
      .then((data) => {
        const active = (data.zones || []).filter((z: DeliveryZone) => z.isActive);
        setZones(active);
        if (active.length > 0) {
          setSelectedId(active[0].id);
          onDeliveryChange(
            subtotal >= (active[0].freeAbove || Infinity) ? 0 : active[0].fee,
            active[0].name
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = zones.find((z) => z.id === selectedId);
  const deliveryFee = selected
    ? subtotal >= (selected.freeAbove || Infinity)
      ? 0
      : selected.fee
    : 0;

  function handleSelect(id: string) {
    const zone = zones.find((z) => z.id === id);
    if (!zone) return;
    setSelectedId(id);
    const fee = subtotal >= (zone.freeAbove || Infinity) ? 0 : zone.fee;
    onDeliveryChange(fee, zone.name);
  }

  if (loading) {
    return (
      <div className="skeleton" style={{ height: 44, borderRadius: "var(--r-sm)" }} />
    );
  }

  if (zones.length === 0) {
    return (
      <div style={{ fontSize: 13, color: "var(--c-muted)", padding: "8px 0" }}>
        📍 Standard delivery — $2.50 (1-3 days)
      </div>
    );
  }

  return (
    <div>
      <motion.button
        onClick={() => setExpanded(!expanded)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "10px 14px",
          background: "var(--c-surface)", border: "1px solid var(--c-border)",
          borderRadius: "var(--r-sm)", cursor: "pointer", color: "var(--c-text)",
          fontSize: 13, fontWeight: 500,
          transition: "border-color 0.2s",
        }}
      >
        <span>
          📍 {selected?.name || "Select region"} —
          {" "}{deliveryFee === 0
            ? <span style={{ color: "#00e676", fontWeight: 700 }}>FREE</span>
            : <span>${deliveryFee.toFixed(0)}</span>
          }
          {" "}· {selected?.estimateDays || "1-3"} days
        </span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              marginTop: 4, padding: 4,
              background: "var(--c-surface)", border: "1px solid var(--c-border)",
              borderRadius: "var(--r-sm)", display: "flex", flexDirection: "column", gap: 2,
            }}>
              {zones.map((zone) => {
                const zFee = subtotal >= (zone.freeAbove || Infinity) ? 0 : zone.fee;
                const isSelected = zone.id === selectedId;
                return (
                  <motion.button
                    key={zone.id}
                    whileHover={{ x: 2 }}
                    onClick={() => { handleSelect(zone.id); setExpanded(false); }}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 12px", borderRadius: "var(--r-sm)",
                      background: isSelected ? "rgba(0,200,255,0.08)" : "transparent",
                      border: isSelected ? "1px solid rgba(0,200,255,0.3)" : "1px solid transparent",
                      cursor: "pointer", color: "var(--c-text)", fontSize: 13,
                      transition: "all 0.15s", textAlign: "left", width: "100%",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{zone.name}</div>
                      <div style={{ fontSize: 11, color: "var(--c-muted)" }}>
                        {zone.estimateDays} days
                        {zone.freeAbove && subtotal < zone.freeAbove
                          ? ` · Free above $${zone.freeAbove.toFixed(0)}`
                          : ""}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: zFee === 0 ? "#00e676" : "var(--c-accent)" }}>
                      {zFee === 0 ? "FREE" : `$${zFee.toFixed(0)}`}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
