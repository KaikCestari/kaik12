import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { nightOrders } from "@/lib/orders";

export async function GET() {
  const user = await currentUser();
  if (user?.role !== "ADMIN") return NextResponse.json({ message: "Acesso restrito ao administrador." }, { status: 403 });
  return NextResponse.json({ orders: await nightOrders() });
}
