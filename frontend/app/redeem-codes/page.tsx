"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { LoadingState } from "@/components/feedback/loading-state";
import {
  createRedeemCode,
  fetchAuthProfile,
  formatCurrency,
  redeemCustomerCode,
} from "@/features/customer/api";
import { toast } from "sonner";
import { Gift, CreditCard, Copy } from "lucide-react";

export default function RedeemCodesPage() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [createAmount, setCreateAmount] = useState("10");
  const [createCode, setCreateCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["customer", "profile"],
    queryFn: fetchAuthProfile,
  });

  const redeemMutation = useMutation({
    mutationFn: redeemCustomerCode,
    onSuccess: async (data) => {
      toast.success(`Code redeemed!`, {
        description: `Added ${formatCurrency(data.amount)} to your credit.`,
      });
      setCode("");
      await queryClient.invalidateQueries({
        queryKey: ["customer", "profile"],
      });
    },
    onError: (error) => {
      toast.error("Redemption failed", {
        description: (error as Error).message,
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: createRedeemCode,
    onSuccess: (data) => {
      toast.success("Code generated successfully");
      setGeneratedCode(data.code);
      setCreateCode("");
    },
    onError: (error) => {
      toast.error("Creation failed", {
        description: (error as Error).message,
      });
    },
  });

  const isSupervisorView =
    profileQuery.data?.user.role === "supervisor" ||
    profileQuery.data?.user.role === "admin";

  async function onRedeem() {
    if (!profileQuery.data?.customer) return;
    await redeemMutation.mutateAsync({
      customerId: profileQuery.data.customer.customerId,
      code,
    });
  }

  async function onCreateCode() {
    setGeneratedCode(null);
    await createMutation.mutateAsync({
      amount: Number.parseFloat(createAmount),
      code: createCode.trim() || undefined,
    });
  }

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success("Code copied to clipboard");
    }
  };

  return (
    <RequireAuth>
      <AppShell>
        <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
          <header className="text-center space-y-2 py-6">
            <h2 className="text-3xl font-bold tracking-tight">
              Redeem & Rewards
            </h2>
            <p className="text-muted-foreground">
              Manage gift codes and account credit.
            </p>
          </header>

          {profileQuery.isLoading ? (
            <LoadingState />
          ) : profileQuery.isError ? (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">
                  Error Loading Profile
                </CardTitle>
                <CardDescription>
                  {(profileQuery.error as Error).message}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : isSupervisorView ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Generate Redeem Code</CardTitle>
                    <CardDescription>
                      Create a code for customers to add credit.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Credit Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      className="pl-7"
                      value={createAmount}
                      onChange={(e) => setCreateAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="custom-code">Custom Code (Optional)</Label>
                  <Input
                    id="custom-code"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value)}
                    placeholder="e.g. SUMMER2024"
                  />
                </div>

                {generatedCode && (
                  <div className="bg-muted p-4 rounded-lg flex items-center justify-between border border-primary/20 bg-primary/5">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Generated Code
                      </span>
                      <p className="text-lg font-mono font-bold tracking-widest text-primary">
                        {generatedCode}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={onCreateCode}
                  disabled={createMutation.isPending || !createAmount.trim()}
                >
                  {createMutation.isPending ? "Generating..." : "Generate Code"}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 rounded-full">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Redeem Credit</CardTitle>
                    <CardDescription>
                      Current Balance:{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(
                          profileQuery.data?.customer?.creditLimit ?? 0,
                        )}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="redeem-code">Enter Code</Label>
                  <Input
                    id="redeem-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX-XXXX"
                    className="font-mono uppercase placeholder:normal-case"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={onRedeem}
                  disabled={
                    !code.trim() ||
                    redeemMutation.isPending ||
                    !profileQuery.data?.customer
                  }
                >
                  {redeemMutation.isPending
                    ? "Redeeming..."
                    : "Redeem to Wallet"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
