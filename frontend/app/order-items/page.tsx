"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/feedback/loading-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  fetchAuthProfile,
  fetchOrderItems,
  formatCurrency,
  formatDate,
  updateOrderItemDeliveryStatus,
} from "@/features/customer/api";
import { cn } from "@/lib/utils";
import { ArrowRight, Package } from "lucide-react";

export default function OrderItemsPage() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["customer", "profile"],
    queryFn: fetchAuthProfile,
  });

  const orderItemsQuery = useQuery({
    queryKey: ["supervisor", "order-items"],
    queryFn: fetchOrderItems,
    staleTime: 15_000,
  });

  const deliverMutation = useMutation({
    mutationFn: async (payload: { orderItemId: number; orderId: number }) => {
      const item = items.find((entry) => entry.orderItemId === payload.orderItemId);
      if (!item) {
        throw new Error("Order item data is missing");
      }
      await updateOrderItemDeliveryStatus(payload.orderItemId, item.quantity);
      return payload;
    },
    onSuccess: async ({ orderItemId, orderId }) => {
      toast.success("Item marked as delivered");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["supervisor", "order-items"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["supervisor", "order-item", orderItemId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["customer", "orders"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["customer", "order", orderId],
        }),
      ]);
    },
    onError: (error) => {
      toast.error("Failed to update delivery status", {
        description: (error as Error).message,
      });
    },
  });

  const items = [...(orderItemsQuery.data ?? [])].sort((a, b) => {
    const first = Date.parse(a.createdAt ?? "");
    const second = Date.parse(b.createdAt ?? "");
    return second - first;
  });

  const role = profileQuery.data?.user.role;
  const canManageDelivery = role === "admin" || role === "supervisor";

  return (
    <RequireAuth>
      <AppShell>
        <div className="flex flex-col gap-6">
          <header className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Order Items</h2>
            <p className="text-sm text-muted-foreground">
              Monitor delivery states and open items for detailed updates.
            </p>
          </header>

          <Separator />

          {orderItemsQuery.isLoading ? (
            <LoadingState />
          ) : orderItemsQuery.isError ? (
            <Card>
              <CardHeader>
                <CardTitle>Unable to load order items</CardTitle>
                <CardDescription>
                  {(orderItemsQuery.error as Error).message}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : items.length === 0 ? (
            <EmptyState
              title="No order items found"
              description="Order items will appear here after orders are placed."
            />
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>Delivery Queue</CardTitle>
                    <CardDescription>
                      Confirm delivery and trigger automatic stock and order-status updates.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Item #</TableHead>
                      <TableHead>Order #</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Delivery Status</TableHead>
                      <TableHead className="text-right">Delivered</TableHead>
                      <TableHead className="text-right">Line Total</TableHead>
                      <TableHead className="hidden md:table-cell">Created</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.orderItemId}>
                        <TableCell className="font-medium pl-6">
                          #{item.orderItemId}
                        </TableCell>
                        <TableCell className="text-muted-foreground">#{item.orderId}</TableCell>
                        <TableCell className="font-medium">
                          {item.product?.name ?? `Product #${item.productId}`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize",
                              item.deliveryStatus === "delivered" && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
                              item.deliveryStatus === "partial" && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
                              item.deliveryStatus === "pending" && "text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800",
                            )}
                          >
                            {item.deliveryStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.deliveredQuantity}/{item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.itemTotalPrice)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            {canManageDelivery && (
                              <Button
                                size="sm"
                                variant={item.deliveryStatus === "delivered" ? "secondary" : "default"}
                                disabled={
                                  item.deliveryStatus === "delivered" ||
                                  (deliverMutation.isPending &&
                                    deliverMutation.variables?.orderItemId === item.orderItemId)
                                }
                                onClick={() =>
                                  deliverMutation.mutate({
                                    orderItemId: item.orderItemId,
                                    orderId: item.orderId,
                                  })
                                }
                              >
                                {deliverMutation.isPending &&
                                deliverMutation.variables?.orderItemId === item.orderItemId
                                  ? "Updating..."
                                  : item.deliveryStatus === "delivered"
                                    ? "Delivered"
                                    : "Mark Delivered"}
                              </Button>
                            )}
                            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Link href={`/order-items/${item.orderItemId}`}>
                                <ArrowRight className="h-4 w-4" />
                                <span className="sr-only">Open</span>
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
