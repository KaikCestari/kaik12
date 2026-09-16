import { requireUser } from "@/lib/auth";
import UsersClient from "./users-client";
export default async function UsersPage() { await requireUser("ADMIN"); return <UsersClient />; }
