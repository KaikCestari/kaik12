import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes, scryptSync } from "node:crypto";

export type UserRole = "ADMIN" | "WAITER";
export type SafeUser = { id: number; name: string; username: string; role: UserRole };
export type TableStatus = "AVAILABLE" | "OCCUPIED" | "AWAITING_PAYMENT";
export type Destination = "KITCHEN" | "BAR";

let client: SupabaseClient | undefined;
export function db() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Configure SUPABASE_URL e SUPABASE_SECRET_KEY no servidor.");
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  return client;
}

export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
