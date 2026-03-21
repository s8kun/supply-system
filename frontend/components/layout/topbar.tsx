"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

function resolveSearchRoute(pathname: string) {
  if (pathname.startsWith("/customers")) return "/customers";
  if (pathname.startsWith("/orders")) return "/orders";
  if (pathname.startsWith("/products")) return "/products";
  return "/products";
}

function resolveSearchPlaceholder(pathname: string) {
  if (pathname.startsWith("/orders")) return "Search orders...";
  if (pathname.startsWith("/customers")) return "Search customers...";
  return "Search products...";
}

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const searchRoute = resolveSearchRoute(pathname);
  const placeholder = resolveSearchPlaceholder(pathname);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawQuery = String(formData.get("q") ?? "");
    const next = rawQuery.trim();
    const suffix = next ? `?q=${encodeURIComponent(next)}` : "";
    router.push(`${searchRoute}${suffix}`);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <form onSubmit={onSubmit} className="relative" key={`${pathname}-${currentQuery}`}>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={currentQuery}
            className="h-9 w-[170px] sm:w-[300px] pl-8"
            placeholder={placeholder}
            aria-label="Global search"
          />
        </form>
      </div>
      <button
        type="button"
        aria-label="Notifications"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
      </button>
    </header>
  );
}
