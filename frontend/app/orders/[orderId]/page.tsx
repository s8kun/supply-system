"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/feedback/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  cancelOrder,
  deleteOrder,
  fetchAuthProfile,
  fetchOrder,
  formatCurrency,
  formatDate,
  markOrderPaid,
  updateOrderItemDeliveryStatus,
  updateOrder,
} from "@/features/customer/api";
import { ArrowLeft, Calendar, CreditCard, RefreshCw, Trash2, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = Number.parseInt(params.orderId, 10);

  const orderQuery = useQuery({
    queryKey: ["customer", "order", orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: Number.isFinite(orderId),
  });

  const profileQuery = useQuery({
    queryKey: ["customer", "profile"],
    queryFn: fetchAuthProfile,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: async () => {
      toast.success("Order cancelled");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer", "orders"] }),
        queryClient.invalidateQueries({
          queryKey: ["customer", "order", orderId],
        }),
      ]);
    },
    onError: (error) => {
      toast.error("Failed to cancel order", {
        description: (error as Error).message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { dueDate: string }) => updateOrder(orderId, payload),
    onSuccess: async () => {
      toast.success("Order updated");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer", "orders"] }),
        queryClient.invalidateQueries({
          queryKey: ["customer", "order", orderId],
        }),
      ]);
    },
    onError: (error) => {
      toast.error("Failed to update order", {
        description: (error as Error).message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteOrder(orderId),
    onSuccess: async () => {
      toast.success("Order deleted");
      await queryClient.invalidateQueries({ queryKey: ["customer", "orders"] });
      router.push("/orders");
    },
    onError: (error) => {
      toast.error("Failed to delete order", {
        description: (error as Error).message,
      });
    },
  });

  const deliverItemMutation = useMutation({
    mutationFn: (payload: { orderItemId: number; deliveredQuantity: number }) =>
      updateOrderItemDeliveryStatus(payload.orderItemId, payload.deliveredQuantity),
    onSuccess: async (_, payload) => {
      toast.success("Item marked as delivered");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer", "orders"] }),
        queryClient.invalidateQueries({
          queryKey: ["customer", "order", orderId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["supervisor", "order-items"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["supervisor", "order-item", payload.orderItemId],
        }),
      ]);
    },
    onError: (error) => {
      toast.error("Failed to update delivery status", {
        description: (error as Error).message,
      });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: () => markOrderPaid(orderId),
    onSuccess: async () => {
      toast.success("Order marked as paid");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer", "orders"] }),
        queryClient.invalidateQueries({
          queryKey: ["customer", "order", orderId],
        }),
      ]);
    },
    onError: (error) => {
      toast.error("Failed to mark order as paid", {
        description: (error as Error).message,
      });
    },
  });

  const isCustomer = profileQuery.data?.user.role === "customer";
  const isSupervisor = profileQuery.data?.user.role === "supervisor";
  const isAdmin = profileQuery.data?.user.role === "admin";

  const canCancel =
    isCustomer &&
    orderQuery.data &&
    ["pending", "processing"].includes(orderQuery.data.orderStatus);

  if (orderQuery.isLoading) {
    return (
      <RequireAuth>
        <AppShell>
          <LoadingState />
        </AppShell>
      </RequireAuth>
    );
  }

  if (orderQuery.isError) {
    return (
      <RequireAuth>
        <AppShell>
          <Card className="border-destructive/50 max-w-2xl mx-auto mt-8">
            <CardHeader>
              <CardTitle className="text-destructive">Unable to load order</CardTitle>
              <CardDescription>
                {(orderQuery.error as Error).message}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" onClick={() => router.push("/orders")}>
                Return to Orders
              </Button>
            </CardFooter>
          </Card>
        </AppShell>
      </RequireAuth>
    );
  }

  const order = orderQuery.data;

  return (
    <RequireAuth>
      <AppShell>
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild className="h-8 w-8 -ml-2">
                  <Link href="/orders">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <h2 className="text-2xl font-bold tracking-tight">Order #{order?.orderId}</h2>
                <Badge 
                  variant="outline"
                  className={cn(
                    "capitalize ml-2",
                    order?.orderStatus === "completed" && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
                    order?.orderStatus === "pending" && "text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800",
                    order?.orderStatus === "processing" && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
                    order?.orderStatus === "cancelled" && "bg-muted text-muted-foreground"
                  )}
                >
                  {order?.orderStatus}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                Created on {formatDate(order?.createdAt ?? null)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pl-8 sm:pl-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.refresh()}
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Refresh
              </Button>
              
              {canCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Ban className="mr-2 h-3.5 w-3.5" />
                      Cancel Order
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will cancel the order and stop processing.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Order</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => cancelMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, Cancel Order
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Order?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete order #{orderId} and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Items</CardTitle>
                  <CardDescription>
                    Products included in this order. Confirm delivery per item to trigger automatic backend updates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right pr-6">Status</TableHead>
                        {(isAdmin || isSupervisor) && (
                          <TableHead className="text-right pr-6">Delivery</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(order?.items ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={isAdmin || isSupervisor ? 5 : 4}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No items found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        order?.items?.map((item) => (
                          <TableRow key={item.orderItemId}>
                            <TableCell className="font-medium pl-6">
                              {item.product?.name ?? `Product #${item.productId}`}
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.itemTotalPrice)}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs capitalize",
                                  item.deliveryStatus === "delivered" && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
                                  item.deliveryStatus === "partial" && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
                                  item.deliveryStatus === "pending" && "text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800",
                                )}
                              >
                                {item.deliveryStatus}
                              </Badge>
                              {(isAdmin || isSupervisor) && (
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  {item.deliveredQuantity}/{item.quantity} delivered
                                </p>
                              )}
                            </TableCell>
                            {(isAdmin || isSupervisor) && (
                              <TableCell className="text-right pr-6">
                                <Button
                                  size="sm"
                                  variant={item.deliveryStatus === "delivered" ? "secondary" : "default"}
                                  disabled={
                                    item.deliveryStatus === "delivered" ||
                                    (deliverItemMutation.isPending &&
                                      deliverItemMutation.variables?.orderItemId === item.orderItemId)
                                  }
                                  onClick={() =>
                                    deliverItemMutation.mutate({
                                      orderItemId: item.orderItemId,
                                      deliveredQuantity: item.quantity,
                                    })
                                  }
                                >
                                  {deliverItemMutation.isPending &&
                                  deliverItemMutation.variables?.orderItemId === item.orderItemId
                                    ? "Updating..."
                                    : item.deliveryStatus === "delivered"
                                      ? "Delivered"
                                      : "Mark Delivered"}
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" /> Due Date
                      </span>
                      <span>{formatDate(order?.dueDate ?? null)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center text-muted-foreground">
                        <CreditCard className="mr-2 h-4 w-4" /> Payment
                      </span>
                      <Badge
                        variant={order?.isPaid ? "default" : "secondary"}
                        className={cn(
                          order?.isPaid && "bg-emerald-600 text-white hover:bg-emerald-700",
                        )}
                      >
                        {order?.isPaid ? "Paid" : "Unpaid"}
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">{formatCurrency(order?.totalPrice ?? 0)}</span>
                  </div>
                      {(isAdmin || isSupervisor) && !order?.isPaid && order?.orderStatus !== "cancelled" && (
                        <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => markPaidMutation.mutate()}
                      disabled={markPaidMutation.isPending}
                    >
                      {markPaidMutation.isPending ? "Updating..." : "Mark as Paid"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Admin/Supervisor Controls */}
              {(isAdmin || isSupervisor) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Management</CardTitle>
                      <CardDescription>Update order schedule.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      className="space-y-4"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        const dueDate = String(formData.get("dueDate") ?? "");
                        await updateMutation.mutateAsync({ dueDate });
                      }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          name="dueDate"
                          type="date"
                          defaultValue={order?.dueDate ? new Date(order.dueDate).toISOString().split('T')[0] : ""}
                        />
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
