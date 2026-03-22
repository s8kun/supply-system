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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  deleteProduct,
  fetchAuthProfile,
  fetchProduct,
  formatCurrency,
} from "@/features/customer/api";
import { ArrowLeft, Edit, Package, ShoppingCart, Trash2 } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = Number.parseInt(params.productId, 10);

  const productQuery = useQuery({
    queryKey: ["customer", "product", productId],
    queryFn: () => fetchProduct(productId),
    enabled: Number.isFinite(productId),
  });

  const profileQuery = useQuery({
    queryKey: ["customer", "profile"],
    queryFn: fetchAuthProfile,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(productId),
    onSuccess: async () => {
      toast.success("Product deleted successfully");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer", "products"] }),
        queryClient.invalidateQueries({
          queryKey: ["customer", "product", productId],
        }),
      ]);
      router.push("/products");
    },
    onError: (error) => {
      toast.error("Failed to delete product", {
        description: (error as Error).message,
      });
    },
  });

  const isAdmin = profileQuery.data?.user.role === "admin";
  const product = productQuery.data;

  if (productQuery.isLoading) {
    return (
      <RequireAuth>
        <AppShell>
          <LoadingState />
        </AppShell>
      </RequireAuth>
    );
  }

  if (productQuery.isError) {
    return (
      <RequireAuth>
        <AppShell>
          <Card className="border-destructive/50 max-w-2xl mx-auto mt-8">
            <CardHeader>
              <CardTitle className="text-destructive">Unable to load product</CardTitle>
              <CardDescription>
                {(productQuery.error as Error).message}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" onClick={() => router.push("/products")}>
                Return to Products
              </Button>
            </CardFooter>
          </Card>
        </AppShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <AppShell>
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
          <header className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8 -ml-2">
              <Link href="/products">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                Product Details
              </h2>
            </div>
          </header>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">{product?.name}</CardTitle>
                  <CardDescription className="text-base">
                    {product?.description}
                  </CardDescription>
                </div>
                <Badge variant={product?.currentQuantity && product.currentQuantity > 0 ? "outline" : "destructive"}>
                  {product?.currentQuantity && product.currentQuantity > 0 ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="grid gap-6 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <p className="text-2xl font-bold">
                    {formatCurrency(product?.sellPrice ?? 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Current Stock</span>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xl font-medium">
                      {product?.currentQuantity ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 justify-end bg-muted/50 p-6">
              <Button asChild>
                <Link href={`/orders/new?productId=${productId}`}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Order
                </Link>
              </Button>
              
              {isAdmin && (
                <>
                  <Button asChild variant="outline">
                    <Link href={`/products/${productId}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &quot;{product?.name}&quot;. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteMutation.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </CardFooter>
          </Card>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
