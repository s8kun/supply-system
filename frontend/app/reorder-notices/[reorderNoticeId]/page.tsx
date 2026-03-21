"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchReorderNotice, formatDate } from "@/features/customer/api";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReorderNoticeDetailPage() {
  const params = useParams<{ reorderNoticeId: string }>();
  const reorderNoticeId = Number.parseInt(params.reorderNoticeId, 10);

  const noticeQuery = useQuery({
    queryKey: ["admin", "reorder-notice", reorderNoticeId],
    queryFn: () => fetchReorderNotice(reorderNoticeId),
    enabled: Number.isFinite(reorderNoticeId),
  });

  const notice = noticeQuery.data;

  if (noticeQuery.isLoading) {
    return (
      <RequireAuth>
        <AppShell>
          <LoadingState />
        </AppShell>
      </RequireAuth>
    );
  }

  if (noticeQuery.isError) {
    return (
      <RequireAuth>
        <AppShell>
          <Card className="border-destructive/50 max-w-2xl mx-auto mt-8">
            <CardHeader>
              <CardTitle className="text-destructive">Unable to load notice</CardTitle>
              <CardDescription>
                {(noticeQuery.error as Error).message}
              </CardDescription>
            </CardHeader>
            <div className="p-6 pt-0">
              <Button asChild variant="outline">
                <Link href="/reorder-notices">Back to Notices</Link>
              </Button>
            </div>
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
              <Link href="/reorder-notices">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                Reorder Notice #{notice?.reorderNoticeId}
              </h2>
            </div>
          </header>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    {notice?.productName}
                  </CardTitle>
                  <CardDescription>
                    Product ID: #{notice?.productId}
                  </CardDescription>
                </div>
                <Badge 
                  variant={notice?.isResolved ? "outline" : "default"}
                  className={cn(
                    "gap-1 pl-1.5 pr-2.5 py-1",
                    !notice?.isResolved && "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white"
                  )}
                >
                  {notice?.isResolved ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  {notice?.isResolved ? "Resolved" : "Open Alert"}
                </Badge>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="grid gap-6 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground block mb-1">Current Stock</span>
                  <span className="text-2xl font-bold">{notice?.currentQuantity}</span>
                </div>
                <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground block mb-1">Reorder Level</span>
                  <span className="text-2xl font-bold">{notice?.reorderQuantity}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Notice Details</h3>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Created on {formatDate(notice?.createdAt ?? null)}</span>
                </div>
                
                {!notice?.isResolved && (
                  <div className="rounded-md bg-amber-50 p-4 dark:bg-amber-900/20">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">Low Stock Alert</h3>
                        <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                          <p>
                            The current quantity ({notice?.currentQuantity}) has fallen below the reorder level ({notice?.reorderQuantity}). 
                            Consider restocking this product soon.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
