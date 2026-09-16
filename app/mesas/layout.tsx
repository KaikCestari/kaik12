import { requireUser } from "@/lib/auth";
export default async function MesasLayout({ children }: { children: React.ReactNode }) { await requireUser(); return children; }
