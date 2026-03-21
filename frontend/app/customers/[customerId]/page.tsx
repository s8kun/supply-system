"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  deleteCustomer,
  fetchCustomer,
  formatCurrency,
} from "@/features/customer/api";
import { ArrowLeft, CreditCard, MapPin, Phone, Trash2 } from "lucide-react";

export default function CustomerDetailPage() {
  const params = useParams<{ customerId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = Number.parseInt(params.customerId, 10);

  const customerQuery = useQuery({
    queryKey: ["admin", "customer", customerId],
    queryFn: () => fetchCustomer(customerId),
    enabled: Number.isFinite(customerId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCustomer(customerId),
    onSuccess: async () => {
      toast.success("Customer deleted successfully");
      await queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      router.push("/customers");
    },
    onError: (error) => {
      toast.error("Failed to delete customer", {
        description: (error as Error).message,
      });
    },
  });

  const customer = customerQuery.data;

  if (customerQuery.isLoading) {
    return (
      <RequireAuth>
        <AppShell>
          <LoadingState />
        </AppShell>
      </RequireAuth>
    );
  }

  if (customerQuery.isError) {
    return (
      <RequireAuth>
        <AppShell>
          <Card className="border-destructive/50 max-w-2xl mx-auto mt-8">
            <CardHeader>
              <CardTitle className="text-destructive">Unable to load customer</CardTitle>
              <CardDescription>
                {(customerQuery.error as Error).message}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" onClick={() => router.push("/customers")}>
                Return to Customers
              </Button>
            </CardFooter>
          </Card>
        </AppShell>
      </RequireAuth>
    );
  }

  const initials = `${customer?.firstName?.charAt(0) ?? ""}${customer?.lastName?.charAt(0) ?? ""}`;

  return (
    <RequireAuth>
      <AppShell>
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
          <header className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8 -ml-2">
              <Link href="/customers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                Customer Profile
              </h2>
            </div>
          </header>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <CardTitle className="text-2xl">
                    {customer?.firstName} {customer?.middleName} {customer?.lastName}
                  </CardTitle>
                  <CardDescription>
                    Customer ID: #{customer?.customerId}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="grid gap-6 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Contact Info
                  </h3>
                  <div className="pl-6 text-sm">
                    <p>{customer?.phone}</p>
                    <p className="text-muted-foreground mt-1">
                      {customer?.role}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Financial
                  </h3>
                  <div className="pl-6 text-sm">
                    <p className="text-muted-foreground">Credit Limit</p>
                    <p className="font-medium text-lg">
                      {formatCurrency(customer?.creditLimit ?? 0)}
                    </p>
                  </div>
                </div>

                <div className="col-span-full space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Address
                  </h3>
                  <div className="pl-6 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                    <p>{customer?.address.houseNo} {customer?.address.streetName}</p>
                    <p>{customer?.address.city}, {customer?.address.zipCode}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 bg-muted/50 p-6">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Customer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Customer Account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the account for {customer?.firstName} {customer?.lastName} and remove all associated data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
