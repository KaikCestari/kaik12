import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db, passwordHash, UserRole } from "@/lib/db";

export async function GET() {
  const actor = await currentUser();
  if (actor?.role !== "ADMIN") return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  const { data: users, error } = await db().from("users").select("id, name, username, role, active, created_at").order("name");
  if (error) return NextResponse.json({ message: "Não foi possível listar usuários." }, { status: 503 });
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const actor = await currentUser();
  if (actor?.role !== "ADMIN") return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  const body = await request.json().catch(() => null) as { name?: string; username?: string; password?: string; role?: UserRole } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!name || name.length > 120 || !username || username.length > 80 || password.length < 12 || password.length > 128 || !["ADMIN", "WAITER"].includes(body?.role ?? "")) return NextResponse.json({ message: "Preencha os campos; a senha deve ter entre 12 e 128 caracteres." }, { status: 400 });
  const { data, error } = await db().from("users").insert({ name, username, password_hash: passwordHash(password), role: body!.role }).select("id").single();
  if (error) return NextResponse.json({ message: error.code === "23505" ? "Este nome de usuário já está em uso." : "Não foi possível criar o usuário." }, { status: error.code === "23505" ? 409 : 503 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
