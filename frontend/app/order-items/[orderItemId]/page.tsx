"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/feedback/loading-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  fetchOrderItem,
  formatCurrency,
  formatDate,
  updateOrderItemDeliveryStatus,
} from "@/features/customer/api";
import { ArrowLeft, Box, Check, Clock, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrderItemDetailPage() {
  const params = useParams<{ orderItemId: string }>();
  const queryClient = useQueryClient();
  const orderItemId = Number.parseInt(params.orderItemId, 10);

  const itemQuery = useQuery({
    queryKey: ["supervisor", "order-item", orderItemId],
    queryFn: () => fetchOrderItem(orderItemId),
    enabled: Number.isFinite(orderItemId),
  });

  const updateMutation = useMutation({
    mutationFn: (deliveredQuantity: number) =>
      updateOrderItemDeliveryStatus(orderItemId, deliveredQuantity),
    onSuccess: async () => {
      toast.success("Delivery status updated");
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
          queryKey: ["customer", "order", itemQuery.data?.orderId],
        }),
      ]);
    },
    onError: (error) => {
      toast.error("Failed to update status", {
        description: (error as Error).message,
      });
    },
  });

  const item = itemQuery.data;
  const isDelivered = item?.deliveryStatus === "delivered";
  const remainingQuantity = item ? Math.max(item.quantity - item.deliveredQuantity, 0) : 0;
  const nextDeliveredQuantity = item ? Math.min(item.deliveredQuantity + 1, item.quantity) : 0;

  if (itemQuery.isLoading) {
    return (
      <RequireAuth>
        <AppShell>
          <LoadingState />
        </AppShell>
      </RequireAuth>
    );
  }

  if (itemQuery.isError) {
    return (
      <RequireAuth>
        <AppShell>
          <Card className="border-destructive/50 max-w-2xl mx-auto mt-8">
            <CardHeader>
              <CardTitle className="text-destructive">Unable to load order item</CardTitle>
              <CardDescription>
                {(itemQuery.error as Error).message}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/order-items">Return to Items</Link>
              </Button>
            </CardFooter>
          </Card>
        </AppShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <AppShell>
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
          <header className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8 -ml-2">
              <Link href="/order-items">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                Item Details
              </h2>
            </div>
          </header>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    {item?.product?.name ?? `Product #${item?.productId}`}
                  </CardTitle>
                  <CardDescription>
                    Order Item #{item?.orderItemId} • From Order #{item?.orderId}
                  </CardDescription>
                </div>
                <Badge 
                  variant={isDelivered ? "default" : "outline"}
                  className={cn(
                    "gap-1 pl-1.5 pr-2.5 py-1",
                    isDelivered && "bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white",
                    item?.deliveryStatus === "partial" && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                  )}
                >
                  {isDelivered ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  <span className="capitalize">{item?.deliveryStatus}</span>
                </Badge>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="grid gap-6 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground block mb-1">Quantity</span>
                  <span className="text-2xl font-bold">{item?.quantity}</span>
                </div>
                <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground block mb-1">Line Total</span>
                  <span className="text-2xl font-bold">{formatCurrency(item?.itemTotalPrice ?? 0)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground block mb-1">Delivered</span>
                  <span className="text-2xl font-bold">{item?.deliveredQuantity ?? 0}</span>
                </div>
                <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground block mb-1">Remaining</span>
                  <span className="text-2xl font-bold">{remainingQuantity}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  Fulfillment
                </h3>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">Delivery Status</p>
                    <p className="text-sm text-muted-foreground">
                      {isDelivered
                        ? "Item has been fully delivered to the customer."
                        : item?.deliveryStatus === "partial"
                          ? "Item is partially delivered."
                          : "Item is pending delivery."}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={updateMutation.isPending || isDelivered}
                    onClick={() => updateMutation.mutate(nextDeliveredQuantity)}
                    variant={isDelivered ? "secondary" : "default"}
                  >
                    {updateMutation.isPending
                      ? "Updating..."
                      : isDelivered
                        ? "Delivered"
                        : "Deliver +1"}
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground pt-2">
                  Created on {formatDate(item?.createdAt ?? null)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
