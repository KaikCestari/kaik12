"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SafeUser } from "@/lib/db";

export function useCurrentUser() {
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/me", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) { router.replace("/login"); return; }
      setUser((await response.json()).user);
    }).catch((error: unknown) => {
      if (error instanceof Error && error.name !== "AbortError") router.replace("/login");
    });
    return () => controller.abort();
  }, [router]);
  async function logout() {
    try { await fetch("/api/auth/logout", { method: "POST" }); }
    finally { router.replace("/login"); router.refresh(); }
  }
  return { user, logout };
}
