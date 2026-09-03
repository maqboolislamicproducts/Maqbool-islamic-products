"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Address, CustomerSession, MockOrder } from "@/lib/models";
import { readStorage, STORAGE_KEYS, writeStorage } from "@/lib/storage";
import { syncCustomerOrderStatuses } from "@/app/profile/orders/actions";

type CustomerContextValue = {
  customer: CustomerSession | null;
  addresses: Address[];
  orders: MockOrder[];
  login: (name: string, phone: string, email?: string) => void;
  logout: () => void;
  saveAddress: (address: Address) => void;
  removeAddress: (id: string) => void;
  addOrder: (order: MockOrder) => void;
};
const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setCustomer(readStorage(STORAGE_KEYS.customer, null));
    setAddresses(readStorage(STORAGE_KEYS.addresses, []));
    setOrders(readStorage(STORAGE_KEYS.orders, []));
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) writeStorage(STORAGE_KEYS.customer, customer); }, [customer, hydrated]);
  useEffect(() => { if (hydrated) writeStorage(STORAGE_KEYS.addresses, addresses); }, [addresses, hydrated]);
  useEffect(() => { if (hydrated) writeStorage(STORAGE_KEYS.orders, orders); }, [orders, hydrated]);
  const orderIdentity = orders.map((order) => `${order.id}:${order.status}`).join("|");
  useEffect(() => {
    if (!hydrated || !customer || !orders.length) return;
    let active = true;
    const sync = async () => {
      const result = await syncCustomerOrderStatuses({
        phone: customer.phone,
        orderNumbers: orders.map((order) => order.id),
      });
      if (!active || !result.ok) return;
      const statusByOrder = new Map(result.orders.map((order) => [order.orderNumber, order]));
      setOrders((current) => {
        let changed = false;
        const next = current.map((order) => {
          const synced = statusByOrder.get(order.id);
          if (!synced || (synced.status === order.status && synced.paymentStatus === order.paymentStatus)) return order;
          changed = true;
          return { ...order, status: synced.status, paymentStatus: synced.paymentStatus };
        });
        return changed ? next : current;
      });
    };
    void sync();
    const onFocus = () => void sync();
    const onVisibility = () => { if (document.visibilityState === "visible") void sync(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [customer, hydrated, orderIdentity]);

  const value = useMemo<CustomerContextValue>(() => ({
    customer,
    addresses,
    orders,
    login: (name, phone, email) => setCustomer({ name, phone, email, verifiedAt: new Date().toISOString() }),
    logout: () => setCustomer(null),
    saveAddress: (address) => setAddresses((current) => {
      const exists = current.some((item) => item.id === address.id);
      return exists ? current.map((item) => item.id === address.id ? address : item) : [...current, address];
    }),
    removeAddress: (id) => setAddresses((current) => current.filter((address) => address.id !== id)),
    addOrder: (order) => setOrders((current) => [order, ...current]),
  }), [addresses, customer, orders]);
  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer() {
  const value = useContext(CustomerContext);
  if (!value) throw new Error("useCustomer must be used within CustomerProvider");
  return value;
}
