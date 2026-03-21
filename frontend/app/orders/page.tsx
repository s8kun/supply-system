"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
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
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Separator } from "@/components/ui/separator";
import {
  fetchAuthProfile,
  fetchOrders,
  formatCurrency,
  formatDate,
} from "@/features/customer/api";
import { cn } from "@/lib/utils";
import { Plus, ArrowRight, Package } from "lucide-react";

export default function OrdersPage() {
  const [query] = useQueryState("q", parseAsString.withDefault(""));
  const profileQuery = useQuery({
    queryKey: ["customer", "profile"],
    queryFn: fetchAuthProfile,
  });

  const ordersQuery = useQuery({
    queryKey: ["customer", "orders"],
    queryFn: fetchOrders,
    staleTime: 15_000,
  });

  const isCustomer = profileQuery.data?.user.role === "customer";
  const isSupervisorOrAdmin =
    profileQuery.data?.user.role === "supervisor" || profileQuery.data?.user.role === "admin";

  const orders = useMemo(() => {
    const sorted = [...(ordersQuery.data ?? [])].sort((a, b) => {
      const first = Date.parse(a.createdAt ?? a.dueDate);
      const second = Date.parse(b.createdAt ?? b.dueDate);
      return second - first;
    });

    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return sorted;
    }

    return sorted.filter((order) => {
      const status = order.orderStatus.toLowerCase();
      const orderId = String(order.orderId);
      const dueDate = order.dueDate.toLowerCase();
      return (
        orderId.includes(normalized) ||
        status.includes(normalized) ||
        dueDate.includes(normalized)
      );
    });
  }, [ordersQuery.data, query]);

  return (
    <RequireAuth>
      <AppShell>
        <div className="flex flex-col gap-6">
          <header className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
              <p className="text-sm text-muted-foreground">
                Track your placed orders and open detailed status.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSupervisorOrAdmin && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/order-items">
                    <Package className="mr-2 h-4 w-4" />
                    Fulfillment Queue
                  </Link>
                </Button>
              )}
              {isCustomer && (
                <Button asChild size="sm">
                  <Link href="/orders/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Order
                  </Link>
                </Button>
              )}
            </div>
          </header>

          <Separator />

          {ordersQuery.isLoading ? (
            <LoadingState />
          ) : ordersQuery.isError ? (
            <Card>
              <CardHeader>
                <CardTitle>Unable to load orders</CardTitle>
                <CardDescription>
                  {(ordersQuery.error as Error).message}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : orders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="Create your first order to start tracking status and delivery progress."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your Orders</CardTitle>
                <CardDescription>
                  Recent orders sorted by newest activity.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] pl-6">Order #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Due Date
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Created
                      </TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[100px] text-right pr-6">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell className="font-medium pl-6">
                          #{order.orderId}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize",
                              order.orderStatus === "completed" &&
                                "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
                              order.orderStatus === "pending" &&
                                "text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800",
                              order.orderStatus === "processing" &&
                                "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
                              order.orderStatus === "cancelled" &&
                                "bg-muted text-muted-foreground",
                            )}
                          >
                            {order.orderStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatDate(order.dueDate)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(order.totalPrice)}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Link href={`/orders/${order.orderId}`}>
                              <ArrowRight className="h-4 w-4" />
                              <span className="sr-only">Open</span>
                            </Link>
                          </Button>
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
