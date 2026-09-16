import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, SafeUser } from "./db";

export const SESSION_COOKIE = "sabom_session";
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 12;
  const { error } = await db().from("sessions").insert({ token_hash: tokenHash(token), user_id: userId, expires_at: expiresAt });
  if (error) throw error;
  return { token, expiresAt };
}

export async function deleteSession(token: string) {
  const { error } = await db().from("sessions").delete().eq("token_hash", tokenHash(token));
  if (error) throw error;
}

export async function userForToken(token?: string): Promise<SafeUser | null> {
  if (!token) return null;
  const { data: session, error } = await db().from("sessions").select("user_id").eq("token_hash", tokenHash(token)).gt("expires_at", Math.floor(Date.now() / 1000)).maybeSingle();
  if (error) throw error;
  if (!session) return null;
  const { data: user, error: userError } = await db().from("users").select("id, name, username, role").eq("id", session.user_id).eq("active", 1).maybeSingle();
  if (userError) throw userError;
  return user as SafeUser | null;
}

export async function currentUser() { return userForToken((await cookies()).get(SESSION_COOKIE)?.value); }
export async function requireUser(role?: "ADMIN") {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect("/mesas");
  return user;
}
