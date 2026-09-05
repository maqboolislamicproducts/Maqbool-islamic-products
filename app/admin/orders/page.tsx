import { OrderManager } from "@/components/admin/order-manager";
import { getAdminOrders } from "./actions";
import { reconcileStaleOnlineOrders } from "@/lib/order-reconciliation";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await reconcileStaleOnlineOrders();
  return <OrderManager initialOrders={await getAdminOrders()} />;
}
