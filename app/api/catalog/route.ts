import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  if ((await currentUser())?.role !== "ADMIN") return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  const [products, categories] = await Promise.all([
    db().from("products").select("*").order("name"),
    db().from("categories").select("id, name").eq("active", 1).order("name"),
  ]);
  if (products.error || categories.error) return NextResponse.json({ message: "Não foi possível carregar o cardápio." }, { status: 503 });
  return NextResponse.json({ products: products.data, categories: categories.data });
}

export async function POST(request: Request) { return save(request, false); }
export async function PATCH(request: Request) { return save(request, true); }

async function save(request: Request, editing: boolean) {
  if ((await currentUser())?.role !== "ADMIN") return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  if (body.kind === "category" && !editing) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 60) return NextResponse.json({ message: "Informe uma categoria com até 60 caracteres." }, { status: 400 });
    const { error } = await db().from("categories").insert({ name });
    return error ? NextResponse.json({ message: error.code === "23505" ? "Categoria já cadastrada." : "Não foi possível salvar." }, { status: error.code === "23505" ? 409 : 503 }) : NextResponse.json({ ok: true }, { status: 201 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const price = body.price;
  if (!name || name.length > 80 || typeof price !== "number" || !Number.isFinite(price) || price < 0 || price > 999999.99 || Math.abs(price * 100 - Math.round(price * 100)) > 0.00001 || !["KITCHEN", "BAR"].includes(body.destination) || !Number.isSafeInteger(body.category_id) || ![0, 1].includes(body.active) || (editing && !Number.isSafeInteger(body.id))) {
    return NextResponse.json({ message: "Confira nome, preço (até duas casas decimais), categoria e destino." }, { status: 400 });
  }
  const { data: category, error: categoryError } = await db().from("categories").select("id").eq("id", body.category_id).eq("active", 1).maybeSingle();
  if (categoryError) return NextResponse.json({ message: "Não foi possível consultar a categoria." }, { status: 503 });
  if (!category) return NextResponse.json({ message: "Categoria indisponível." }, { status: 400 });
  const values = { name, price, category_id: body.category_id, destination: body.destination, active: body.active };
  const query = editing ? db().from("products").update(values).eq("id", body.id) : db().from("products").insert(values);
  const { data, error } = await query.select("id").maybeSingle();
  if (error) return NextResponse.json({ message: "Não foi possível salvar o produto." }, { status: 503 });
  if (!data) return NextResponse.json({ message: "Produto não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true }, { status: editing ? 200 : 201 });
}
