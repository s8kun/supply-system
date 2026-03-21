import type { UserSummary } from "@/types/api";

type ApiEnvelope<T> = {
  status?: "success" | "error";
  data?: T | { data?: T };
  message?: string;
  errors?: Record<string, string[]>;
};

export type CustomerProfile = {
  customerId: number;
  firstName: string;
  middleName: string;
  lastName: string;
  address: {
    houseNo: string;
    streetName: string;
    city: string;
    zipCode: string;
  };
  phone: string;
  creditLimit: number | string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ProductItem = {
  productId: number;
  name: string;
  description: string;
  costPrice: number | string;
  sellPrice: number | string;
  currentQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  images: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type OrderItem = {
  orderItemId: number;
  orderId: number;
  productId: number;
  quantity: number;
  deliveredQuantity: number;
  itemTotalPrice: number | string;
  deliveryStatus: string;
  createdAt: string | null;
  updatedAt: string | null;
  product?: ProductItem;
};

export type OrderItemInput = {
  productId: number;
  quantity: number;
};

export type OrderRecord = {
  orderId: number;
  customerId: number;
  totalPrice: number | string;
  dueDate: string;
  orderStatus: string;
  isPaid: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  customer?: CustomerProfile;
  items?: OrderItem[];
};

export type AuthMePayload = {
  user: UserSummary;
  customer: CustomerProfile | null;
};

export type CreateOrderInput = {
  customerId: number;
  dueDate: string;
  items: OrderItemInput[];
};

export type CreateProductInput = {
  name: string;
  description: string;
  costPrice: number;
  sellPrice: number;
  currentQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  images?: File[];
  onUploadProgress?: (percent: number) => void;
};

export type CreateRedeemCodeInput = {
  amount: number;
  code?: string;
};

export type ReorderNotice = {
  reorderNoticeId: number;
  productId: number;
  productName: string;
  reorderQuantity: number;
  currentQuantity: number;
  isResolved: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateCustomerInput = {
  email: string;
  password: string;
  passwordConfirmation: string;
  firstName: string;
  middleName: string;
  lastName: string;
  houseNo: string;
  streetName: string;
  city: string;
  zipCode: string;
  phone: string;
  creditLimit: number;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export type UpdateProductInput = Partial<{
  name: string;
  description: string;
  costPrice: number;
  sellPrice: number;
  currentQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
}>;

export type UpdateOrderInput = Partial<{
  dueDate: string;
}>;

async function readPayload<T>(response: Response): Promise<ApiEnvelope<T> | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return (await response.json()) as ApiEnvelope<T>;
}

function getData<T>(payload: ApiEnvelope<T> | null): T | null {
  if (!payload) return null;

  if (payload.data === undefined) {
    return null;
  }

  const raw = payload.data as unknown;

  if (raw && typeof raw === "object" && "data" in (raw as Record<string, unknown>)) {
    const nested = raw as { data?: T };
    return nested.data ?? null;
  }

  return raw as T;
}

function getCollection<T>(payload: ApiEnvelope<T[] | { data: T[] }> | null): T[] {
  const data = getData<T[] | { data: T[] }>(payload);
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.data ?? [];
}

function extractErrorMessage(payload: ApiEnvelope<unknown> | null, fallback: string) {
  if (payload?.message) return payload.message;

  const firstFieldError = payload?.errors ? Object.values(payload.errors)[0]?.[0] : null;
  if (firstFieldError) return firstFieldError;

  return fallback;
}

function asMoney(value: number | string) {
  const numeric = typeof value === "string" ? Number.parseFloat(value) : value;
  if (!Number.isFinite(numeric)) return "0.00";
  return numeric.toFixed(2);
}

export function formatCurrency(value: number | string) {
  return `$${asMoney(value)}`;
}

export function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export async function fetchProducts() {
  const response = await fetch("/api/proxy/products", { cache: "no-store" });
  const payload = await readPayload<ProductItem[] | { data: ProductItem[] }>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to load products"));
  }

  return getCollection<ProductItem>(payload);
}

export async function fetchProduct(productId: number) {
  const response = await fetch(`/api/proxy/products/${productId}`, { cache: "no-store" });
  const payload = await readPayload<ProductItem>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to load product"));
  }

  const product = getData<ProductItem>(payload);
  if (!product) {
    throw new Error("Product data is missing");
  }

  return product;
}

export async function fetchOrders() {
  const response = await fetch("/api/proxy/orders", { cache: "no-store" });
  const payload = await readPayload<OrderRecord[] | { data: OrderRecord[] }>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to load orders"));
  }

  return getCollection<OrderRecord>(payload);
}

