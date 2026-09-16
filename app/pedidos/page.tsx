import { requireUser } from "@/lib/auth";
import OrdersClient from "./orders-client";

export default async function OrdersPage() {
  await requireUser("ADMIN");
  return <OrdersClient />;
}
