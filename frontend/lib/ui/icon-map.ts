import {
  BadgeDollarSign,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  PlusCircle,
  ShoppingCart,
  TriangleAlert,
  Truck,
  UserCircle2,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavIconKey =
  | "dashboard"
  | "products"
  | "orders"
  | "orderItems"
  | "customers"
  | "reorderNotices"
  | "redeemCodes"
  | "profile";

export type ActionIconKey = "create" | "checkout" | "logout";

export type StatusIconKey = "success" | "warning" | "pending";

export const NAV_ICON_MAP: Record<NavIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  products: Package,
  orders: ShoppingCart,
  orderItems: Truck,
  customers: Users,
  reorderNotices: TriangleAlert,
  redeemCodes: BadgeDollarSign,
  profile: UserCircle2,
};

export const ACTION_ICON_MAP: Record<ActionIconKey, LucideIcon> = {
  create: PlusCircle,
  checkout: ClipboardList,
  logout: LogOut,
};

export const STATUS_ICON_MAP: Record<StatusIconKey, LucideIcon> = {
  success: CircleCheck,
  warning: CircleAlert,
  pending: ClipboardList,
};
