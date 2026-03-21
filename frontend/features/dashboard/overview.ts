import type { Role } from "@/types/api";

type ApiEnvelope<T> = {
  status?: "success" | "error";
  data?: T | { data?: T };
};

type OrderSummary = {
  orderId: number;
  customerId: number;
  totalPrice: string | number;
  dueDate: string;
  orderStatus: string;
  isPaid: boolean;
  createdAt: string | null;
};

type CustomerSummary = {
  customerId: number;
  creditLimit: string | number;
};

type ProductSummary = {
  productId: number;
};

type OrderItemSummary = {
  orderItemId: number;
  deliveryStatus: string;
};

type ReorderNoticeSummary = {
  reorderNoticeId: number;
  isResolved: boolean;
};

type AuthMeResponse = {
  status: "success";
  data?: {
    customer?: CustomerSummary | null;
  };
};

export type DashboardOverview = {
  recentOrders: OrderSummary[];
  customerCredit: string;
  activeOrders: number;
  productsCount: number;
  pendingDeliveries: number;
  customersCount: number;
  lowStockNotices: number;
  totalOrders: number;
};

function asCollection<T>(payload: unknown): T[] {
  if (!payload || typeof payload !== "object") return [];

  const envelope = payload as ApiEnvelope<T[]>;
  const data = envelope.data;

  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.data)) return data.data;
  return [];
}

async function getCollection<T>(path: string) {
  const response = await fetch(`/api/proxy/${path}`, { cache: "no-store" });
  if (!response.ok) return [] as T[];

  const payload = await response.json();
  return asCollection<T>(payload);
}

async function getCustomerCredit() {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  if (!response.ok) return "0";

  const payload = (await response.json()) as AuthMeResponse;
  return String(payload.data?.customer?.creditLimit ?? "0");
}

function sortRecentOrders(orders: OrderSummary[]) {
  return [...orders]
    .sort((a, b) => {
      const first = Date.parse(a.createdAt ?? a.dueDate ?? "");
      const second = Date.parse(b.createdAt ?? b.dueDate ?? "");
      return second - first;
    })
    .slice(0, 5);
}

export async function getDashboardOverview(role: Role): Promise<DashboardOverview> {
  const [orders, products, orderItems, customers, reorderNotices, customerCredit] = await Promise.all([
    getCollection<OrderSummary>("orders"),
    role !== "customer" ? getCollection<ProductSummary>("products") : Promise.resolve([]),
    role === "supervisor" ? getCollection<OrderItemSummary>("order-items") : Promise.resolve([]),
    role === "admin" ? getCollection<CustomerSummary>("customers") : Promise.resolve([]),
    role === "admin" ? getCollection<ReorderNoticeSummary>("reorder-notices") : Promise.resolve([]),
    role === "customer" ? getCustomerCredit() : Promise.resolve("0"),
  ]);

  const activeOrders = orders.filter((order) => ["pending", "processing"].includes(order.orderStatus)).length;
  const pendingDeliveries = orderItems.filter((item) =>
    ["pending", "partial"].includes(item.deliveryStatus),
  ).length;
  const lowStockNotices = reorderNotices.filter((notice) => !notice.isResolved).length;

  return {
    recentOrders: sortRecentOrders(orders),
    customerCredit,
    activeOrders,
    productsCount: products.length,
    pendingDeliveries,
    customersCount: customers.length,
    lowStockNotices,
    totalOrders: orders.length,
  };
}
