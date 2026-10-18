"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  ImageIcon,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { deleteProduct } from "@/app/admin/products/actions";
import type {
  AdminCatalogCategory,
  AdminCatalogFaq,
  AdminCatalogProduct,
  AdminCatalogVariant,
  ProductInput,
  ProductSaveResult,
} from "@/components/admin/catalog-types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageHeader, AdminPanel, EmptyAdminState, StatusPill } from "./admin-ui";
import { ProductImageManager } from "./product-image-manager";
import { parseProductDraft, serializeProductDraft } from "@/lib/admin-product-draft";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function ProductManager({
  initialProducts,
  categories,
}: {
  initialProducts: AdminCatalogProduct[];
  categories: AdminCatalogCategory[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [deleting, setDeleting] = useState<AdminCatalogProduct | null>(null);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      initialProducts.filter((product) => {
        const matchesQuery = `${product.name} ${product.slug}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesCategory = category === "all" || product.categoryId === category;
        const matchesStatus =
          status === "all" ||
          (status === "active" ? product.isActive : !product.isActive);
        return matchesQuery && matchesCategory && matchesStatus;
      }),
    [category, initialProducts, query, status],
  );

  function remove() {
    if (!deleting) return;
    setActionError("");
    startTransition(async () => {
      const result = await deleteProduct(deleting.id, deleting.slug);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      setDeleting(null);
      setMessage(result.message);
      router.refresh();
    });
  }

  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">{message}</div>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Products"
        description="Create and maintain products, pricing, variants, stock, and storefront content."
        action={
          <Button asChild className="min-h-11 bg-[#123d32] hover:bg-[#1a5445]">
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add product
            </Link>
          </Button>
        }
      />
      {actionError && !deleting && (
        <p role="alert" className="mb-4 rounded-lg border border-[#edc8bf] bg-[#fff1ee] p-3 text-sm text-[#8d3426]">
          {actionError}
        </p>
      )}
      <AdminPanel>
        <div className="grid gap-3 border-b border-[#e8e3d8] p-4 md:grid-cols-[1fr_220px_160px]">
          <label className="relative">
            <span className="sr-only">Search products</span>
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#718079]" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search name or slug…" />
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <Select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full">
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full">
              <option value="all">Any status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </label>
        </div>
        {filtered.length ? (
          <Table>
            <thead className="bg-[#f8f6f0] text-[11px] uppercase tracking-[.12em] text-[#69766f]">
              <tr>
                <th scope="col" className="px-5 py-3 font-bold">Product</th>
                <th scope="col" className="px-4 py-3 font-bold">Price</th>
                <th scope="col" className="px-4 py-3 font-bold">Stock</th>
                <th scope="col" className="px-4 py-3 font-bold">Order</th>
                <th scope="col" className="px-4 py-3 font-bold">Status</th>
                <th scope="col" className="px-5 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee9df]">
              {filtered.map((product) => {
                const stock = product.variants.reduce((sum, item) => sum + item.stock, 0);
                const image = product.images.find((item) => item.isFeatured) ?? product.images[0];
                return (
                  <tr key={product.id} className="hover:bg-[#fbfaf7]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {image?.secureUrl ? (
                          <img src={image.secureUrl} alt="" className="h-12 w-12 rounded-lg bg-[#eee9df] object-cover" />
                        ) : (
                          <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#eee9df]">
                            <ImageIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                        <div>
                          <p className="font-bold text-[#263d35]">{product.name}</p>
                          <p className="text-xs text-[#74807b]">{product.categoryName} · /{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold text-[#123d32]">{currency.format(product.price)}</td>
                    <td className="px-4 py-4">
                      <span className={stock < 10 ? "font-bold text-[#9a4f22]" : ""}>{stock}</span>
                      <p className="text-xs text-[#74807b]">{product.variants.length} variant{product.variants.length === 1 ? "" : "s"}</p>
                    </td>
                    <td className="px-4 py-4">{product.displayOrder}</td>
                    <td className="px-4 py-4"><StatusPill active={product.isActive} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="grid min-h-11 min-w-11 place-items-center rounded-lg text-[#35584d] hover:bg-[#e8f0ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b58a2c]"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Edit3 className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <button
                          onClick={() => {
                            setActionError("");
                            setDeleting(product);
                          }}
                          className="grid min-h-11 min-w-11 place-items-center rounded-lg text-[#9a3d2e] hover:bg-[#fff0ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a34838]"
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyAdminState title="No products found" description="Adjust your filters or create a new product to populate the catalog." />
        )}
      </AdminPanel>
      <Dialog
        open={Boolean(deleting)}
        onClose={() => !isPending && setDeleting(null)}
        title="Delete product?"
      >
        <p className="text-sm leading-6 text-[#65736d]">
          This permanently removes <strong>{deleting?.name}</strong> and its catalog content.
        </p>
        {actionError && <p role="alert" className="mt-4 text-sm text-[#8d3426]">{actionError}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" disabled={isPending} onClick={() => setDeleting(null)}>Cancel</Button>
          <Button disabled={isPending} aria-busy={isPending} className="bg-[#9a3d2e] hover:bg-[#7d3024]" onClick={remove}>
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

function editableProduct(product: AdminCatalogProduct): ProductInput {
  const input = { ...product };
  delete (input as Partial<AdminCatalogProduct>).categoryName;
  delete (input as Partial<AdminCatalogProduct>).images;
  return input;
}

export function ProductForm({
  product,
  categories,
  storageKey,
  initialMessage = "",
  onCancel,
  onSave,
}: {
  product: AdminCatalogProduct;
  categories: AdminCatalogCategory[];
  storageKey: string;
  initialMessage?: string;
  onCancel: () => void;
  onSave: (product: ProductInput) => Promise<ProductSaveResult>;
}) {
  const [draft, setDraft] = useState(() => structuredClone(product));
  const [validationError, setValidationError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [isPending, setIsPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [restored, setRestored] = useState(false);
  const baselineRef = useRef(JSON.stringify(editableProduct(product)));
  const currentInput = editableProduct(draft);
  const currentSerialized = JSON.stringify(currentInput);
  const dirty = currentSerialized !== baselineRef.current;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = parseProductDraft(stored, product.id);
        if (parsed) {
          setDraft({ ...structuredClone(product), ...parsed });
          setRestored(true);
          setMessage("Unsaved draft restored.");
        } else {
          window.localStorage.removeItem(storageKey);
        }
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setHydrated(true);
    }
  }, [product, storageKey]);

  useEffect(() => {
    if (!hydrated || !dirty || isPending) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, serializeProductDraft(currentInput));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [currentInput, dirty, hydrated, isPending, storageKey]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setActionError("");
    setMessage("");
    const slug = draft.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!draft.name.trim() || !slug || !draft.categoryId || draft.price < 0) {
      setValidationError("Add a name, slug, category, and a valid base price.");
      return;
    }
    if (draft.variants.some((variant) => !variant.sku.trim())) {
      setValidationError("Every variant needs a unique SKU.");
      return;
    }
    setValidationError("");
    const input = { ...editableProduct(draft), name: draft.name.trim(), slug };
    setIsPending(true);
    const result = await onSave(input);
    setIsPending(false);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    baselineRef.current = JSON.stringify(input);
    window.localStorage.removeItem(storageKey);
    setRestored(false);
    setMessage(result.message);
  }

  function discardRestoredDraft() {
    window.localStorage.removeItem(storageKey);
    setDraft(structuredClone(product));
    baselineRef.current = JSON.stringify(editableProduct(product));
    setRestored(false);
    setMessage("Restored draft discarded.");
    setValidationError("");
    setActionError("");
  }

  function cancel() {
    if (dirty && !window.confirm("Discard your unsaved product changes?")) return;
    window.localStorage.removeItem(storageKey);
    onCancel();
  }

  return (
    <form onSubmit={submit} className="space-y-7" noValidate>
      {message && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#b9d8c9] bg-[#edf7f1] p-3 text-sm text-[#245844]">
          <span>{message}</span>
          {restored && (
            <button type="button" onClick={discardRestoredDraft} className="min-h-11 rounded-md px-3 font-bold text-[#8d3426] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b58a2c]">
              Discard restored draft
            </button>
          )}
        </div>
      )}
      {(validationError || actionError) && (
        <p role="alert" className="rounded-lg bg-[#fff1ee] p-3 text-sm text-[#8d3426]">
          {validationError || actionError}
        </p>
      )}
      <fieldset className="space-y-4">
        <legend className="mb-3 font-bold text-[#123d32]">Basic details</legend>
        <Field label="Name" htmlFor="product-name" required>
          <Input id="product-name" required aria-required="true" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug" htmlFor="product-slug" required>
            <Input id="product-slug" required aria-required="true" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} />
          </Field>
          <Field label="Category" htmlFor="product-category" required>
            <Select id="product-category" required aria-required="true" value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })} className="w-full">
              <option value="">Choose category</option>
              {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Description" htmlFor="product-description">
          <Textarea id="product-description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        </Field>
        <div className="rounded-xl border border-[#e5dfd2] bg-[#faf9f5] p-4">
          <h3 className="mb-3 font-bold text-[#123d32]">Search engine preview</h3>
          <Field label="SEO title" htmlFor="product-seo-title">
            <Input id="product-seo-title" maxLength={70} value={draft.seoTitle} onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })} placeholder={draft.name || "Product page title"} />
          </Field>
          <div className="mt-4"><Field label="Meta description" htmlFor="product-seo-description">
            <Textarea id="product-seo-description" maxLength={160} value={draft.seoDescription} onChange={(event) => setDraft({ ...draft, seoDescription: event.target.value })} placeholder="Short description shown by search engines" />
          </Field></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="India base price (INR)" htmlFor="product-price" required>
            <Input id="product-price" type="number" min="0" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} />
          </Field>
          <Field label="India compare-at price (INR)" htmlFor="product-compare-price">
            <Input id="product-compare-price" type="number" min="0" step="0.01" value={draft.compareAtPrice ?? ""} onChange={(event) => setDraft({ ...draft, compareAtPrice: event.target.value ? Number(event.target.value) : null })} />
          </Field>
          <Field label="Badge" htmlFor="product-badge">
            <Input id="product-badge" value={draft.badge} onChange={(event) => setDraft({ ...draft, badge: event.target.value })} />
          </Field>
          <Field label="Display order" htmlFor="product-order">
            <Input id="product-order" type="number" min="0" step="1" value={draft.displayOrder} onChange={(event) => setDraft({ ...draft, displayOrder: Number(event.target.value) })} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-5">
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <Checkbox checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /> Active
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <Checkbox checked={draft.isFeatured} onChange={(event) => setDraft({ ...draft, isFeatured: event.target.checked })} /> Featured
          </label>
        </div>
      </fieldset>

      <EditorSection
        title="Variants"
        onAdd={() =>
          setDraft({
            ...draft,
            variants: [
              ...draft.variants,
              {
                sku: "",
                name: "Option",
                value: "",
                price: draft.price,
                compareAtPrice: null,
                stock: 0,
                color: "",
                imageUrl: "",
                isActive: true,
                displayOrder: draft.variants.length,
              },
            ],
          })
        }
      >
        {draft.variants.map((variant, index) => (
          <VariantEditor
            key={variant.id ?? `variant-${index}`}
            variant={variant}
            index={index}
            count={draft.variants.length}
            onChange={(next) => setDraft({ ...draft, variants: draft.variants.map((item, itemIndex) => itemIndex === index ? next : item) })}
            onMove={(direction) => setDraft({ ...draft, variants: move(draft.variants, index, direction) })}
            onRemove={() => setDraft({ ...draft, variants: draft.variants.filter((_, itemIndex) => itemIndex !== index) })}
          />
        ))}
      </EditorSection>

      <EditorSection
        title="Product information"
        onAdd={() => setDraft({ ...draft, information: [...draft.information, { label: "", value: "", displayOrder: draft.information.length }] })}
      >
        {draft.information.map((row, index) => (
          <OrderedRow
            key={row.id ?? `information-${index}`}
            index={index}
            count={draft.information.length}
            label={`Information row ${index + 1}`}
            onMove={(direction) => setDraft({ ...draft, information: move(draft.information, index, direction) })}
            onRemove={() => setDraft({ ...draft, information: draft.information.filter((_, itemIndex) => itemIndex !== index) })}
          >
            <Input aria-label={`Information ${index + 1} label`} placeholder="Label" value={row.label} onChange={(event) => setDraft({ ...draft, information: updateAt(draft.information, index, { ...row, label: event.target.value }) })} />
            <Input aria-label={`Information ${index + 1} value`} placeholder="Value" value={row.value} onChange={(event) => setDraft({ ...draft, information: updateAt(draft.information, index, { ...row, value: event.target.value }) })} />
          </OrderedRow>
        ))}
      </EditorSection>

      <EditorSection
        title="FAQs"
        onAdd={() => setDraft({ ...draft, faqs: [...draft.faqs, { question: "", answer: "", isActive: true, displayOrder: draft.faqs.length }] })}
      >
        {draft.faqs.map((faq, index) => (
          <FaqEditor
            key={faq.id ?? `faq-${index}`}
            faq={faq}
            index={index}
            count={draft.faqs.length}
            onChange={(next) => setDraft({ ...draft, faqs: updateAt(draft.faqs, index, next) })}
            onMove={(direction) => setDraft({ ...draft, faqs: move(draft.faqs, index, direction) })}
            onRemove={() => setDraft({ ...draft, faqs: draft.faqs.filter((_, itemIndex) => itemIndex !== index) })}
          />
        ))}
      </EditorSection>

      {draft.id === "new" ? (
        <section aria-labelledby="product-media-heading" className="rounded-xl border border-dashed border-[#d7cfbd] bg-[#fbfaf7] p-4">
          <h3 id="product-media-heading" className="font-bold text-[#123d32]">Product images</h3>
          <p className="mt-1 text-sm leading-6 text-[#69756f]">Save the product before uploading images.</p>
        </section>
      ) : (
        <ProductImageManager
          productId={draft.id}
          productName={draft.name}
          initialImages={draft.images}
          colorVariants={draft.variants.flatMap((variant) =>
            variant.id ? [{ id: variant.id, label: `${variant.name}: ${variant.value}` }] : [],
          )}
        />
      )}

      <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white pt-4">
        <Button type="button" variant="outline" disabled={isPending} onClick={cancel} className="min-h-11">Cancel</Button>
        <Button type="submit" disabled={isPending} aria-busy={isPending} className="min-h-11 bg-[#123d32] hover:bg-[#1a5445]">
          {isPending ? "Saving…" : "Save product"}
        </Button>
      </div>
    </form>
  );
}

function VariantEditor({
  variant,
  index,
  count,
  onChange,
  onMove,
  onRemove,
}: {
  variant: AdminCatalogVariant;
  index: number;
  count: number;
  onChange: (variant: AdminCatalogVariant) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg bg-[#f8f6f0] p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[.12em] text-[#69766f]">Variant {index + 1}</p>
        <OrderControls index={index} count={count} label={`variant ${index + 1}`} onMove={onMove} onRemove={onRemove} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input aria-label={`Variant ${index + 1} type`} placeholder="Type (e.g. Size)" value={variant.name} onChange={(event) => onChange({ ...variant, name: event.target.value })} />
        <Input aria-label={`Variant ${index + 1} value`} placeholder="Value" value={variant.value} onChange={(event) => onChange({ ...variant, value: event.target.value })} />
        <Input aria-label={`Variant ${index + 1} SKU`} placeholder="SKU" value={variant.sku} onChange={(event) => onChange({ ...variant, sku: event.target.value })} />
        <Input aria-label={`Variant ${index + 1} color`} placeholder="Colour" value={variant.color} onChange={(event) => onChange({ ...variant, color: event.target.value })} />
        <Input aria-label={`Variant ${index + 1} price`} type="number" min="0" step="0.01" placeholder="Price" value={variant.price} onChange={(event) => onChange({ ...variant, price: Number(event.target.value) })} />
        <Input aria-label={`Variant ${index + 1} compare-at price`} type="number" min="0" step="0.01" placeholder="Compare-at price" value={variant.compareAtPrice ?? ""} onChange={(event) => onChange({ ...variant, compareAtPrice: event.target.value ? Number(event.target.value) : null })} />
        <Input aria-label={`Variant ${index + 1} stock`} type="number" min="0" step="1" placeholder="Stock" value={variant.stock} onChange={(event) => onChange({ ...variant, stock: Number(event.target.value) })} />
        <label className="flex min-h-11 items-center gap-2 px-1 text-sm font-semibold">
          <Checkbox checked={variant.isActive} onChange={(event) => onChange({ ...variant, isActive: event.target.checked })} /> Active
        </label>
      </div>
    </div>
  );
}

function FaqEditor({
  faq,
  index,
  count,
  onChange,
  onMove,
  onRemove,
}: {
  faq: AdminCatalogFaq;
  index: number;
  count: number;
  onChange: (faq: AdminCatalogFaq) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg bg-[#f8f6f0] p-3">
      <div className="mb-2 flex gap-2">
        <Input aria-label={`FAQ ${index + 1} question`} placeholder="Question" value={faq.question} onChange={(event) => onChange({ ...faq, question: event.target.value })} />
        <OrderControls index={index} count={count} label={`FAQ ${index + 1}`} onMove={onMove} onRemove={onRemove} />
      </div>
      <Textarea aria-label={`FAQ ${index + 1} answer`} placeholder="Answer" className="min-h-20" value={faq.answer} onChange={(event) => onChange({ ...faq, answer: event.target.value })} />
      <label className="mt-2 flex min-h-11 items-center gap-2 text-sm font-semibold">
        <Checkbox checked={faq.isActive} onChange={(event) => onChange({ ...faq, isActive: event.target.checked })} /> Active
      </label>
    </div>
  );
}

function OrderedRow({
  index,
  count,
  label,
  onMove,
  onRemove,
  children,
}: {
  index: number;
  count: number;
  label: string;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 rounded-lg bg-[#f8f6f0] p-3 sm:grid-cols-[1fr_1fr_auto]">
      {children}
      <OrderControls index={index} count={count} label={label} onMove={onMove} onRemove={onRemove} />
    </div>
  );
}

function OrderControls({
  index,
  count,
  label,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  label: string;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex">
      <IconButton label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp className="h-4 w-4" /></IconButton>
      <IconButton label={`Move ${label} down`} disabled={index === count - 1} onClick={() => onMove(1)}><ArrowDown className="h-4 w-4" /></IconButton>
      <IconButton label={`Remove ${label}`} destructive onClick={onRemove}><X className="h-4 w-4" /></IconButton>
    </div>
  );
}

function IconButton({
  label,
  disabled,
  destructive,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  destructive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid min-h-11 min-w-11 place-items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b58a2c] disabled:opacity-30 ${destructive ? "text-[#9a3d2e] hover:bg-[#ffebe7]" : "text-[#35584d] hover:bg-[#e8f0ec]"}`}
    >
      {children}
    </button>
  );
}

function EditorSection({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <div className="mb-3 flex items-center justify-between">
        <legend className="font-bold text-[#123d32]">{title}</legend>
        <button type="button" onClick={onAdd} className="inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-bold text-[#73571d] hover:bg-[#f1ead9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b58a2c]">
          <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Add
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      {children}
    </div>
  );
}

function updateAt<T>(items: T[], index: number, value: T) {
  return items.map((item, itemIndex) => itemIndex === index ? value : item);
}

function move<T extends { displayOrder: number }>(items: T[], index: number, direction: -1 | 1) {
  const destination = index + direction;
  if (destination < 0 || destination >= items.length) return items;
  const next = [...items];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next.map((item, displayOrder) => ({ ...item, displayOrder }));
}
