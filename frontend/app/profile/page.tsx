"use client";

import { useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/feedback/loading-state";
import { fetchAuthProfile, formatCurrency } from "@/features/customer/api";
import { Separator } from "@/components/ui/separator";
import { User, Phone, MapPin, CreditCard, Mail, Building } from "lucide-react";

export default function ProfilePage() {
  const profileQuery = useQuery({
    queryKey: ["customer", "profile"],
    queryFn: fetchAuthProfile,
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <RequireAuth>
      <AppShell>
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
          <header className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
            <p className="text-muted-foreground">
              Manage your personal information and account details.
            </p>
          </header>

          <Separator />

          {profileQuery.isLoading ? (
            <LoadingState />
          ) : profileQuery.isError ? (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Error Loading Profile</CardTitle>
                <CardDescription>
                  {(profileQuery.error as Error).message}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {/* User Identity Card */}
              <Card className="md:col-span-1 h-fit">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xl bg-primary/10 text-primary">
                        {getInitials(profileQuery.data?.user.name ?? "User")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle>{profileQuery.data?.user.name}</CardTitle>
                  <CardDescription>{profileQuery.data?.user.email}</CardDescription>
                  <div className="pt-2">
                    <Badge variant="secondary" className="capitalize">
                      {profileQuery.data?.user.role}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Details Sections */}
              <div className="md:col-span-2 space-y-6">
                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Username</span>
                        <p className="font-medium">{profileQuery.data?.user.name}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Email</span>
                        <p className="font-medium flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {profileQuery.data?.user.email}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Details (Conditional) */}
                {profileQuery.data?.customer && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        Customer Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</span>
                          <p className="font-medium">
                            {profileQuery.data.customer.firstName}{" "}
                            {profileQuery.data.customer.middleName}{" "}
                            {profileQuery.data.customer.lastName}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Phone</span>
                          <p className="font-medium flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {profileQuery.data.customer.phone}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Address</span>
                        <p className="font-medium flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span>
                            {profileQuery.data.customer.address.houseNo}{" "}
                            {profileQuery.data.customer.address.streetName}<br />
                            {profileQuery.data.customer.address.city}, {profileQuery.data.customer.address.zipCode}
                          </span>
                        </p>
                      </div>

                      <Separator />

                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Credit Limit</span>
                        <p className="text-2xl font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <CreditCard className="h-5 w-5" />
                          {formatCurrency(profileQuery.data.customer.creditLimit)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
