import { requireUser } from "@/lib/auth";
import PreparationClient from "./preparation-client";
export default async function PreparationPage() { await requireUser(); return <PreparationClient />; }
