"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/types/api";
import { useAuthSession } from "@/hooks/use-auth-session";
import { NAV_ICON_MAP, type NavIconKey } from "@/lib/ui/icon-map";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = {
  href: string;
  label: string;
  iconKey: NavIconKey;
  roles: Role[];
};

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    iconKey: "dashboard",
    roles: ["admin", "supervisor", "customer"],
  },
  {
    href: "/products",
    label: "Products",
    iconKey: "products",
    roles: ["admin", "supervisor", "customer"],
  },
  {
    href: "/orders",
    label: "Orders",
    iconKey: "orders",
    roles: ["admin", "supervisor", "customer"],
  },
  {
    href: "/order-items",
    label: "Order Items",
    iconKey: "orderItems",
    roles: ["admin", "supervisor"],
  },
  {
    href: "/customers",
    label: "Customers",
    iconKey: "customers",
    roles: ["admin"],
  },
  {
    href: "/reorder-notices",
    label: "Reorder Notices",
    iconKey: "reorderNotices",
    roles: ["admin"],
  },
  {
    href: "/redeem-codes",
    label: "Redeem Codes",
    iconKey: "redeemCodes",
    roles: ["admin", "supervisor", "customer"],
  },
  {
    href: "/profile",
    label: "Profile",
    iconKey: "profile",
    roles: ["admin", "supervisor", "customer"],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuthSession();
  const visibleItems = navItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false,
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Supply Company
          </p>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Control Center
          </h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const Icon = NAV_ICON_MAP[item.iconKey];
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
