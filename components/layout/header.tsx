"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { InformationMarquee } from "@/components/header/information-marquee";
import { MarketSelector } from "@/components/header/market-selector";
import { MobileNavDrawer } from "@/components/header/mobile-nav-drawer";
import { SearchDialog } from "@/components/header/search-dialog";
import { useCart } from "@/components/providers/cart-provider";
import { useCustomer } from "@/components/providers/customer-provider";
import { useMarket } from "@/components/providers/market-provider";
import { MARKET_COOKIE, marketHref, stripMarketPrefix, type MarketSlug } from "@/lib/markets";

const navigation = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["Categories", "/shop"],
  ["Contact", "/contact"],
  ["About", "/about"],
] as const;

function Brand({ marketSlug }: { marketSlug: MarketSlug }) {
  return (
    <Link href={marketHref(marketSlug, "/")} className="flex min-w-fit items-center gap-2.5" aria-label="Maqbool Islamic Products home">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 fill-forest sm:h-10 sm:w-10">
        <path d="M12 2 2 22h20L12 2Zm0 3.99L19.53 19H4.47L12 5.99Z" />
      </svg>
      <span>
        <span className="block font-heading text-base leading-none tracking-[1.2px] text-forest sm:text-[1.4rem]">
          MAQBOOL <span className="hidden sm:inline">ISLAMIC PRODUCTS</span>
        </span>
        <span className="mt-1 hidden text-[0.65rem] uppercase tracking-[1px] text-gold sm:block">
          Purify Your Deen. Enrich Your Life.
        </span>
      </span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { count, setOpen, clear } = useCart();
  const { marketSlug, market, availableMarketSlugs } = useMarket();
  const { customer, logout } = useCustomer();
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [categories, setCategories] = useState<Array<{ name: string; slug: string }>>([]);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetch("/api/announcement")
      .then((response) => response.json())
      .then((data) => setAnnouncement(typeof data.message === "string" ? data.message : ""))
      .catch(() => undefined);
    fetch("/api/categories")
      .then((response) => response.json())
      .then((data) => setCategories(Array.isArray(data.categories) ? data.categories : []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setCategoryOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  const closeMobileNavigation = useCallback(() => setMobileOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const changeMarket = (next: MarketSlug) => {
    if (next === marketSlug) return;
    if (count > 0 && !window.confirm("Changing your market will clear your shopping bag. Continue?")) return;
    clear();
    document.cookie = `${MARKET_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    const destination = marketHref(next, stripMarketPrefix(pathname));
    window.location.assign(`${destination}${window.location.search}${window.location.hash}`);
  };

  return (
    <>
      {announcement && (
        <aside className="bg-[#d5b56d] px-4 py-2 text-center text-xs font-bold text-[#123d32]" aria-label="Store announcement">
          {announcement}
        </aside>
      )}
      <InformationMarquee market={market} />
      <header className="sticky top-0 z-50 border-b border-[#eee8d5] bg-white/95 backdrop-blur">
        <div className="site-container flex min-h-[72px] items-center justify-between gap-3">
          <Brand marketSlug={marketSlug} />
          <nav aria-label="Main navigation" className="hidden items-center gap-4 xl:flex 2xl:gap-6">
            {navigation.map(([label, href]) => {
              const localPath = stripMarketPrefix(pathname);
              const active = href === "/" ? localPath === "/" : localPath === href;
              if (label === "Categories") {
                return (
                  <div key={label} className="relative">
                    <button
                      type="button"
                      aria-expanded={categoryOpen}
                      aria-haspopup="menu"
                      onClick={() => setCategoryOpen((open) => !open)}
                      className={`flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-sm text-[13px] font-medium transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 2xl:text-sm ${categoryOpen ? "text-gold" : "text-[#2b2b2b]"}`}
                    >
                      Categories
                      <ChevronDown className={`h-3 w-3 transition-transform ${categoryOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                    {categoryOpen && (
                      <div role="menu" className="absolute left-1/2 top-8 z-50 w-64 -translate-x-1/2 rounded-lg border border-[#e8ddc8] bg-white p-2 shadow-xl">
                        <Link role="menuitem" href={marketHref(marketSlug, "/shop")} onClick={() => setCategoryOpen(false)} className="block rounded-md px-3 py-2 text-sm font-semibold text-forest hover:bg-cream">
                          View all categories
                        </Link>
                        {categories.map((category) => (
                          <Link
                            key={category.slug}
                            role="menuitem"
                            href={marketHref(marketSlug, `/shop?category=${encodeURIComponent(category.slug)}`)}
                            onClick={() => setCategoryOpen(false)}
                            className="block rounded-md px-3 py-2 text-sm text-[#3d4b46] hover:bg-cream hover:text-forest"
                          >
                            {category.name}
                          </Link>
                        ))}
                        {!categories.length && <p className="px-3 py-2 text-xs text-muted">No active categories.</p>}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={label}
                  href={marketHref(marketSlug, href)}
                  className={`flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-sm text-[13px] font-medium transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 2xl:text-sm ${active ? "text-gold" : "text-[#2b2b2b]"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1 sm:gap-3">
            <MarketSelector
              value={marketSlug}
              options={availableMarketSlugs}
              onChange={changeMarket}
              className="hidden w-[8.5rem] lg:block 2xl:w-[9.5rem]"
            />
            <button aria-label="Search products" onClick={() => setSearchOpen(true)} className="grid h-11 w-11 place-items-center rounded transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
              <Search className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
            <div className="relative">
              <button aria-label={customer ? "Account menu" : "Sign in with email"} aria-expanded={customer ? accountOpen : undefined} onClick={() => customer ? setAccountOpen((open) => !open) : router.push(marketHref(marketSlug, "/login"))} className="grid h-11 w-11 place-items-center rounded transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                <UserRound className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
              {customer && accountOpen && (
                <div className="absolute right-0 top-12 w-52 rounded-lg border bg-white p-2 text-sm shadow-xl">
                  <p className="px-3 py-2 text-xs text-muted">Assalamu alaikum, <strong className="block text-sm text-forest">{customer.name}</strong></p>
                  <Link href={marketHref(marketSlug, "/profile")} className="block rounded px-3 py-2 hover:bg-cream" onClick={() => setAccountOpen(false)}>My profile</Link>
                  <Link href={marketHref(marketSlug, "/profile/orders")} className="block rounded px-3 py-2 hover:bg-cream" onClick={() => setAccountOpen(false)}>My orders</Link>
                  <button onClick={() => { logout(); setAccountOpen(false); }} className="w-full rounded px-3 py-2 text-left text-[#a53d3d] hover:bg-cream">Log out</button>
                </div>
              )}
            </div>
            <button aria-label={`Shopping bag with ${count} items`} onClick={() => setOpen(true)} className="relative grid h-11 w-11 place-items-center rounded transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
              <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
              {count > 0 && <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.65rem] text-white">{count}</span>}
            </button>
            <button
              ref={mobileMenuButtonRef}
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className="grid h-11 w-11 place-items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold xl:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <MobileNavDrawer
        open={mobileOpen}
        onClose={closeMobileNavigation}
        triggerRef={mobileMenuButtonRef}
        marketSlug={marketSlug}
        availableMarketSlugs={availableMarketSlugs}
        onMarketChange={changeMarket}
        categories={categories}
      />
      <SearchDialog open={searchOpen} onClose={closeSearch} marketSlug={marketSlug} />
      <CartDrawer />
    </>
  );
}
