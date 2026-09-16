import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db, Destination } from "@/lib/db";
import { sentOrders, tableByNumber } from "@/lib/tables";

type InputItem = {
  id?: number;
  name?: string;
  price?: number;
  quantity?: number;
  destination?: Destination;
  notes?: string;
  custom?: boolean;
};

export async function POST(request: Request, context: RouteContext<"/api/tables/[numero]/orders">) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  const number = Number((await context.params).numero);
  const table = Number.isInteger(number) ? await tableByNumber(number) : null;
  if (!table) return NextResponse.json({ message: "Mesa não encontrada." }, { status: 404 });
  if (table.status !== "OCCUPIED") return NextResponse.json({ message: "A mesa não está aberta para pedidos." }, { status: 409 });

  const body = await request.json().catch(() => null) as { items?: InputItem[] } | null;
  if (!Array.isArray(body?.items) || body.items.length === 0 || body.items.length > 100) {
    return NextResponse.json({ message: "Adicione ao menos um item ao pedido." }, { status: 400 });
  }

  try {
    const { data: orderId, error } = await db().rpc("sabom_send_order", { p_table_id: table.id, p_user_id: user.id, p_items: body.items });
    if (error) return NextResponse.json({ message: error.code === "P0001" ? error.message : "Não foi possível enviar o pedido." }, { status: error.code === "P0001" ? 400 : 503 });
    const order = (await sentOrders(table.id)).find((item) => item.id === orderId);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Não foi possível enviar o pedido." }, { status: 400 });
  }
}
