"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/feedback/loading-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
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
import { fetchReorderNotices, formatDate } from "@/features/customer/api";
import { AlertCircle, CheckCircle2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReorderNoticesPage() {
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("all"),
  );

  const noticesQuery = useQuery({
    queryKey: ["admin", "reorder-notices"],
    queryFn: fetchReorderNotices,
  });

  const filteredNotices = useMemo(() => {
    const list = noticesQuery.data ?? [];
    return list.filter((notice) => {
      const matchesStatus =
        status === "all" ||
        (status === "open" ? !notice.isResolved : notice.isResolved);
      const normalized = query.trim().toLowerCase();
      const matchesQuery =
        !normalized ||
        notice.productName.toLowerCase().includes(normalized) ||
        String(notice.reorderNoticeId).includes(normalized);

      return matchesStatus && matchesQuery;
    });
  }, [noticesQuery.data, query, status]);

  return (
    <RequireAuth>
      <AppShell>
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                Reorder Notices
              </h2>
              <p className="text-sm text-muted-foreground">
                Track low-stock events and inventory alerts.
              </p>
            </div>
          </header>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by notice ID or product..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open Only</SelectItem>
                    <SelectItem value="resolved">Resolved Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {noticesQuery.isLoading ? (
                <div className="py-8">
                  <LoadingState />
                </div>
              ) : noticesQuery.isError ? (
                <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
                  <p>Unable to load notices</p>
                  <p className="text-sm text-destructive mt-1">
                    {(noticesQuery.error as Error).message}
                  </p>
                </div>
              ) : filteredNotices.length === 0 ? (
                <EmptyState
                  title={
                    query || status !== "all"
                      ? "No matching notices"
                      : "No reorder notices"
                  }
                  description={
                    query || status !== "all"
                      ? "Try a different filter combination."
                      : "Low-stock notices will appear once inventory reaches reorder levels."
                  }
                  icon={AlertCircle}
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Notice ID</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Current Qty</TableHead>
                        <TableHead className="text-right">Reorder Level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotices.map((notice) => (
                        <TableRow key={notice.reorderNoticeId}>
                          <TableCell className="font-medium">
                            #{notice.reorderNoticeId}
                          </TableCell>
                          <TableCell>{notice.productName}</TableCell>
                          <TableCell className="text-right font-medium">
                            {notice.currentQuantity}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {notice.reorderQuantity}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={notice.isResolved ? "outline" : "default"}
                              className={cn(
                                "gap-1 pr-2.5",
                                !notice.isResolved && "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white"
                              )}
                            >
                              {notice.isResolved ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <AlertCircle className="h-3 w-3" />
                              )}
                              {notice.isResolved ? "Resolved" : "Open"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(notice.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="ghost" size="sm">
                              <Link
                                href={`/reorder-notices/${notice.reorderNoticeId}`}
                              >
                                View Details
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
