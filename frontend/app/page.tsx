"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/feedback/loading-state";
import { RecentOrdersTable } from "@/components/dashboard/recent-orders-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardOverview } from "@/features/dashboard/overview";
import { downloadAndPrintFulfillmentReportToday } from "@/features/reports/fulfillment";
import { useAuthSession } from "@/hooks/use-auth-session";
import { ACTION_ICON_MAP, STATUS_ICON_MAP } from "@/lib/ui/icon-map";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuthSession();
  const canDownloadReport = user?.role === "admin" || user?.role === "supervisor";
  const overviewQuery = useQuery({
    queryKey: ["dashboard", user?.role],
    queryFn: () => getDashboardOverview(user!.role),
    enabled: Boolean(user?.role),
    staleTime: 30_000,
  });

  const LogoutIcon = ACTION_ICON_MAP.logout;
  const WarningIcon = STATUS_ICON_MAP.warning;
  const SuccessIcon = STATUS_ICON_MAP.success;
  const PendingIcon = STATUS_ICON_MAP.pending;

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  async function handleDownloadReport() {
    try {
      await downloadAndPrintFulfillmentReportToday();
      toast.success("Fulfillment report opened for print");
    } catch (error) {
      toast.error("Failed to open fulfillment report", {
        description: (error as Error).message,
      });
    }
  }

  const cards = useMemo(() => {
    const data = overviewQuery.data;
    if (!data || !user) return [] as React.ReactNode[];

    if (user.role === "customer") {
      return [
        <StatCard
          key="credit"
          title="Available Credit"
          value={data.customerCredit}
          description="Current credit limit available"
          icon={SuccessIcon}
          tone="success"
        />,
        <StatCard
          key="active-orders"
          title="Active Orders"
          value={String(data.activeOrders)}
          description="Orders pending or processing"
          icon={PendingIcon}
        />,
        <StatCard
          key="recent-orders"
          title="Recent Orders"
          value={String(data.recentOrders.length)}
          description="Latest order updates"
          icon={SuccessIcon}
        />,
      ];
    }

    if (user.role === "supervisor") {
      return [
        <StatCard
          key="products"
          title="Products"
          value={String(data.productsCount)}
          description="Total products in inventory"
          icon={SuccessIcon}
        />,
        <StatCard
          key="pending-deliveries"
          title="Pending Deliveries"
          value={String(data.pendingDeliveries)}
          description="Items pending delivery"
          icon={WarningIcon}
          tone="warning"
        />,
        <StatCard
          key="recent-orders"
          title="Recent Orders"
          value={String(data.recentOrders.length)}
          description="Latest customer activity"
          icon={PendingIcon}
        />,
      ];
    }

    return [
      <StatCard
        key="customers"
        title="Customers"
        value={String(data.customersCount)}
        description="Total managed customers"
        icon={SuccessIcon}
      />,
      <StatCard
        key="low-stock"
        title="Low Stock Notices"
        value={String(data.lowStockNotices)}
        description="Open reorder alerts"
        icon={WarningIcon}
        tone="warning"
      />,
      <StatCard
        key="totals"
        title="Products / Orders"
        value={`${data.productsCount} / ${data.totalOrders}`}
        description="Inventory and order volume"
        icon={PendingIcon}
      />,
    ];
  }, [overviewQuery.data, user, PendingIcon, SuccessIcon, WarningIcon]);

  return (
    <RequireAuth>
      <AppShell>
        <div className="flex flex-col gap-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">
                Welcome back, {user?.name || "User"}. Here&apos;s an overview of
                your account.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canDownloadReport ? (
                <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                  Download Report
                </Button>
              ) : null}
              <Button variant="default" size="sm" onClick={handleLogout}>
                <LogoutIcon className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </header>

          <Separator />

          {overviewQuery.isLoading ? (
            <LoadingState />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3 lg:gap-8">{cards}</div>
              <RecentOrdersTable
                orders={overviewQuery.data?.recentOrders ?? []}
              />
            </div>
          )}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
