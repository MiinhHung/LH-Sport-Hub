"use client";

import { createBrowserClient } from "@supabase/ssr";

import { requirePublicEnv } from "@/lib/env";

/** Client dùng trong browser — chỉ mang anon key, không có quyền ghi dữ liệu. */
export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = requirePublicEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