export async function fetchOrder(orderId: number) {
  const response = await fetch(`/api/proxy/orders/${orderId}`, { cache: "no-store" });
  const payload = await readPayload<OrderRecord>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to load order"));
  }

  const order = getData<OrderRecord>(payload);
  if (!order) {
    throw new Error("Order data is missing");
  }

  return order;
}

export async function createOrder(input: CreateOrderInput) {
  const response = await fetch("/api/proxy/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = await readPayload<OrderRecord>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to create order"));
  }

  const order = getData<OrderRecord>(payload);
  if (!order) {
    throw new Error("Order creation response is missing data");
  }

  return order;
}

export async function cancelOrder(orderId: number) {
  const response = await fetch(`/api/proxy/orders/${orderId}/cancel`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await readPayload<unknown>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to cancel order"));
  }
}

export async function redeemCustomerCode(input: { customerId: number; code: string }) {
  const response = await fetch("/api/proxy/redeem-codes/redeem", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = await readPayload<{ code: string; amount: string | number }>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to redeem code"));
  }

  const redemption = getData<{ code: string; amount: string | number }>(payload);
  if (!redemption) {
    throw new Error("Redemption response is missing data");
  }

  return redemption;
}

export async function fetchAuthProfile() {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  const payload = await readPayload<AuthMePayload>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to load profile"));
  }

  const profile = getData<AuthMePayload>(payload);
  if (!profile) {
    throw new Error("Profile response is missing data");
  }

  return profile;
}

export async function createProduct(input: CreateProductInput) {
  const { onUploadProgress } = input;
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("description", input.description);
  formData.append("costPrice", String(input.costPrice));
  formData.append("sellPrice", String(input.sellPrice));
  formData.append("currentQuantity", String(input.currentQuantity));
  formData.append("reorderLevel", String(input.reorderLevel));
  formData.append("reorderQuantity", String(input.reorderQuantity));

  for (const file of input.images ?? []) {
    formData.append("images[]", file);
  }

  if (onUploadProgress) {
    const payload = await new Promise<ApiEnvelope<ProductItem> | null>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", "/api/proxy/products");
      request.setRequestHeader("Accept", "application/json");

      request.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        onUploadProgress(percent);
      };

      request.onload = () => {
        const contentType = request.getResponseHeader("content-type") ?? "";
        if (!contentType.includes("application/json") || !request.responseText) {
          resolve(null);
          return;
        }

        try {
          resolve(JSON.parse(request.responseText) as ApiEnvelope<ProductItem>);
        } catch {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(new Error("Unable to create product"));
      };

      request.send(formData);
    });

    // On XHR upload path, infer success from JSON status if present.
    if (!payload || payload.status === "error") {
      throw new Error(extractErrorMessage(payload, "Unable to create product"));
    }

    const product = getData<ProductItem>(payload);
    if (!product) {
      throw new Error("Product creation response is missing data");
    }

    return product;
  }

  const response = await fetch("/api/proxy/products", {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  const payload = await readPayload<ProductItem>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to create product"));
  }

  const product = getData<ProductItem>(payload);
  if (!product) {
    throw new Error("Product creation response is missing data");
  }

  return product;
}

export async function fetchOrderItems() {
  const response = await fetch("/api/proxy/order-items", { cache: "no-store" });
  const payload = await readPayload<OrderItem[] | { data: OrderItem[] }>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to load order items"));
  }

  return getCollection<OrderItem>(payload);
}

export async function fetchOrderItem(orderItemId: number) {
  const response = await fetch(`/api/proxy/order-items/${orderItemId}`, {
    cache: "no-store",
  });
  const payload = await readPayload<OrderItem>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to load order item"));
  }

  const item = getData<OrderItem>(payload);
  if (!item) {
    throw new Error("Order item data is missing");
  }

  return item;
}

