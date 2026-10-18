"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AdminCategoryRecord, AdminProductRecord, OrderStatus } from "@/lib/models";
import { readStorage, STORAGE_KEYS, writeStorage } from "@/lib/storage";
import { freshAdminDemoState, type AdminDemoState } from "./admin-fixtures";

type AdminStoreValue = AdminDemoState & {
  hydrated: boolean;
  saveProduct: (product: AdminProductRecord) => void;
  deleteProduct: (id: string) => void;
  saveCategory: (category: AdminCategoryRecord) => void;
  deleteCategory: (id: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  resetDemo: () => void;
};

const AdminStoreContext = createContext<AdminStoreValue | null>(null);

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdminDemoState>(freshAdminDemoState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readStorage(STORAGE_KEYS.adminDemo, freshAdminDemoState()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(STORAGE_KEYS.adminDemo, state);
  }, [hydrated, state]);

  const saveProduct = useCallback((product: AdminProductRecord) => {
    setState((current) => ({
      ...current,
      products: current.products.some((item) => item.id === product.id)
        ? current.products.map((item) => item.id === product.id ? product : item)
        : [product, ...current.products],
    }));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setState((current) => ({ ...current, products: current.products.filter((item) => item.id !== id) }));
  }, []);

  const saveCategory = useCallback((category: AdminCategoryRecord) => {
    setState((current) => ({
      ...current,
      categories: current.categories.some((item) => item.id === category.id)
        ? current.categories.map((item) => item.id === category.id ? category : item)
        : [category, ...current.categories],
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState((current) => ({ ...current, categories: current.categories.filter((item) => item.id !== id) }));
  }, []);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setState((current) => ({
      ...current,
      orders: current.orders.map((order) => order.id === id ? { ...order, status } : order),
    }));
  }, []);

  const resetDemo = useCallback(() => setState(freshAdminDemoState()), []);

  const value = useMemo(() => ({
    ...state,
    hydrated,
    saveProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    updateOrderStatus,
    resetDemo,
  }), [deleteCategory, deleteProduct, hydrated, resetDemo, saveCategory, saveProduct, state, updateOrderStatus]);

  return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>;
}

export function useAdminStore() {
  const value = useContext(AdminStoreContext);
  if (!value) throw new Error("useAdminStore must be used within AdminStoreProvider");
  return value;
}
