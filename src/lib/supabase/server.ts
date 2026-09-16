import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { requirePublicEnv, serverEnv } from "@/lib/env";

/**
 * Supabase client gắn với cookie phiên của request hiện tại.
 * Dùng cho mọi thao tác cần biết "ai đang đăng nhập".
 */
export async function createClient() {
  const { supabaseUrl, supabaseAnonKey } = requirePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Gọi từ Server Component thì không set được cookie.
          // Middleware đã lo việc làm mới session nên bỏ qua an toàn.
        }
      },
    },
  });
}

/**
 * Client dùng service role — BỎ QUA mọi RLS.
 * Chỉ dùng cho tác vụ hạ tầng (upload file, cron). Không bao giờ để lọt ra client.
 */
export function createAdminClient() {
  const { supabaseUrl } = requirePublicEnv();
  return createSupabaseClient(supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
