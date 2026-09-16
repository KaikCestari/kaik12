import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { db, SafeUser } from "@/lib/db";
type UserRow = SafeUser & { password_hash: string; active: number };

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const acceptsJson = contentType.includes("application/json") || (request.headers.get("accept") ?? "").includes("application/json");
  let username = "";
  let password = "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null) as { username?: string; password?: string } | null;
    username = typeof body?.username === "string" ? body.username.trim() : "";
    password = typeof body?.password === "string" ? body.password : "";
  } else {
    const formData = await request.formData().catch(() => null);
    username = typeof formData?.get("username") === "string" ? String(formData.get("username")).trim() : "";
    password = typeof formData?.get("password") === "string" ? String(formData.get("password")) : "";
  }

  if (!username || username.length > 80 || !password || password.length > 128) return NextResponse.json({ message: "Informe usuário e senha válidos." }, { status: 400 });
  try {
    const { data, error } = await db().rpc("sabom_login_user", { p_username: username });
    if (error) {
      if (!acceptsJson) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Não foi possível acessar o banco de dados.")}`, request.url), 303);
      return NextResponse.json({ message: "Não foi possível acessar o banco de dados." }, { status: 503 });
    }
    const user = data as UserRow | null;
    if (!user || !user.active || !verifyPassword(password, user.password_hash)) {
      if (!acceptsJson) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Usuário ou senha inválidos.")}`, request.url), 303);
      return NextResponse.json({ message: "Usuário ou senha inválidos." }, { status: 401 });
    }
    const { token, expiresAt } = await createSession(user.id);
    if (!acceptsJson) {
      const response = NextResponse.redirect(new URL("/mesas", request.url), 303);
      response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(expiresAt * 1000) });
      return response;
    }
    const response = NextResponse.json({ user: { id: user.id, name: user.name, username: user.username, role: user.role } });
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(expiresAt * 1000) });
    return response;
  } catch {
    if (!acceptsJson) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Serviço de acesso indisponível. Entre em contato com o administrador.")}`, request.url), 303);
    return NextResponse.json({ message: "Serviço de acesso indisponível. Entre em contato com o administrador." }, { status: 503 });
  }
}
