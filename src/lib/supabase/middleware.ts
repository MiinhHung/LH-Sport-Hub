import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/env";

/**
 * Đường dẫn không cần đăng nhập.
 *
 * "/" là trang giới thiệu công khai. Nó chỉ khớp tuyệt đối — `isPublicPath`
 * so `pathname === p`, còn nhánh `startsWith(`${p}/`)` với p="/" sẽ là
 * "//" nên không bao giờ khớp. Nhờ vậy mở "/" không vô tình mở cả app.
 */
const PUBLIC_PATHS = [
  "/",
  "/dang-nhap",
  "/dang-ky",
  "/auth",
  "/api/cron",
  // Ô thông báo ở trang chủ gọi vào đây. Phải công khai ở lớp này, nếu
  // không người chưa đăng nhập sẽ bị đá sang trang đăng nhập và nhận về
  // HTML thay cho JSON. Bản thân route vẫn tự kiểm tra phiên và chỉ trả
  // `{ signedIn: false }` khi chưa đăng nhập.
  "/api/toi/tom-tat",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Làm mới phiên Supabase trên mỗi request và chặn route cần đăng nhập.
 * Đây là lớp chặn đầu tiên — mọi server action vẫn tự kiểm tra quyền riêng.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    // Chưa cấu hình xong thì để app tự báo lỗi cấu hình, đừng redirect vòng vo.
    return response;
  }

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dang-nhap";
    url.search = "";
    if (pathname !== "/") {
      url.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(url);
  }

  // Đã đăng nhập mà còn mở trang đăng nhập thì đưa về trang chủ, đúng
  // chỗ mà `signInAction` cũng dẫn tới.
  if (user && (pathname === "/dang-nhap" || pathname === "/dang-ky")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
