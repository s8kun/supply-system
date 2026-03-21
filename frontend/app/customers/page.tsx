"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/components/auth/require-auth";
import { LoadingState } from "@/components/feedback/loading-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  createCustomer,
  deleteCustomer,
  fetchCustomers,
  formatCurrency,
} from "@/features/customer/api";
import { MoreHorizontal, Plus, Search, Trash2, User } from "lucide-react";

const createCustomerSchema = z
  .object({
    email: z.email("Valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirmation: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
    firstName: z.string().min(1, "First name is required"),
    middleName: z.string().min(1, "Middle name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().min(1, "Phone is required"),
    houseNo: z.string().min(1, "House number is required"),
    streetName: z.string().min(1, "Street name is required"),
    city: z.string().min(1, "City is required"),
    zipCode: z.string().min(1, "Zip code is required"),
    creditLimit: z.coerce.number().min(0, "Credit limit must be 0 or greater"),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Passwords do not match",
  });

type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
  const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirmation: "",
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      houseNo: "",
      streetName: "",
      city: "",
      zipCode: "",
      creditLimit: 0,
    },
  });

  const customersQuery = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: fetchCustomers,
  });

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: async () => {
      toast.success("Customer account created");
      reset();
      setIsCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: (error) => {
      setError("root", {
        message: (error as Error).message || "Unable to create customer account",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onMutate: async (customerId) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "customers"] });
      const previous = queryClient.getQueryData<
        ReturnType<typeof fetchCustomers> extends Promise<infer T> ? T : never
      >(["admin", "customers"]);
      queryClient.setQueryData(["admin", "customers"], (old: typeof previous) =>
        (old ?? []).filter((customer) => customer.customerId !== customerId),
      );
      return { previous };
    },
    onError: (error, _customerId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["admin", "customers"], context.previous);
      }
      toast.error("Failed to delete customer", {
        description: (error as Error).message,
      });
    },
    onSuccess: () => {
      toast.success("Customer deleted");
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      setCustomerToDelete(null);
    },
  });

  const filteredCustomers = useMemo(() => {
    const list = customersQuery.data ?? [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return list;

    return list.filter((customer) => {
      const fullName =
        `${customer.firstName} ${customer.middleName} ${customer.lastName}`.toLowerCase();
      return (
        fullName.includes(normalized) ||
        customer.phone.toLowerCase().includes(normalized) ||
        customer.address.city.toLowerCase().includes(normalized)
      );
    });
  }, [customersQuery.data, query]);

  const onCreateSubmit = handleSubmit(async (values) => {
    await createMutation.mutateAsync(values);
  });

  return (
    <RequireAuth>
      <AppShell>
        <div className="flex flex-col gap-6">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
              <p className="text-sm text-muted-foreground">
                Manage customer profiles and credit limits.
              </p>
            </div>
            <Dialog
              open={isCreateOpen}
              onOpenChange={(open) => {
                if (!open) {
                  reset();
                }
                setIsCreateOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Customer Account</DialogTitle>
                  <DialogDescription>
                    Add a customer profile and login credentials in one step.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={onCreateSubmit} className="space-y-4 py-2">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" {...register("email")} />
                      {errors.email && (
                        <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" {...register("password")} />
                      {errors.password && (
                        <p className="text-xs text-destructive font-medium">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passwordConfirmation">Confirm Password</Label>
                      <Input
                        id="passwordConfirmation"
                        type="password"
                        {...register("passwordConfirmation")}
                      />
                      {errors.passwordConfirmation && (
                        <p className="text-xs text-destructive font-medium">
                          {errors.passwordConfirmation.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" {...register("firstName")} />
                      {errors.firstName && (
                        <p className="text-xs text-destructive font-medium">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input id="middleName" {...register("middleName")} />
                      {errors.middleName && (
                        <p className="text-xs text-destructive font-medium">
                          {errors.middleName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" {...register("lastName")} />
                      {errors.lastName && (
                        <p className="text-xs text-destructive font-medium">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" type="tel" {...register("phone")} />
                      {errors.phone && (
                        <p className="text-xs text-destructive font-medium">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="houseNo">House Number</Label>
                      <Input id="houseNo" {...register("houseNo")} />
                      {errors.houseNo && (
                        <p className="text-xs text-destructive font-medium">{errors.houseNo.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="streetName">Street Name</Label>
                      <Input id="streetName" {...register("streetName")} />
                      {errors.streetName && (
                        <p className="text-xs text-destructive font-medium">
                          {errors.streetName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" {...register("city")} />
                      {errors.city && (
                        <p className="text-xs text-destructive font-medium">{errors.city.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input id="zipCode" {...register("zipCode")} />
                      {errors.zipCode && (
                        <p className="text-xs text-destructive font-medium">{errors.zipCode.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="creditLimit">Credit Limit</Label>
                      <Input
                        id="creditLimit"
                        type="number"
                        min={0}
                        step="0.01"
                        {...register("creditLimit")}
                      />
                      {errors.creditLimit && (
                        <p className="text-xs text-destructive font-medium">
                          {errors.creditLimit.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {errors.root?.message && (
                    <p className="text-sm text-destructive font-medium">{errors.root.message}</p>
                  )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        reset();
                        setIsCreateOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                      {isSubmitting || createMutation.isPending
                        ? "Creating..."
                        : "Create Customer"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </header>

          <Card>
            <CardHeader className="pb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name, phone, or city..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {customersQuery.isLoading ? (
                <div className="py-8">
                  <LoadingState />
                </div>
              ) : customersQuery.isError ? (
                <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
                  <p>Unable to load customers</p>
                  <p className="text-sm text-destructive mt-1">
                    {(customersQuery.error as Error).message}
                  </p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <EmptyState
                  title={query ? "No matching customers" : "No customers found"}
                  description={
                    query
                      ? "Try adjusting your search query."
                      : "No customers have registered yet."
                  }
                  icon={User}
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Credit Limit</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.customerId}>
                          <TableCell className="font-medium text-muted-foreground">
                            #{customer.customerId}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {customer.firstName.charAt(0)}
                                  {customer.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">
                                {customer.firstName} {customer.middleName} {customer.lastName}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>{customer.address.city}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(customer.creditLimit)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/customers/${customer.customerId}`}>
                                    <User className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setCustomerToDelete(customer.customerId)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Customer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          
          <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the customer account and remove their data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => customerToDelete && deleteMutation.mutate(customerToDelete)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
