"use client";
import {
  Smartphone, Laptop, Tablet, Gamepad2, Headphones, Plug, Wifi, Camera, Printer,
  Home, Watch, HardDrive, Truck, BadgeCheck, BadgeDollarSign, RefreshCcw, Sparkles,
  Package, Star, ShoppingBag, Flame, ShoppingCart, User, Phone, Mail, MapPin,
  MessageSquare, Heart, Settings, Users, Search, Wrench, Folder, Image, Bitcoin,
  CreditCard, Globe, Menu, X, ChevronRight, ChevronLeft, ChevronDown, Plus, Minus,
  Bell, Clock, Eye, Sun, Moon, Gift, Crown, Zap, Award, Flag, Hash, Link, Lock,
  LogOut, MoreHorizontal, MoreVertical, Trash2, Edit, Copy, Clipboard, Download,
  Upload, File, PhoneCall, Banknote, Coins, Gem, Wallet, Verified, Pin, Map,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ExternalLink, Loader, AlertCircle,
  Check, Circle, Info, Briefcase,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties, JSX } from "react";

// ─── CUSTOM SVG ICONS (not in lucide) ────────────────────────────────────────

function KeyIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5L21 2" />
    </svg>
  );
}

function MusicIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMOJI → LUCIDE MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const EMOJI_MAP: Record<string, LucideIcon | ((props: { size?: number }) => JSX.Element)> = {
  // Categories
  "📱": Smartphone,
  "💻": Laptop,
  "📲": Tablet,
  "🎮": Gamepad2,
  "🎧": Headphones,
  "🔌": Plug,
  "📡": Wifi,
  "📷": Camera,
  "🖨️": Printer,
  "🏠": Home,
  "⌚": Watch,
  "💾": HardDrive,

  // Features / Promises
  "🚚": Truck,
  "✅": BadgeCheck,
  "💰": BadgeDollarSign,
  "🔄": RefreshCcw,
  "🆕": Sparkles,
  "📦": Package,
  "⭐": Star,
  "🎉": Sparkles,

  // Navigation
  "🛍️": ShoppingBag,
  "🔥": Flame,
  "🛒": ShoppingCart,
  "👤": User,

  // Contact
  "📍": MapPin,
  "📞": Phone,
  "💬": MessageSquare,
  "✉️": Mail,

  // Admin
  "🗂️": Folder,
  "🔍": Search,
  "🛠️": Wrench,
  "🖼️": Image,
  "👥": Users,
  "⚙️": Settings,
  "🔑": KeyIcon,
  "➕": Plus,

  // Payment
  "💵": Banknote,
  "🪙": Gem,
  "💳": CreditCard,

  // Social (custom SVGs)
  "📘": Globe,
  "📸": Camera,
  "🐦": Globe,
  "🎵": MusicIcon,
  "💼": Briefcase,

  // Misc
  "🌌": Sparkles,
};

// ═══════════════════════════════════════════════════════════════════════════════
// LUCIDE NAME LOOKUP (for direct `name` prop)
// ═══════════════════════════════════════════════════════════════════════════════

const LUCIDE_LOOKUP: Record<string, LucideIcon> = {
  smartphone: Smartphone, laptop: Laptop, tablet: Tablet, gamepad: Gamepad2,
  headphones: Headphones, plug: Plug, wifi: Wifi, camera: Camera, printer: Printer,
  home: Home, watch: Watch, "hard-drive": HardDrive, truck: Truck,
  "badge-check": BadgeCheck, "badge-dollar-sign": BadgeDollarSign,
  "refresh-ccw": RefreshCcw, sparkles: Sparkles, package: Package, star: Star,
  "shopping-bag": ShoppingBag, flame: Flame, "shopping-cart": ShoppingCart,
  user: User, phone: Phone, mail: Mail, "map-pin": MapPin,
  "message-square": MessageSquare, heart: Heart, settings: Settings, users: Users,
  search: Search, wrench: Wrench, folder: Folder, image: Image, bitcoin: Bitcoin,
  "credit-card": CreditCard, globe: Globe, menu: Menu, x: X,
  "chevron-right": ChevronRight, "chevron-left": ChevronLeft,
  "chevron-down": ChevronDown, plus: Plus, minus: Minus, bell: Bell, clock: Clock,
  eye: Eye, sun: Sun, moon: Moon, gift: Gift, crown: Crown, zap: Zap, award: Award,
  flag: Flag, hash: Hash, link: Link, lock: Lock, "log-out": LogOut,
  "more-horizontal": MoreHorizontal, "more-vertical": MoreVertical,
  trash: Trash2, edit: Edit, copy: Copy, clipboard: Clipboard,
  download: Download, upload: Upload, file: File, "phone-call": PhoneCall,
  banknote: Banknote, coins: Coins, gem: Gem, wallet: Wallet, verified: Verified,
  pin: Pin, map: Map, "arrow-left": ArrowLeft, "arrow-right": ArrowRight,
  "arrow-up": ArrowUp, "arrow-down": ArrowDown, "external-link": ExternalLink,
  loader: Loader, "alert-circle": AlertCircle, check: Check, circle: Circle,
  info: Info, briefcase: Briefcase,
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════════

export interface IconProps {
  /** Direct lucide icon name (e.g. "smartphone", "truck") */
  name?: string;
  /** Emoji character to map to a lucide icon (e.g. "📱") */
  emoji?: string;
  /** Icon size in px (default: 24) */
  size?: number;
  className?: string;
  style?: CSSProperties;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ICON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function Icon({ name, emoji, size = 24, className, style }: IconProps) {
  const iconStyle: CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
    ...(style || {}),
  };

  let IconComp: LucideIcon | ((props: { size?: number }) => JSX.Element) | null = null;

  if (name) {
    IconComp = LUCIDE_LOOKUP[name.toLowerCase()] ?? null;
  } else if (emoji) {
    IconComp = EMOJI_MAP[emoji] ?? null;
  }

  // Render lucide icon
  if (IconComp) {
    return <IconComp className={className} style={iconStyle} aria-hidden="true" />;
  }

  // Fallback: render emoji text
  return (
    <span
      className={className}
      style={{ ...iconStyle, fontSize: size, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      aria-hidden="true"
    >
      {emoji || name || "❓"}
    </span>
  );
}
