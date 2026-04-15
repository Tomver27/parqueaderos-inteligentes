"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Detects Supabase implicit-flow hash fragments (#access_token=...&type=invite)
 * that arrive on auth pages. Parses the tokens from the hash, establishes the
 * session explicitly, then redirects based on user metadata.
 */
export default function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) return;

    // Parse the hash fragment manually
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) return;

    const supabase = createClient();

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data: { user } }) => {
        // Clear hash from the URL
        window.history.replaceState(null, "", window.location.pathname);

        if (user?.user_metadata?.needs_password_setup) {
          router.replace("/set-password");
        } else {
          router.replace("/");
        }
      });
  }, [router]);

  return null;
}
