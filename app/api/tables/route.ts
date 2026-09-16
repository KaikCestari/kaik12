import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { listTables } from "@/lib/tables";

export async function GET() {
  if (!await currentUser()) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  return NextResponse.json({ tables: await listTables() });
}
