"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRoleHome } from "@/lib/auth/guards";
import { apiFetch, setStoredSessionToken } from "@/lib/api/client";
import { registerSchema, type RegisterValues } from "@/features/auth/schemas";
import { useAuthSession } from "@/hooks/use-auth-session";

type RegisterResponse = {
  status: "success";
  data: {
    user: {
      role: "admin" | "supervisor" | "customer";
    };
    token?: string;
  };
};

export default function RegisterPage() {
  const router = useRouter();
  const { refreshSession } = useAuthSession();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      password_confirmation: "",
      firstName: "",
      middleName: "",
      lastName: "",
      houseNo: "",
      streetName: "",
      city: "",
      zipCode: "",
      phone: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const accountName = `${values.firstName} ${values.lastName}`.trim();
    const response = await apiFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        name: accountName,
      }),
      withAuth: false,
    });

    const payload = await response.json();

    if (!response.ok) {
      const message =
        typeof payload?.message === "string"
          ? payload.message
          : "Registration failed";
      setError("root", { message });
      return;
    }

    const data = payload as RegisterResponse;
    if (data.data.token) {
      setStoredSessionToken(data.data.token);
    }
    await refreshSession();
    router.replace(getRoleHome(data.data.user.role));
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
          <CardDescription>
            Register as a customer to place and manage orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" {...register("email")} />
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
              <Label htmlFor="password_confirmation">Confirm password</Label>
              <Input
                id="password_confirmation"
                type="password"
                {...register("password_confirmation")}
              />
              {errors.password_confirmation && (
                <p className="text-xs text-destructive font-medium">
                  {errors.password_confirmation.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" placeholder="John" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-xs text-destructive font-medium">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="middleName">Middle name</Label>
              <Input id="middleName" {...register("middleName")} />
              {errors.middleName && (
                <p className="text-xs text-destructive font-medium">
                  {errors.middleName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" placeholder="Doe" {...register("lastName")} />
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
              <Label htmlFor="houseNo">House number</Label>
              <Input id="houseNo" {...register("houseNo")} />
              {errors.houseNo && (
                <p className="text-xs text-destructive font-medium">{errors.houseNo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="streetName">Street name</Label>
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
              <Label htmlFor="zipCode">Zip code</Label>
              <Input id="zipCode" {...register("zipCode")} />
              {errors.zipCode && (
                <p className="text-xs text-destructive font-medium">{errors.zipCode.message}</p>
              )}
            </div>

            {errors.root?.message && (
              <p className="text-sm text-destructive font-medium md:col-span-2">
                {errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              className="md:col-span-2 w-full mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-center text-sm w-full text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
