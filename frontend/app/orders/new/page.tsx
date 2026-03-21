"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingState } from "@/components/feedback/loading-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShoppingCart, Plus, Trash2, ArrowLeft, CreditCard } from "lucide-react";
import {
  createOrder,
  fetchAuthProfile,
  fetchProducts,
  formatCurrency,
  type OrderItemInput,
  type ProductItem,
} from "@/features/customer/api";

type DraftItem = {
  productId: number;
  quantity: number;
};

function NewOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialProductId = Number.parseInt(
    searchParams.get("productId") ?? "",
    10,
  );

  const [selectedProductId, setSelectedProductId] = useState<string>(
    Number.isFinite(initialProductId) ? String(initialProductId) : "",
  );
  const [quantity, setQuantity] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  const productsQuery = useQuery({
    queryKey: ["customer", "products"],
    queryFn: fetchProducts,
  });

  const profileQuery = useQuery({
    queryKey: ["customer", "profile"],
    queryFn: fetchAuthProfile,
  });

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      toast.success("Order placed successfully!");
      router.push(`/orders/${order.orderId}`);
    },
    onError: (error) => {
      toast.error("Failed to place order", {
        description: (error as Error).message,
      });
    },
  });

  const productsById = useMemo(() => {
    const map = new Map<number, ProductItem>();
    for (const product of productsQuery.data ?? []) {
      map.set(product.productId, product);
    }
    return map;
  }, [productsQuery.data]);

  const total = useMemo(() => {
    return draftItems.reduce((sum, item) => {
      const product = productsById.get(item.productId);
      if (!product) return sum;
      const price =
        typeof product.sellPrice === "string"
          ? Number.parseFloat(product.sellPrice)
          : product.sellPrice;
      return sum + price * item.quantity;
    }, 0);
  }, [draftItems, productsById]);

  const availableCredit = useMemo(() => {
    const credit = profileQuery.data?.customer?.creditLimit ?? 0;
    return typeof credit === "string" ? Number.parseFloat(credit) : credit;
  }, [profileQuery.data]);

  function addToDraft() {
    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    const productId = Number.parseInt(selectedProductId, 10);

    setDraftItems((previous) => {
      const existing = previous.find(
        (item) => item.productId === productId,
      );
      if (existing) {
        toast.success("Updated item quantity");
        return previous.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      toast.success("Item added to draft");
      return [...previous, { productId, quantity }];
    });

    setQuantity(1);
    setSelectedProductId("");
  }

  function removeItem(productId: number) {
    setDraftItems((previous) =>
      previous.filter((item) => item.productId !== productId),
    );
    toast.success("Item removed");
  }

  async function submitOrder() {
    if (!profileQuery.data?.customer) {
      toast.error("Profile Error", {
        description: "Customer profile is missing. Please re-login.",
      });
      return;
    }

    if (!dueDate) {
      toast.error("Missing Information", {
        description: "Please select a due date for the order.",
      });
      return;
    }

    if (draftItems.length === 0) {
      toast.error("Empty Draft", {
        description: "Add at least one item to proceed.",
      });
      return;
    }

    if (total > availableCredit) {
      toast.error("Credit Limit Exceeded", {
        description: `Order total exceeds available credit by ${formatCurrency(total - availableCredit)}.`,
      });
      return;
    }

    const items: OrderItemInput[] = draftItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    await createOrderMutation.mutateAsync({
      customerId: profileQuery.data.customer.customerId,
      dueDate,
      items,
    });
  }

  const isLoading = productsQuery.isLoading || profileQuery.isLoading;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Create New Order</h2>
          <p className="text-sm text-muted-foreground">
            Build your order draft and review pricing.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </header>

      <Separator />

      {isLoading ? (
        <LoadingState />
      ) : productsQuery.isError || profileQuery.isError ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
            <CardDescription>
              {productsQuery.isError
                ? (productsQuery.error as Error).message
                : (profileQuery.error as Error).message}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Product Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle>Add Items</CardTitle>
                    <CardDescription>Select products to add to your order.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label>Product</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(productsQuery.data ?? []).map((product) => (
                        <SelectItem key={product.productId} value={String(product.productId)}>
                          <span className="flex items-center justify-between w-full gap-2">
                            <span>{product.name}</span>
                            <span className="text-muted-foreground font-mono text-xs">
                              {formatCurrency(product.sellPrice)}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addToDraft} className="w-full" variant="secondary">
                    Add to Draft
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Draft Items List */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-secondary rounded-full text-secondary-foreground">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle>Draft Items</CardTitle>
                    <CardDescription>Review items before placing the order.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {draftItems.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      title="Your draft is empty"
                      description="Add products from the section above."
                    />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {draftItems.map((item) => {
                        const product = productsById.get(item.productId);
                        if (!product) return null;
                        const price = typeof product.sellPrice === "string" 
                          ? parseFloat(product.sellPrice) 
                          : product.sellPrice;
                        const lineTotal = price * item.quantity;

                        return (
                          <TableRow key={item.productId}>
                            <TableCell className="font-medium pl-6">
                              {product.name}
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(price)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(lineTotal)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                onClick={() => removeItem(item.productId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Required Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Total</span>
                    <span className="text-lg">{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <CreditCard className="h-3 w-3" />
                      Available Credit
                    </span>
                    <span className="font-medium">{formatCurrency(availableCredit)}</span>
                  </div>
                  {total > availableCredit && (
                    <p className="text-destructive font-medium">
                      Credit limit exceeded by {formatCurrency(total - availableCredit)}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={submitOrder}
                  disabled={createOrderMutation.isPending || draftItems.length === 0 || total > availableCredit}
                >
                  {createOrderMutation.isPending ? "Processing..." : "Place Order"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <RequireAuth>
      <AppShell>
        <Suspense fallback={<LoadingState />}>
          <NewOrderContent />
        </Suspense>
      </AppShell>
    </RequireAuth>
  );
}
