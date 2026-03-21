"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RecentOrder = {
  orderId: number;
  customerId: number;
  totalPrice: string | number;
  dueDate: string;
  orderStatus: string;
  isPaid: boolean;
  createdAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
}

export function RecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="No recent orders"
        description="Recent order activity will appear here once orders are created."
      />
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            Latest order activity across your scope.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Due Date</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.orderId}>
                <TableCell className="font-medium">#{order.orderId}</TableCell>
                <TableCell className="font-medium">
                  {order.customerId}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      order.orderStatus === "completed"
                        ? "secondary"
                        : order.orderStatus === "pending"
                          ? "outline"
                          : "default"
                    }
                    className={cn(
                      "capitalize",
                      order.orderStatus === "completed" &&
                        "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 dark:bg-emerald-900/30 dark:text-emerald-400",
                      order.orderStatus === "pending" &&
                        "text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800",
                      order.orderStatus === "processing" &&
                        "bg-blue-100 text-blue-700 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-400",
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
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(Number(order.totalPrice))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
