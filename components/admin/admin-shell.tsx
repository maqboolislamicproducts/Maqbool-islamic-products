"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Boxes,
  ChevronRight,
  ClipboardList,
  FolderTree,
  HelpCircle,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  Settings,
  ShoppingBag,
  Star,
  Tags,
  Truck,
  Users,
  Globe2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AdminStoreProvider } from "./admin-store";

const navGroups = [
  {
    label: "Commerce",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/products", label: "Products", icon: ShoppingBag },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/markets", label: "Markets & pricing", icon: Globe2 },
      { href: "/admin/orders", label: "Orders", icon: ClipboardList },
      { href: "/admin/customers", label: "Customers", icon: Users },
    ],
  },
  {
    label: "Engagement",
    items: [
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/inquiries", label: "Inquiries", icon: MessageSquareText },
      { href: "/admin/coupons", label: "Coupons", icon: Tags },
      { href: "/admin/shipping", label: "Shipping", icon: Truck },
      { href: "/admin/announcements", label: "Announcements", icon: Bell },
      { href: "/admin/homepage", label: "Homepage", icon: Images },
      { href: "/admin/faqs", label: "Global FAQs", icon: HelpCircle },
      { href: "/admin/settings", label: "Admin profile", icon: Settings },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  const currentLabel = navGroups.flatMap((group) => group.items)
    .find((item) => item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href))?.label ?? "Admin";

  const nav = (
    <>
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
        <Link href="/admin" className="group flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b56d]">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d5b56d] text-[#123d32] shadow-[0_8px_24px_rgba(0,0,0,.2)]">
            <Boxes className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-heading text-lg tracking-wide text-white">Maqbool</span>
            <span className="block text-[10px] uppercase tracking-[.22em] text-[#bad0c8]">Operations</span>
          </span>
        </Link>
        <button type="button" onClick={() => setMobileOpen(false)} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-white/70 hover:bg-white/10 lg:hidden" aria-label="Close navigation">
          <PanelLeftClose className="h-5 w-5" />
        </button>
      </div>
      <nav aria-label="Admin navigation" className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#8fb0a5]">{group.label}</p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b56d]",
                        active ? "bg-[#d5b56d] text-[#123d32]" : "text-[#d9e6e1] hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      {item.label}
                      {active && <ChevronRight className="ml-auto h-4 w-4" aria-hidden="true" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[#d9e6e1] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b56d] disabled:opacity-60"
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </>
  );

  return (
    <AdminStoreProvider>
      <div className="min-h-screen bg-[#f5f3ed] text-[#1c2925]">
        <a href="#admin-main" className="sr-only z-[100] rounded-md bg-white px-4 py-3 text-[#123d32] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to admin content</a>
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#123d32] lg:flex">{nav}</aside>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />
            <aside className="relative flex h-full w-[min(84vw,20rem)] flex-col bg-[#123d32] shadow-2xl">{nav}</aside>
          </div>
        )}
        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[#ded9cc] bg-[#faf9f5]/95 px-4 backdrop-blur sm:px-7">
            <button type="button" onClick={() => setMobileOpen(true)} className="mr-3 grid min-h-11 min-w-11 place-items-center rounded-lg border border-[#d8d2c5] lg:hidden" aria-label="Open navigation" aria-expanded={mobileOpen}>
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6f7e78]">Maqbool admin</p>
              <p className="font-heading text-lg text-[#123d32]">{currentLabel}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Link href="/" className="hidden min-h-10 items-center rounded-md px-3 text-sm font-semibold text-[#35584d] hover:bg-[#eae6db] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b58a2c] sm:flex">View store</Link>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#123d32] text-xs font-bold text-white" aria-label="Administrator account">AD</span>
            </div>
          </header>
          <main id="admin-main" tabIndex={-1} className="mx-auto max-w-[1500px] p-4 sm:p-7">{children}</main>
        </div>
      </div>
    </AdminStoreProvider>
  );
}
