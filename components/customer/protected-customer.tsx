"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useCustomer } from "@/components/providers/customer-provider";

export function ProtectedCustomer({ children }: { children: React.ReactNode }) {
  const { customer, ready: customerReady } = useCustomer();
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!customerReady) return;
    if (!customer) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }
    setReady(true);
  }, [customer, customerReady, pathname, router]);

  if (!customerReady || !ready || !customer) {
    return (
      <main className="site-container grid min-h-[45vh] place-items-center" aria-busy="true">
        <p className="flex items-center gap-2 text-sm text-muted">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Checking your account…
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
