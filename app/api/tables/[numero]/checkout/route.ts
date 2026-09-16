import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { tableByNumber } from "@/lib/tables";

export async function POST(request: Request, context: RouteContext<"/api/tables/[numero]/checkout">) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  const number = Number((await context.params).numero);
  const table = Number.isInteger(number) ? await tableByNumber(number) : null;
  if (!table) return NextResponse.json({ message: "Mesa não encontrada." }, { status: 404 });
  const body = await request.json().catch(() => null) as { action?: "REQUEST" | "CONFIRM" } | null;

  if (body?.action === "REQUEST") {
    if (table.status !== "OCCUPIED") return NextResponse.json({ message: "A mesa não está em atendimento." }, { status: 409 });
    const { error } = await db().rpc("sabom_checkout", { p_table_id: table.id, p_user_id: user.id, p_action: "REQUEST" });
    if (error) return NextResponse.json({ message: error.code === "P0001" ? error.message : "Não foi possível fechar a mesa." }, { status: error.code === "P0001" ? 409 : 503 });
    return NextResponse.json({ table: await tableByNumber(number) });
  }

  if (body?.action === "CONFIRM") {
    if (user.role !== "ADMIN") return NextResponse.json({ message: "Somente o administrador pode confirmar pagamentos." }, { status: 403 });
    if (table.status === "AVAILABLE") return NextResponse.json({ message: "A mesa já está livre." }, { status: 409 });
    const { error } = await db().rpc("sabom_checkout", { p_table_id: table.id, p_user_id: user.id, p_action: "CONFIRM" });
    if (error) return NextResponse.json({ message: error.code === "P0001" ? error.message : "Não foi possível confirmar o pagamento." }, { status: error.code === "P0001" ? 409 : 503 });
    return NextResponse.json({ table: await tableByNumber(number) });
  }

  return NextResponse.json({ message: "Ação inválida." }, { status: 400 });
}
