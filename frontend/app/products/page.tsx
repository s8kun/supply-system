"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/components/auth/require-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/feedback/loading-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  Package,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import {
  createProduct,
  fetchAuthProfile,
  fetchProducts,
  formatCurrency,
} from "@/features/customer/api";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [query] = useQueryState("q", parseAsString.withDefault(""));
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    costPrice: "0",
    sellPrice: "0",
    currentQuantity: "0",
    reorderLevel: "1",
    reorderQuantity: "1",
  });

  const productsQuery = useQuery({
    queryKey: ["customer", "products"],
    queryFn: fetchProducts,
    staleTime: 30_000,
  });

  const profileQuery = useQuery({
    queryKey: ["customer", "profile"],
    queryFn: fetchAuthProfile,
  });

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      toast.success("Product created successfully");
      setForm({
        name: "",
        description: "",
        costPrice: "0",
        sellPrice: "0",
        currentQuantity: "0",
        reorderLevel: "1",
        reorderQuantity: "1",
      });
      setFiles([]);
      setUploadProgress(null);
      setIsCreateOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["customer", "products"],
      });
    },
    onError: (error) => {
      setUploadProgress(null);
      toast.error((error as Error).message);
    },
  });

  const isDirty =
    Boolean(form.name.trim()) ||
    Boolean(form.description.trim()) ||
    Number.parseFloat(form.costPrice) > 0 ||
    Number.parseFloat(form.sellPrice) > 0 ||
    Number.parseInt(form.currentQuantity, 10) > 0 ||
    files.length > 0;
  useUnsavedChanges(isCreateOpen && isDirty);

  const isSupervisorView =
    profileQuery.data?.user.role === "supervisor" ||
    profileQuery.data?.user.role === "admin";

  async function submitCreateProduct() {
    setUploadProgress(0);
    await createProductMutation.mutateAsync({
      name: form.name,
      description: form.description,
      costPrice: Number.parseFloat(form.costPrice),
      sellPrice: Number.parseFloat(form.sellPrice),
      currentQuantity: Number.parseInt(form.currentQuantity, 10),
      reorderLevel: Number.parseInt(form.reorderLevel, 10),
      reorderQuantity: Number.parseInt(form.reorderQuantity, 10),
      images: files,
      onUploadProgress: setUploadProgress,
    });
  }

  const filteredProducts = useMemo(() => {
    const products = productsQuery.data ?? [];
    if (!query.trim()) return products;

    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(normalized) ||
        product.description.toLowerCase().includes(normalized)
      );
    });
  }, [productsQuery.data, query]);

  return (
    <RequireAuth>
      <AppShell>
        <div className="flex flex-col gap-6">
          <header className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Products</h2>
              <p className="text-sm text-muted-foreground">
                Browse inventory and manage your catalog.
              </p>
            </div>
            {isSupervisorView && (
              <Dialog
                open={isCreateOpen}
                onOpenChange={(nextOpen) => {
                  if (
                    !nextOpen &&
                    isDirty &&
                    !createProductMutation.isPending
                  ) {
                    const confirmed = window.confirm(
                      "Discard unsaved product changes?",
                    );
                    if (!confirmed) return;
                  }
                  setIsCreateOpen(nextOpen);
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Product</DialogTitle>
                    <DialogDescription>
                      Add a new item to your product catalog.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Wireless Mouse"
                        value={form.name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder=" detailed description..."
                        value={form.description}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="costPrice">Cost Price</Label>
                        <Input
                          id="costPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.costPrice}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              costPrice: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="sellPrice">Selling Price</Label>
                        <Input
                          id="sellPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.sellPrice}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              sellPrice: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="0"
                          value={form.currentQuantity}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              currentQuantity: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="reorderLevel">Reorder Level</Label>
                        <Input
                          id="reorderLevel"
                          type="number"
                          min="0"
                          value={form.reorderLevel}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              reorderLevel: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="reorderQty">Reorder Qty</Label>
                        <Input
                          id="reorderQty"
                          type="number"
                          min="0"
                          value={form.reorderQuantity}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              reorderQuantity: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="images">Product Images</Label>
                      <Input
                        id="images"
                        type="file"
                        multiple
                        className="cursor-pointer"
                        onChange={(e) =>
                          setFiles(Array.from(e.target.files ?? []))
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={submitCreateProduct}
                      disabled={createProductMutation.isPending}
                    >
                      {createProductMutation.isPending
                        ? "Creating..."
                        : "Create Product"}
                    </Button>
                  </DialogFooter>
                  {createProductMutation.isPending &&
                    uploadProgress !== null && (
                      <div className="mt-3 space-y-1">
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Uploading images: {uploadProgress}%
                        </p>
                      </div>
                    )}
                </DialogContent>
              </Dialog>
            )}
          </header>

          <Separator />

          {productsQuery.isLoading ? (
            <LoadingState />
          ) : productsQuery.isError ? (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Unable to load products
                </CardTitle>
                <CardDescription>
                  {(productsQuery.error as Error).message}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title="No products found"
              description={
                query
                  ? "Try adjusting your search terms."
                  : "Your catalog is empty."
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <Card
                  key={product.productId}
                  className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video w-full bg-muted flex items-center justify-center text-muted-foreground/50">
                    <Package className="h-12 w-12" />
                  </div>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle
                        className="text-lg line-clamp-1"
                        title={product.name}
                      >
                        {product.name}
                      </CardTitle>
                      <Badge
                        variant={
                          product.currentQuantity > 0
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {product.currentQuantity > 0
                          ? "In Stock"
                          : "Out of Stock"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 min-h-[2.5em]">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 flex-1">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-semibold text-lg">
                        {formatCurrency(product.sellPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Available</span>
                      <span
                        className={cn("font-medium", {
                          "text-destructive":
                            product.currentQuantity <= product.reorderLevel,
                          "text-emerald-600":
                            product.currentQuantity > product.reorderLevel,
                        })}
                      >
                        {product.currentQuantity} units
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 gap-2">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/products/${product.productId}`}>
                        Details
                      </Link>
                    </Button>
                    <Button asChild className="flex-1">
                      <Link href={`/orders/new?productId=${product.productId}`}>
                        Add to Order
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
