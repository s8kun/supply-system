"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/feedback/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { fetchProduct, updateProduct } from "@/features/customer/api";
import { ArrowLeft } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  costPrice: z.string().refine((val) => !Number.isNaN(Number(val)) && Number(val) >= 0, {
    message: "Cost price must be a valid positive number",
  }),
  sellPrice: z.string().refine((val) => !Number.isNaN(Number(val)) && Number(val) >= 0, {
    message: "Sell price must be a valid positive number",
  }),
  currentQuantity: z.string().refine((val) => !Number.isNaN(Number(val)) && Number(val) >= 0, {
    message: "Current quantity must be a valid non-negative number",
  }),
  reorderLevel: z.string().refine((val) => !Number.isNaN(Number(val)) && Number(val) >= 0, {
    message: "Reorder level must be a valid non-negative number",
  }),
  reorderQuantity: z.string().refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
    message: "Reorder quantity must be a valid positive number",
  }),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = Number.parseInt(params.productId, 10);

  const productQuery = useQuery({
    queryKey: ["admin", "product", productId],
    queryFn: () => fetchProduct(productId),
    enabled: Number.isFinite(productId),
  });

  const updateMutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const payload = {
        name: values.name,
        description: values.description || "",
        costPrice: Number.parseFloat(values.costPrice),
        sellPrice: Number.parseFloat(values.sellPrice),
        currentQuantity: Number.parseInt(values.currentQuantity, 10),
        reorderLevel: Number.parseInt(values.reorderLevel, 10),
        reorderQuantity: Number.parseInt(values.reorderQuantity, 10),
      };
      return updateProduct(productId, payload);
    },
    onSuccess: async () => {
      toast.success("Product updated successfully");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer", "products"] }),
        queryClient.invalidateQueries({
          queryKey: ["customer", "product", productId],
        }),
      ]);
      router.push(`/products/${productId}`);
    },
    onError: (error) => {
      toast.error("Failed to update product", {
        description: (error as Error).message,
      });
    },
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      costPrice: "0",
      sellPrice: "0",
      currentQuantity: "0",
      reorderLevel: "0",
      reorderQuantity: "0",
    },
    values: productQuery.data ? {
      name: productQuery.data.name,
      description: productQuery.data.description,
      costPrice: String(productQuery.data.costPrice),
      sellPrice: String(productQuery.data.sellPrice),
      currentQuantity: String(productQuery.data.currentQuantity),
      reorderLevel: String(productQuery.data.reorderLevel),
      reorderQuantity: String(productQuery.data.reorderQuantity),
    } : undefined,
  });

  const { register, handleSubmit, formState: { errors } } = form;

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
            <div className="p-6 pt-0">
              <Button variant="outline" onClick={() => router.push("/products")}>
                Return to Products
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
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
          <header className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8 -ml-2">
              <Link href={`/products/${productId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                Edit Product
              </h2>
            </div>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Update product information and inventory settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-6"
                onSubmit={handleSubmit((values) => updateMutation.mutate(values))}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" placeholder="Product name" {...register("name")} />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Product description" 
                      className="resize-none"
                      {...register("description")} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost Price</Label>
                    <Input 
                      id="costPrice" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      {...register("costPrice")} 
                    />
                    {errors.costPrice && (
                      <p className="text-sm text-destructive">{errors.costPrice.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sellPrice">Sell Price</Label>
                    <Input 
                      id="sellPrice" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      {...register("sellPrice")} 
                    />
                    {errors.sellPrice && (
                      <p className="text-sm text-destructive">{errors.sellPrice.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentQuantity">Current Quantity</Label>
                    <Input 
                      id="currentQuantity" 
                      type="number" 
                      min="0" 
                      {...register("currentQuantity")} 
                    />
                    {errors.currentQuantity && (
                      <p className="text-sm text-destructive">{errors.currentQuantity.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reorderLevel">Reorder Level</Label>
                    <Input 
                      id="reorderLevel" 
                      type="number" 
                      min="0" 
                      {...register("reorderLevel")} 
                    />
                    {errors.reorderLevel && (
                      <p className="text-sm text-destructive">{errors.reorderLevel.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
                    <Input 
                      id="reorderQuantity" 
                      type="number" 
                      min="1" 
                      {...register("reorderQuantity")} 
                    />
                    {errors.reorderQuantity && (
                      <p className="text-sm text-destructive">{errors.reorderQuantity.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" type="button">
                    <Link href={`/products/${productId}`}>Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
