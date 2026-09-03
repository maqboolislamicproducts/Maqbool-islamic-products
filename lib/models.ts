export type ProductImage = {
  id: string;
  src: string;
  alt: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  value: string;
  price: number;
  originalPrice?: number;
  stock: number;
  color?: string;
  image?: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  createdAt: string;
  active: boolean;
  badge?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  specifications: Record<string, string>;
  faqs: Array<{ question: string; answer: string }>;
  reviews?: Array<{ id: string; name: string; rating: number; body: string; createdAt: string }>;
  marketSlug?: string;
  currencyCode?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
};

export type CartItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
  stock: number;
  marketSlug?: string;
  currencyCode?: string;
};

export type CustomerSession = {
  name: string;
  phone: string;
  email?: string;
  verifiedAt: string;
};

export type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  countryCode?: string;
};

export type OrderStatus = "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "cod" | "online";

export type MockOrder = {
  id: string;
  createdAt: string;
  customer: CustomerSession;
  address: Address;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  codCharge: number;
  tax?: number;
  taxLabel?: string;
  marketSlug?: string;
  currencyCode?: string;
  paymentStatus?: "pending" | "simulated" | "paid" | "failed" | "refunded";
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
};

export type AdminProductRecord = Product;
export type AdminCategoryRecord = Category;
export type AdminOrderRecord = MockOrder;
