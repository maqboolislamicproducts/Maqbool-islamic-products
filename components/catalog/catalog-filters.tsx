"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { LoaderCircle, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Category, Product } from "@/lib/models";
import { CatalogCard } from "@/components/catalog/catalog-card";
import { FilterFields, type FilterFieldProps } from "@/components/catalog/filter-fields";

type CatalogResults = {
  products: Product[];
  categories: Array<Category & { productCount: number }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type CatalogFiltersProps = {
  results: CatalogResults;
  initialFilters: {
    search: string;
    categories: string[];
    minPrice: string;
    maxPrice: string;
    minRating: number;
    sort: "featured" | "newest" | "price-asc" | "price-desc" | "rating";
  };
};

export function CatalogFilters({ results, initialFilters }: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialFilters.search);
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice);
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const navigate = (changes: Record<string, string | string[] | null>, resetPage = true) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      next.delete(key);
      if (Array.isArray(value)) value.forEach((item) => next.append(key, item));
      else if (value) next.set(key, value);
    });
    if (resetPage) next.delete("page");
    startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };

  useEffect(() => setSearch(initialFilters.search), [initialFilters.search]);
  useEffect(() => setMinPrice(initialFilters.minPrice), [initialFilters.minPrice]);
  useEffect(() => setMaxPrice(initialFilters.maxPrice), [initialFilters.maxPrice]);
  useEffect(() => {
    if (search === initialFilters.search) return;
    const timer = window.setTimeout(() => navigate({ q: search || null }), 350);
    return () => window.clearTimeout(timer);
    // `navigate` intentionally reflects the current URL on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, initialFilters.search]);
  useEffect(() => {
    if (minPrice === initialFilters.minPrice && maxPrice === initialFilters.maxPrice) return;
    const timer = window.setTimeout(
      () => navigate({ minPrice: minPrice || null, maxPrice: maxPrice || null }),
      450,
    );
    return () => window.clearTimeout(timer);
    // `navigate` intentionally reflects the current URL on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, maxPrice, initialFilters.minPrice, initialFilters.maxPrice]);

  useEffect(() => {
    if (!mobileOpen) return;
    closeButtonRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const buttonEl = filterButtonRef.current;
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
      buttonEl?.focus();
    };
  }, [mobileOpen]);

  const clear = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    navigate({ q: null, category: null, minPrice: null, maxPrice: null, rating: null });
  };
  const filterProps: FilterFieldProps = {
    categories: initialFilters.categories,
    availableCategories: results.categories,
    setCategories: (categories) => navigate({ category: categories }),
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    minRating: initialFilters.minRating,
    setMinRating: (value) => navigate({ rating: value ? String(value) : null }),
    clear,
  };
  const firstResult = results.total ? (results.page - 1) * results.pageSize + 1 : 0;
  const lastResult = Math.min(results.page * results.pageSize, results.total);

  return (
    <main id="main-content" className="site-container py-10 sm:py-[50px]" aria-busy={isPending}>
      <div className="mb-8 rounded-xl border border-[#e7dfcb] bg-cream p-4 sm:p-6">
        <label htmlFor="catalog-search" className="mb-2 block text-xs font-bold uppercase tracking-[.14em] text-gold-dark">Find something meaningful</label>
        <input id="catalog-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Quran, prayer mats, attar…" className="min-h-12 w-full rounded-md border border-[#cbc1a8] bg-white px-4 text-base text-forest outline-none placeholder:text-muted focus:ring-2 focus:ring-gold" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block" aria-label="Product filters"><FilterFields {...filterProps} /></aside>
        <section aria-labelledby="catalog-heading" className="relative">
          {isPending ? <div className="absolute inset-0 z-10 grid place-items-start justify-center bg-white/65 pt-28" role="status"><span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-forest shadow"><LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Updating products</span></div> : null}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#eee8d5] pb-4">
            <div>
              <h1 id="catalog-heading" className="font-heading text-2xl text-forest">The Maqbool collection</h1>
              <p className="mt-1 text-sm text-muted" role="status" aria-live="polite">
                {results.total === 0 ? "No products found" : `Showing ${firstResult}–${lastResult} of ${results.total} products`}
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <button ref={filterButtonRef} type="button" onClick={() => setMobileOpen(true)} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded border border-forest px-3 text-sm font-semibold text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:hidden">
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filters
              </button>
              <label className="sr-only" htmlFor="catalog-sort">Sort products</label>
              <select id="catalog-sort" value={initialFilters.sort} onChange={(event) => navigate({ sort: event.target.value === "featured" ? null : event.target.value })} className="min-h-11 flex-1 rounded border border-[#cfc8b6] bg-white px-3 text-sm text-forest outline-none focus:ring-2 focus:ring-gold sm:flex-none">
                <option value="featured">Most popular</option><option value="newest">Newest arrivals</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="rating">Highest rated</option>
              </select>
            </div>
          </div>
          {results.products.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{results.products.map((product) => <CatalogCard key={product.id} product={product} />)}</div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#cfc5aa] bg-cream px-6 py-16 text-center">
              <p className="font-heading text-2xl text-forest">No matches in this collection</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Try a broader search or clear your filters to see all of our carefully selected essentials.</p>
              <button type="button" onClick={clear} className="mt-6 min-h-11 rounded bg-forest px-6 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">Show all products</button>
            </div>
          )}
          {results.totalPages > 1 ? (
            <nav aria-label="Product pages" className="mt-10 flex flex-wrap justify-center gap-2">
              <button type="button" disabled={results.page === 1 || isPending} onClick={() => navigate({ page: String(results.page - 1) }, false)} className="min-h-11 rounded border border-[#d8d0bc] px-4 text-sm font-semibold text-forest disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
              {Array.from({ length: results.totalPages }, (_, index) => index + 1).map((number) => <button key={number} type="button" disabled={isPending} aria-current={results.page === number ? "page" : undefined} aria-label={`Page ${number}`} onClick={() => navigate({ page: number === 1 ? null : String(number) }, false)} className={`min-h-11 min-w-11 rounded border text-sm font-semibold ${results.page === number ? "border-forest bg-forest text-white" : "border-[#d8d0bc] text-forest"}`}>{number}</button>)}
              <button type="button" disabled={results.page === results.totalPages || isPending} onClick={() => navigate({ page: String(results.page + 1) }, false)} className="min-h-11 rounded border border-[#d8d0bc] px-4 text-sm font-semibold text-forest disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </nav>
          ) : null}
        </section>
      </div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-black/45" onClick={() => setMobileOpen(false)} tabIndex={-1} />
          <div ref={drawerRef} className="absolute inset-y-0 right-0 w-[min(90vw,390px)] overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-[#e3dec8] pb-4">
              <h2 id="mobile-filter-title" className="font-heading text-2xl text-forest">Refine collection</h2>
              <button ref={closeButtonRef} type="button" onClick={() => setMobileOpen(false)} aria-label="Close filters" className="flex h-11 w-11 items-center justify-center rounded-full text-forest focus-visible:ring-2 focus-visible:ring-gold"><X aria-hidden="true" /></button>
            </div>
            <FilterFields {...filterProps} />
            <button type="button" onClick={() => setMobileOpen(false)} className="mt-4 min-h-12 w-full rounded bg-forest px-5 text-sm font-semibold text-white">View {results.total} products</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
