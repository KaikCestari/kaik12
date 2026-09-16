import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { activeProducts, sentOrders, tableByNumber } from "@/lib/tables";

function tableNumber(value: string) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export async function GET(_request: Request, context: RouteContext<"/api/tables/[numero]">) {
  if (!await currentUser()) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  const number = tableNumber((await context.params).numero);
  const table = number ? await tableByNumber(number) : null;
  if (!table) return NextResponse.json({ message: "Mesa não encontrada." }, { status: 404 });
  return NextResponse.json({ table, products: await activeProducts(), orders: await sentOrders(table.id) });
}

export async function PATCH(request: Request, context: RouteContext<"/api/tables/[numero]">) {
  if (!await currentUser()) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  const number = tableNumber((await context.params).numero);
  const body = await request.json().catch(() => null) as { name?: string } | null;
  const name = body?.name?.trim();
  if (!number || !name || name.length > 60) {
    return NextResponse.json({ message: "Informe um nome válido para o atendimento." }, { status: 400 });
  }
  const { data, error } = await db().from("dining_tables").update({ current_name: name, status: "OCCUPIED", opened_at: new Date().toISOString() }).eq("number", number).eq("status", "AVAILABLE").select("id");
  if (error) return NextResponse.json({ message: "Não foi possível abrir a mesa." }, { status: 503 });
  if (!data.length) return NextResponse.json({ message: "Esta mesa já está em atendimento ou não existe." }, { status: 409 });
  return NextResponse.json({ table: await tableByNumber(number) });
}
