import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
export async function GET() {
  if (!await currentUser()) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  const { data, error } = await db().from("sabom_preparation").select("*").order("sent_at").order("id");
  if (error) return NextResponse.json({ message: "Não foi possível carregar o preparo." }, { status: 503 });
  return NextResponse.json({ items: data });
}
export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || !Number.isSafeInteger(body.id) || !["PENDING", "PREPARING", "READY"].includes(body.expected)) return NextResponse.json({ message: "Item ou etapa inválida." }, { status: 400 });
  const { error } = await db().rpc("sabom_advance_preparation", { p_item_id: body.id, p_user_id: user.id, p_expected: body.expected });
  if (error) return NextResponse.json({ message: error.code === "P0001" ? error.message : "Não foi possível atualizar o preparo." }, { status: error.code === "P0001" ? 409 : 503 });
  return NextResponse.json({ ok: true });
}
