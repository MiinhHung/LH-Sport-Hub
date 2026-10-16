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
  "/gioi-thieu",
  "/dang-nhap",
  "/dang-ky",
  "/auth/callback",
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

  const { pathname, search } = request.nextUrl;

  /*
   * LINK XÁC NHẬN EMAIL RƠI NHẦM CHỖ. Supabase chỉ chuyển về
   * `/auth/callback` khi địa chỉ đó nằm trong danh sách Redirect URLs;
   * không thì nó về Site URL — tức trang chủ — kèm `?code=…`, và trang chủ
   * lờ mã đó đi: người mới bấm link xác nhận xong vẫn chưa đăng nhập, tưởng
   * là đăng ký hỏng. Đón mã ở đây, đẩy sang callback cho đúng việc.
   */
  const sp = request.nextUrl.searchParams;
  if (
    pathname !== "/auth/callback" &&
    (sp.has("code") || sp.has("token_hash")) &&
    !pathname.startsWith("/api/")
  ) {
    const dich = request.nextUrl.clone();
    dich.pathname = "/auth/callback";
    if (!dich.searchParams.has("next")) {
      dich.searchParams.set("next", "/bang-tin");
    }
    return NextResponse.redirect(dich);
  }

  /*
   * KHÔNG CÓ COOKIE PHIÊN THÌ KHỎI HỎI SUPABASE.
   *
   * `auth.getUser()` là một vòng mạng ra máy chủ Supabase để xác minh
   * chữ ký của token, và nó chạy trên MỌI yêu cầu đi qua proxy. Đo trong
   * log máy chủ dev: 137ms đến 1089ms mỗi lần, cộng thẳng vào thời gian
   * chờ của từng lần bấm.
   *
   * Nhưng không có cookie `sb-*` thì chắc chắn không có phiên nào để
   * xác minh — gọi lên cũng chỉ nhận lại `user: null`. Nên với khách
   * chưa đăng nhập, bỏ hẳn vòng mạng đó: trang giới thiệu, trang đăng
   * nhập, đăng ký đều hưởng, mà kết quả không đổi một chút nào.
   *
   * CHỈ BỎ ĐƯỢC KHI VẮNG COOKIE. Có cookie thì vẫn phải gọi `getUser()`
   * thật, không được tin `getSession()` ở phía máy chủ: cái đó chỉ đọc
   * cookie chứ không xác minh chữ ký, nên ai tự chế một cookie là qua mặt
   * được. Đây là lớp chặn, không phải chỗ để tiết kiệm.
   */
  const coCookiePhien = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));

  if (!coCookiePhien) {
    if (isPublicPath(pathname)) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/dang-nhap";
    url.search = "";
    if (pathname !== "/") {
      url.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(url);
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
