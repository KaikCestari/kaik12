import { requireUser } from "@/lib/auth";
import CatalogClient from "./catalog-client";
export default async function CatalogPage() { await requireUser("ADMIN"); return <CatalogClient />; }