export async function updateOrderItemDeliveryStatus(
  orderItemId: number,
  deliveredQuantity: number,
) {
  const response = await fetch(`/api/proxy/order-items/${orderItemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ deliveredQuantity }),
  });

  const payload = await readPayload<OrderItem>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to update order item"));
  }

  const item = getData<OrderItem>(payload);
  if (!item) {
    throw new Error("Order item update response is missing data");
  }

  return item;
}

export async function markOrderPaid(orderId: number) {
  const response = await fetch(`/api/proxy/orders/${orderId}/mark-paid`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ isPaid: true }),
  });

  const payload = await readPayload<OrderRecord>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to mark order as paid"));
  }

  const order = getData<OrderRecord>(payload);
  if (!order) {
    throw new Error("Order payment response is missing data");
  }

  return order;
}

export async function createRedeemCode(input: CreateRedeemCodeInput) {
  const response = await fetch("/api/proxy/redeem-codes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = await readPayload<{ code: string; amount: number | string }>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to create redeem code"));
  }

  const redeemCode = getData<{ code: string; amount: number | string }>(payload);
  if (!redeemCode) {
    throw new Error("Redeem code response is missing data");
  }

  return redeemCode;
}

export async function fetchCustomers() {
  const response = await fetch("/api/proxy/customers", { cache: "no-store" });
  const payload = await readPayload<CustomerProfile[] | { data: CustomerProfile[] }>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to load customers"));
  }

  return getCollection<CustomerProfile>(payload);
}

export async function fetchCustomer(customerId: number) {
  const response = await fetch(`/api/proxy/customers/${customerId}`, { cache: "no-store" });
  const payload = await readPayload<CustomerProfile>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to load customer"));
  }

  const customer = getData<CustomerProfile>(payload);
  if (!customer) {
    throw new Error("Customer data is missing");
  }

  return customer;
}

export async function createCustomer(input: CreateCustomerInput) {
  const accountName = `${input.firstName} ${input.lastName}`.trim();
  const response = await fetch("/api/proxy/customers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      ...input,
      name: accountName,
    }),
  });

  const payload = await readPayload<CustomerProfile>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to create customer"));
  }

  const customer = getData<CustomerProfile>(payload);
  if (!customer) {
    throw new Error("Customer creation response is missing data");
  }

  return customer;
}

export async function updateCustomer(customerId: number, input: UpdateCustomerInput) {
  const response = await fetch(`/api/proxy/customers/${customerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = await readPayload<CustomerProfile>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to update customer"));
  }

  const customer = getData<CustomerProfile>(payload);
  if (!customer) {
    throw new Error("Customer update response is missing data");
  }

  return customer;
}

export async function deleteCustomer(customerId: number) {
  const response = await fetch(`/api/proxy/customers/${customerId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await readPayload<unknown>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to delete customer"));
  }
}

export async function updateProduct(productId: number, input: UpdateProductInput) {
  const response = await fetch(`/api/proxy/products/${productId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = await readPayload<ProductItem>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to update product"));
  }

  const product = getData<ProductItem>(payload);
  if (!product) {
    throw new Error("Product update response is missing data");
  }

  return product;
}

export async function deleteProduct(productId: number) {
  const response = await fetch(`/api/proxy/products/${productId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await readPayload<unknown>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to delete product"));
  }
}

export async function updateOrder(orderId: number, input: UpdateOrderInput) {
  const response = await fetch(`/api/proxy/orders/${orderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = await readPayload<OrderRecord>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to update order"));
  }

  const order = getData<OrderRecord>(payload);
  if (!order) {
    throw new Error("Order update response is missing data");
  }

  return order;
}

export async function deleteOrder(orderId: number) {
  const response = await fetch(`/api/proxy/orders/${orderId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await readPayload<unknown>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to delete order"));
  }
}

export async function fetchReorderNotices() {
  const response = await fetch("/api/proxy/reorder-notices", { cache: "no-store" });
  const payload = await readPayload<ReorderNotice[] | { data: ReorderNotice[] }>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to load reorder notices"));
  }

  return getCollection<ReorderNotice>(payload);
}

export async function fetchReorderNotice(reorderNoticeId: number) {
  const response = await fetch(`/api/proxy/reorder-notices/${reorderNoticeId}`, {
    cache: "no-store",
  });
  const payload = await readPayload<ReorderNotice>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Unable to load reorder notice"));
  }

  const notice = getData<ReorderNotice>(payload);
  if (!notice) {
    throw new Error("Reorder notice data is missing");
  }

  return notice;
}
