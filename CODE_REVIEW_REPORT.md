# CODE REVIEW & AUDIT: LH Sport Hub

- **Ngày audit:** 2026-10-13
- **Phạm vi:** toàn bộ working tree hiện tại. Lưu ý: working tree có **130 file sửa và 29 file untracked chưa commit** (+7.360/−10.539 dòng). Báo cáo đánh giá đúng phần code đang nằm trên đĩa, không phải commit `HEAD` (`48f2192`).
- **Phương pháp:** đọc trực tiếp source, grep theo pattern, chạy `tsc`/`lint`/`build`/`npm audit`. Ngoài ra có hai lần **kiểm tra chỉ đọc** trên Supabase thật:
  1. Truy vấn catalog `pg_class`/`pg_policies` để xem trạng thái RLS.
  2. Gọi `GET /auth/v1/settings` (endpoint công khai) để xem cấu hình Auth.

---

## 0. Khảo sát tổng quan

### Tech stack (thực tế)

| Thành phần | Phiên bản / ghi chú |
|---|---|
| Next.js | **16.3.5**, App Router. Middleware nằm ở `src/proxy.ts` theo quy ước Next 16 |
| React | 19.3 (bật React Compiler lint rules) |
| TypeScript | **7.0.2**, `strict: true` |
| Supabase | `@supabase/ssr` 0.12 và `supabase-js` 2.117. **Chỉ dùng cho Auth và Storage** |
| Database | **Drizzle ORM + `postgres`**, kết nối thẳng bằng `DATABASE_URL`. Không dùng PostgREST |
| Validation | zod 4 |
| UI | Tailwind v4 (`@theme` trong `globals.css`), shadcn style new-york (chỉ có `button`, `badge`, `card`), `motion`, lucide và phosphor |
| Deploy | Vercel `sin1`, có Cron chạy 1 lần/ngày |

### Kết quả các lệnh

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ 0 lỗi |
| `npm run lint` | ✅ 0 lỗi, ⚠️ 12 warning (`react-hooks/set-state-in-effect`, `preserve-manual-memoization`, `exhaustive-deps`) |
| `npm run build` | ✅ Build thành công, 28 route (21 trang static/dynamic) |
| `npm audit` | ❌ **12 lỗ hổng: 1 critical, 7 high, 4 moderate** (chi tiết ở 🔴 C1) |

### Thống kê

- **Số file:** 168 file `.ts/.tsx` trong `src`, tổng 33.102 dòng. `src/components` có 72 file.
- **Client components:** 44 file có `"use client"`, khoảng 11.500 dòng.
- **File trên 300 dòng:** 33 file. Lớn nhất:

  | File | Số dòng |
  |---|---|
  | `content/cam-nang.ts` | 1007 |
  | `landing/do-vui.tsx` | 967 |
  | `actions/challenges.ts` | 951 |
  | `user-menu.tsx` | 796 |
  | `db/schema.ts` | 796 |
  | `landing/journey-line.tsx` | 718 |
  | `chat/chat-thread.tsx` | 684 |
  | `keo/[id]/page.tsx` | 649 |

- **Dependencies:**
  - `date-fns` **không được import ở đâu**.
  - Có hai thư viện icon cùng chức năng (lucide và phosphor).
  - `eslint-config-next` được khai báo nhưng không dùng, trong khi `@next/eslint-plugin-next` và `eslint-plugin-react-hooks` được import nhưng không khai báo.
  - `server-only` được import ở 11 file nhưng không khai báo trong `package.json`.

### Cây thư mục chính (depth 3)

```
src/
├── proxy.ts                 # Middleware Next 16: refresh session + chặn route
├── actions/                 # Server Actions theo domain (auth, challenges, chat, posts, results, sessions, admin, profile, notifications) + types.ts (ActionState, runAction)
├── app/
│   ├── (app)/               # Route cần đăng nhập: bang-tin, keo, buoi-tap, tin-nhan, thanh-vien, ho-so, quan-tri, thong-bao, cam-nang, bang-phong-than
│   ├── (auth)/              # dang-nhap, dang-ky
│   ├── (marketing)/         # "/" và gioi-thieu (công khai)
│   ├── api/cron, api/toi/tom-tat   # Route handlers
│   ├── bi-khoa/             # Trang tài khoản bị khoá
│   └── layout.tsx, error.tsx, not-found.tsx, manifest.ts
├── components/              # UI theo feature (chat, feed, forms, keo, landing, intro, layout, ui...) + ~20 file ở gốc
├── content/                 # Nội dung tĩnh cẩm nang
├── db/                      # Drizzle schema + client
└── lib/                     # Domain logic (challenge-logic), queries, validation (zod), env, constants, storage, link-preview, supabase/{client,server,middleware}, mock/ (chết)
supabase/                    # 6 file SQL bổ sung (01..06) — KHÔNG có schema gốc
scripts/                     # apply-sql.ts, ensure-bucket.ts
```

---

## 1. Tóm tắt điều hành

Đây là một app nội bộ cho team chơi thể thao: kèo, buổi tập, bảng tin, chat. Code được viết **cẩn thận hơn mức trung bình**:

- Mọi Server Action đều qua `requireActor`/`requireRole` và validate bằng zod. Lỗi được gom về `runAction`, không lộ stack trace ra client.
- Các thao tác nhạy cảm dùng transaction kèm `SELECT … FOR UPDATE`.
- Upload ảnh kiểm tra magic bytes, nén lại bằng sharp và xoá EXIF.
- Auth dùng `getUser()` đúng chuẩn.
- **RLS đã bật trên cả 15 bảng** với 0 policy. Đã kiểm chứng trên DB thật. Nghĩa là anon key ngoài trình duyệt không đọc được gì.

Tuy vậy, **dự án CHƯA sẵn sàng production**. Phải xử lý trước những việc sau:

1. Nâng Next.js. Bản 16.3.5 đang dính advisory **critical** và cả SSRF ở Image Optimization.
2. Sửa **lỗi lệch múi giờ**: `datetime-local` được parse ở server UTC, nên mọi buổi tập và kèo tạo trên Vercel sẽ lệch 7 tiếng.
3. **Commit và ổn định working tree** đang dở (khoảng 16 nghìn dòng chưa commit, có file mới mà code đang import).
4. Không thể dựng lại DB từ repo: thiếu migration cho các bảng gốc, và script setup đọc nhầm `.env.local`.
5. Open redirect qua `?next=`, lách SSRF ở link preview bằng IPv6, và nút submit không chặn double-submit.
6. Không có test, không có CI, không có monitoring.

**Kết luận: Chưa sẵn sàng. Cần sửa trước khi lên production các mục 🔴 và phần lớn 🟠** (ước lượng khoảng 3–5 ngày công).

---

## 2. Bảng điểm

| # | Hạng mục | Điểm | Nhận xét |
|---|---|---|---|
| 1 | Kiến trúc & cấu trúc | **7/10** | Phân lớp `actions / lib / db / components` rõ ràng, alias `@/` dùng 100%. Có 7 file chết, đặt tên trộn Việt/Anh/PascalCase, nhiều file trên 600 dòng |
| 2 | Authentication | **7/10** | `@supabase/ssr` dùng đúng, `getUser()` ở server, kiểm domain lần 2 sau đăng nhập. Thiếu reset password, thiếu callback route, có open redirect, `ALLOWED_EMAIL_DOMAINS` đang trống |
| 3 | Supabase: DB/RLS/Storage | **6/10** | RLS bật 15/15 bảng (deny-all). Nhưng app chạy bằng role `postgres` (bypass RLS), không có migration gốc, còn bảng `debts` mồ côi, ảnh chat riêng tư nằm trong bucket public |
| 4 | Data fetching | **6.5/10** | Server Component + Server Action đúng chỗ, có `Promise.all`, có `revalidatePath`. Nhưng `limit` toàn cục cắt sai dữ liệu (feed, chat), fetch trùng giữa metadata và page, polling chat 4s bằng Server Action |
| 5 | Error handling | **7/10** | `runAction` thống nhất, có `error.tsx` ở 2 cấp, không lộ lỗi nội bộ. Thiếu `global-error.tsx`, còn vài catch nuốt lỗi, không có monitoring, `audit()` trong transaction có thể làm hỏng tx |
| 6 | State & React patterns | **6.5/10** | `useActionState`/`useFormStatus` dùng nhất quán. Có bug `SubmitButton`, form bị reset khi lỗi, hydration lệch giờ ở chat, 12 warning hooks |
| 7 | Hardcode & cấu hình | **6/10** | Có `constants.ts` và `env.ts`. Nhưng env không validate bằng schema, `CRON_SECRET`/`DATABASE_URL`/`TIME_ZONE` đọc thẳng, `.env.example` thiếu biến, 95 mã hex trong TSX |
| 8 | TypeScript & chất lượng | **5.5/10** | `strict`, chỉ 10 `any`, không có `@ts-ignore`. Nhưng **0 test**, lint không có rule TS (do TS 7 phải dùng babel-parser), có 10 `as unknown as` |
| 9 | UI / Tailwind / a11y | **6.5/10** | Token màu có ghi contrast, `<dialog>` gốc, menu ARIA chuẩn, 25/25 ảnh có alt. Nhưng 866 arbitrary values (509 `text-[Npx]`), hai hệ token song song, form thiếu `aria-invalid`, drawer mobile chưa đạt a11y |
| 10 | Hiệu năng & SEO | **6/10** | Dùng `next/font`, `next/image` có `sizes`, lazy video. Nhưng video landing 14,2 MB, `motion` tải ở mọi trang, mỗi request đều `UPDATE profiles`. Có `noindex` là hợp lý cho app nội bộ |
| 11 | Bảo mật tổng thể | **5.5/10** | Không thấy IDOR, không có XSS. Nhưng Next có CVE critical, lách được SSRF, có open redirect, không có security headers/CSP, không rate limit |
| 12 | DevOps & bảo trì | **3.5/10** | Không README, không CI, không test, DEPLOY.md lỗi thời, working tree khổng lồ chưa commit, thiếu `.gitattributes` |
| | **Tổng (trung bình)** | **6.1/10** | Code tốt, nhưng hạ tầng phát hành và vận hành còn yếu |

---

## 3. Điểm mạnh (cần giữ)

1. **Server Action có lớp bọc lỗi chuẩn.** `src/actions/types.ts:39-66` (`runAction`):
   - ZodError được chuyển thành lỗi theo field.
   - AppError được chuyển thành message hiển thị.
   - Lỗi lạ chỉ trả câu chung và ghi log ở server.
   - Lỗi `NEXT_` (redirect) được cho đi tiếp đúng cách.
2. **Phân quyền ở server.** Mọi action trong `src/actions/*` đều gọi `requireActor`/`requireRole` trước tiên. Agent rà soát không tìm thấy IDOR nào: post, comment, message, conversation, session, challenge, notification đều kiểm owner hoặc participant. `admin.ts` chặn người dùng tự đổi role của chính mình.
3. **Auth đúng chuẩn.**
   - `src/lib/auth.ts:33-35` và `src/lib/supabase/middleware.ts:103-105` dùng `getUser()`, không dùng `getSession()`.
   - Domain email được kiểm lần 2 sau khi đăng nhập (`lib/auth.ts:42`), nên signUp thẳng qua anon key không lách được.
   - Đã kiểm trên Supabase thật: `mailer_autoconfirm: false`, tức xác minh email đang bật.
4. **RLS deny-all trên toàn bộ bảng.** Kiểm trên DB thật: 15/15 bảng `relrowsecurity = true`, `pg_policies` rỗng.
5. **Chống race đúng cách.**
   - `challenges.ts:53-73` (`loadLocked`) và `results.ts:36-61` dùng `FOR UPDATE`, sau đó chạy lại logic thuần trong `challenge-logic.ts`.
   - `sessions.ts:280-309` khoá trước khi đếm chỗ.
   - Bộ đếm cập nhật nguyên tử, ví dụ `posts.ts:342` `sql\`${posts.commentCount} + 1\``.
6. **Upload an toàn.** `src/lib/storage.ts`:
   - Kiểm magic bytes khớp MIME khai báo.
   - Giới hạn dung lượng.
   - Nén sang WebP bằng sharp và bỏ EXIF/GPS.
   - Object key do server sinh.
7. **Link preview đã có nhiều lớp chống SSRF.** `src/lib/link-preview.ts`:
   - Chỉ nhận http/https.
   - Phân giải DNS rồi kiểm tất cả địa chỉ.
   - Tự đi redirect thủ công và kiểm lại từng hop.
   - Có timeout và giới hạn byte.
   - Ảnh preview được tải về kho riêng, không mở `remotePatterns`.
8. **Service role key không lộ.** Chỉ dùng trong `src/lib/supabase/server.ts:40-45` (có `import "server-only"`). Không có biến `NEXT_PUBLIC_` nào chứa secret. Git history không có secret.
9. **UX lỗi tốt.**
   - Có `loading.tsx` cho 19 route.
   - `error.tsx` có ở 2 cấp và chỉ hiển thị `digest`.
   - Dùng `<dialog>` gốc cho confirm và lightbox.
   - `user-menu.tsx` làm đúng ARIA menu pattern.
   - Có xử lý reduced-motion ở landing.
10. **Comment giải thích "vì sao" rất chất lượng**, kèm số đo thực tế. Ví dụ `src/db/index.ts:24-86` về pool size và timeout.

---

## 4. Danh sách vấn đề

### 🔴 Critical

#### C1. Next.js 16.3.5 có lỗ hổng critical/high (và sharp, các dependency khác)

Kết quả `npm audit`:

```
next  16.0.0 - 16.3.7   Severity: critical
  - RCE in next/og ImageResponse (GHSA-vcvr-r3jv-pc5j)
  - SSRF in Image Optimization (GHSA-cjq9-62q9-8jv4)
  - Cache poisoning SSG/ISR (GHSA-mcj8-r9mp-w47p, GHSA-4jqv-mc3x-m676) ...
sharp <0.35.5           Severity: high (librsvg CVE)
braces / source-map-js  Severity: high (dev/lint chain)
```

- **Vị trí:** `package.json` (`"next": "^16.3.5"`, `"sharp": "^0.35.4"`).
- **Mức độ ảnh hưởng thực tế:** app không dùng `next/og`, nên RCE chưa khai thác trực tiếp được. Nhưng app **có dùng** `next/image` với remotePatterns, nên dính SSRF Image Optimization. Sharp được dùng để xử lý ảnh người dùng upload.
- **Sửa:**

  ```bash
  npm i next@^16.3.8 sharp@^0.35.5 eslint-config-next@latest && npm audit
  ```

- **Độ khó:** dễ.

#### C2. Lệch múi giờ khi parse `datetime-local` ở server, khiến mọi giờ buổi tập và kèo lệch 7 tiếng trên Vercel

- **Vị trí:** `src/lib/validation.ts:47` và `:61`. Form gửi chuỗi trần tại `src/components/forms/session-form.tsx:296-297` và `challenge-form.tsx:539-540`.

  ```ts
  .transform((value, ctx) => {
    const parsed = new Date(value);   // "2026-10-17T07:00" → hiểu theo TZ của server
  ```

- **Vì sao là vấn đề:** input `datetime-local` gửi lên chuỗi không kèm offset. Server Vercel chạy UTC, nên "07:00" bị lưu thành 07:00Z, tức **14:00 giờ VN**. Hệ quả kéo theo:
  - `startsAt` và `playDeadline` sai.
  - Nhắc lịch của cron sai.
  - Luật "không tạo ở quá khứ" sai.
  - Việc tự đóng buổi tập sai.

  Lỗi này không thấy được khi dev trên máy đặt giờ VN. Mức Critical vì gây **sai lệch dữ liệu hàng loạt** ngay khi deploy.
- **Sửa:** parse theo `Asia/Ho_Chi_Minh` ở server. Không nên tin client vì client có thể ở múi giờ khác.

  ```ts
  import { fromZonedTime } from "date-fns-tz";
  import { TIME_ZONE } from "@/lib/utils";
  const parsed = fromZonedTime(value, TIME_ZONE); // value: "YYYY-MM-DDTHH:mm"
  ```

  Chiều ngược lại, khi đổ `defaultValue` cho form sửa, cũng phải format theo `TIME_ZONE`.
- **Độ khó:** vừa. Cần kiểm tra lại dữ liệu đã lưu nếu đã có bản deploy.

#### C3. Working tree chưa commit khổng lồ, có nguy cơ build Vercel gãy và mất code

- **Bằng chứng:** `git status`: 112 file sửa, 18 file xoá, 29 file untracked. `git diff --stat` cho +7.360/−10.539. Khi bỏ qua whitespace và CRLF vẫn còn +6.426/−9.605, tức là thay đổi nội dung thật.
- **Rủi ro:** code đã sửa đang import các file untracked (`components/icons.tsx`, `domain-icons.tsx`, `components/layout/*`, `components/intro/*`, `ui/badge.tsx`, `ui/card.tsx`…). Commit thiếu một file là build gãy. Ngoài ra không có `.gitattributes` trong khi `core.autocrlf=true`, nên hơn 70 file chỉ khác line-ending.
- **Sửa:**
  - Thêm `.gitattributes` với `* text=auto eol=lf`.
  - Chia nhỏ commit theo feature, mỗi commit đều chạy `npm run build` trước.
- **Độ khó:** vừa.

### 🟠 High

#### H1. Open redirect qua tham số `next` khi đăng nhập

- **Vị trí:** `src/actions/auth.ts:119-121`. Giá trị lấy từ URL tại `src/components/forms/auth-form.tsx:109,117`.

  ```ts
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    target = next;
  ```

- **Vấn đề:** `"/\evil.com"` qua được cả hai điều kiện. Theo chuẩn WHATWG URL, trình duyệt coi `\` như `/`, nên `new URL("/\\evil.com", origin)` thành `https://evil.com/` (agent đã chạy thử). Kẻ xấu gửi link `/dang-nhap?next=/\evil.com`: nạn nhân đăng nhập thật xong bị chuyển sang trang phishing.
- **Sửa:**

  ```ts
  function safeNext(next: unknown): string {
    if (typeof next !== "string" || /[\\\s]/.test(next)) return "/";
    const u = new URL(next, "http://n");
    return u.origin === "http://n" ? u.pathname + u.search : "/";
  }
  ```

- **Độ khó:** dễ.

#### H2. Lách SSRF ở link preview bằng địa chỉ IPv4-mapped IPv6 dạng hex

- **Vị trí:** `src/lib/link-preview.ts:68-69`

  ```ts
  const v4 = s.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) return laDiaChiNoiBo(v4[1]);
  return false;
  ```

- **Vấn đề:** WHATWG URL chuẩn hoá `http://[::ffff:127.0.0.1]/` thành `[::ffff:7f00:1]`. Regex dạng chấm thập phân không khớp nên hàm coi đó là địa chỉ công khai. Tương tự với `[::ffff:a9fe:a9fe]` (169.254.169.254, metadata). Ngoài ra:
  - Không chặn NAT64 `64:ff9b::/96`, 6to4 `2002::/16`, `198.18.0.0/15`.
  - Không giới hạn port, nên server có thể bị dùng làm port scanner.
  - DNS rebinding đã được ghi nhận trong comment (dòng 37-42) nhưng chưa xử lý.
  - Đòn này cần đăng nhập, nhưng signup đang mở cho mọi email (H5).
- **Sửa:**

  ```ts
  import ipaddr from "ipaddr.js";
  function laNoiBo(ip: string) {
    let a = ipaddr.parse(ip);
    if (a.kind() === "ipv6" && (a as ipaddr.IPv6).isIPv4MappedAddress())
      a = (a as ipaddr.IPv6).toIPv4Address();
    return a.range() !== "unicast";
  }
  // + chỉ cho port 80/443; pin IP đã kiểm bằng undici Agent({ connect: { lookup } })
  ```

- **Độ khó:** vừa.

#### H3. `SubmitButton` không khoá khi pending nếu caller truyền `disabled`, gây double-submit

- **Vị trí:** `src/components/ui/submit-button.tsx:32-35`

  ```tsx
  <button type="submit" disabled={pending || props.disabled} ... {...props}>
  ```

- **Vấn đề:** `{...props}` đứng sau nên ghi đè `disabled`. Hai caller bị ảnh hưởng:
  - `post-composer.tsx:331` (`disabled={!canSubmit}`): khi có thể submit thì giá trị là `false`, ghi đè `pending`.
  - `keo/[id]/client-actions.tsx:71`.

  Kết quả là bấm nhiều lần thì đăng bài đôi hoặc gửi request vào kèo đôi.
- **Sửa:**

  ```tsx
  export function SubmitButton({ children, disabled, ...props }) {
    const { pending } = useFormStatus();
    return <button {...props} type="submit" disabled={pending || disabled}>…</button>;
  }
  ```

- **Độ khó:** dễ.

#### H4. Không dựng lại được database từ repo

- **Vị trí:** thư mục `supabase/` (01..06) chỉ tạo `posts`, `post_media`, `comments`, `reactions`, `conversations`, `messages` và vài lệnh ALTER. Không có thư mục `drizzle/`.
- **Thiếu SQL cho:**
  - Các bảng gốc `profiles`, `play_sessions`, `play_session_attendees`, `challenges`, `challenge_participants`, `challenge_results`, `notifications`, `audit_logs`.
  - Các enum đi kèm.
  - **Lệnh bật RLS** cho các bảng này. RLS trên DB thật đang bật nhưng được làm tay, không có trong repo.
- **Kèm theo:**
  - DB thật còn bảng **`debts`** không có trong `schema.ts`. Enum `notification_type` vẫn giữ `debt_*` (`schema.ts:112-114`).
  - `drizzle.config.ts:4`, `scripts/apply-sql.ts:21`, `scripts/ensure-bucket.ts:15` đều gọi `config({ path: ".env.local" })`, trong khi repo dùng `.env`. Vì vậy `npm run setup`/`db:push` báo thiếu `DATABASE_URL`.
- **Sửa:**
  - Chạy `drizzle-kit generate` để tạo baseline và commit `drizzle/`. Hoặc thêm `supabase/00-base.sql` gồm toàn bộ bảng, kèm `ENABLE ROW LEVEL SECURITY` cho mọi bảng.
  - Dùng `config({ path: [".env.local", ".env"] })`.
  - Quyết định giữ hay drop bảng `debts`.
- **Độ khó:** vừa.

#### H5. Đăng ký đang mở cho mọi email, trong khi app chứa dữ liệu nội bộ (tin nhắn, danh sách thành viên)

- **Vị trí:** `src/lib/env.ts:47-49`

  ```ts
  const domains = allowedEmailDomains();
  if (domains.length === 0) return true;
  ```

  Trong `.env` local, `ALLOWED_EMAIL_DOMAINS=` và `BOOTSTRAP_ADMIN_EMAILS=` đều đang trống. Comment ở `auth-form.tsx:24-25` cũng nói rõ "app đang để đăng ký tự do". Supabase trả `disable_signup: false`.
- **Vấn đề:** bất kỳ ai có link đều tạo được tài khoản và đọc được bảng tin, danh sách thành viên, nhắn tin cho người khác. Kết hợp với H2, họ còn có thể dùng server làm proxy SSRF. Chưa xác nhận được giá trị trên Vercel production (**Cần xác nhận**).
- **Sửa:**
  - Đặt `ALLOWED_EMAIL_DOMAINS` trên Vercel.
  - Thêm fail-closed khi chạy production:

    ```ts
    if (domains.length === 0) return process.env.VERCEL_ENV !== "production";
    ```

  - Hoặc chuyển sang cơ chế invite-only.
- **Độ khó:** dễ.

#### H6. Người tạo kèo huỷ hoặc xoá được kèo khi kết quả đang chờ xác nhận hoặc tranh chấp, nên né được thua cược

- **Vị trí:** `src/lib/challenge-logic.ts:186-191` và `src/actions/challenges.ts:852`

  ```ts
  if (challenge.status === "completed") return no("Kèo đã hoàn tất, không huỷ được.");
  if (challenge.status === "cancelled") return no("Kèo đã bị huỷ rồi.");
  ```

- **Vấn đề:** khi đội kia đã nhập kết quả "đội người tạo thua" (`pending_confirm`), người tạo vẫn huỷ được. Hơn nữa, leaderboard (`queries.ts:415-423`) sẽ tính đối thủ là "xù kèo" (`ghosted`), tức phạt nhầm người vô tội.
- **Sửa:**

  ```ts
  if (["pending_confirm", "disputed", "completed", "cancelled"].includes(challenge.status) && !isModerator)
    return no("Kèo đã có kết quả, chỉ ban quản trị mới huỷ được.");
  ```

- **Độ khó:** dễ.

#### H7. Không có test, không có CI

- **Bằng chứng:** không có file `*.test.*`/`*.spec.*`, không có test runner, không có `.github/workflows`.
- **Vấn đề:** logic cược, chốt kết quả, bảng xếp hạng (`challenge-logic.ts`, `results.ts`) là phần phức tạp nhất mà không có lưới an toàn. Mọi refactor (như working tree hiện tại) đều đi thẳng lên production.
- **Sửa:**
  - Thêm `vitest` và viết unit test cho `challenge-logic.ts` (hàm thuần, dễ test).
  - Thêm GitHub Action chạy `npm ci && npm run typecheck && npm run lint && npm run build`.
- **Độ khó:** vừa.

#### H8. Cron chốt kết quả mà không kiểm lại trạng thái bên trong transaction

- **Vị trí:** `src/actions/results.ts:225-263` (`settleChallenge`) và `src/app/api/cron/route.ts:71-98`.
- **Vấn đề:** cron lấy danh sách `stale` trước, rồi mới mở transaction cho từng kèo. `settleChallenge` có khoá hàng nhưng **không kiểm** `status === "pending_confirm"` hay `result.status === "pending"`. Nếu có người dispute hoặc nhập lại kết quả xen vào giữa hai bước, cron vẫn chốt kết quả đang tranh chấp.
- **Sửa:** sau `FOR UPDATE`:

  ```ts
  if (challenge.status !== "pending_confirm" || result.status !== "pending" || result.updatedAt > cutoff)
    return; // bỏ qua
  ```

  Đồng thời chuyển `settleChallenge` khỏi file `"use server"` (xem L-mục).
- **Độ khó:** dễ.

#### H9. Video landing 14,2 MB

- **Vị trí:** `public/videos/video.mp4` (14.203.346 B), dùng tại `src/app/(marketing)/gioi-thieu/page.tsx:137`. `showcase-video.tsx` bắt đầu tải khi video còn cách khung nhìn `rootMargin: "150% 0px"`, kể cả trên mobile.
- **Sửa:**
  - Encode lại 720p, mục tiêu dưới 3 MB.
  - Thêm bản cho mobile qua `<source media="(max-width:768px)" …>`.
  - Bỏ qua khi `navigator.connection?.saveData`.
- **Độ khó:** dễ.

### 🟡 Medium

| # | Vấn đề | Vị trí & bằng chứng | Cách sửa |
|---|---|---|---|
| M1 | `audit()` bắt lỗi bằng try/catch **bên trong transaction**. Postgres abort cả tx khi một câu lỗi, nên COMMIT thành ROLLBACK. Có thể gây mất dữ liệu âm thầm (Cần xác nhận postgres.js có ném lỗi khi COMMIT trả tag ROLLBACK hay không) | `src/lib/audit.ts:22-32`, được gọi `audit(tx, …)` ở `posts.ts:214`, `sessions.ts:94…`, `results.ts:189…` | Bọc bằng savepoint `await tx.transaction(sp => sp.insert(auditLogs)…)`, hoặc ghi audit sau commit |
| M2 | Lịch sử chat lấy **200 tin cũ nhất**, nên hội thoại dài không hiện tin mới | `src/lib/chat.ts:202-203` `orderBy: [asc(messages.createdAt)], limit` | `orderBy desc` + `limit`, rồi `.reverse()` |
| M3 | Polling chat không chạy khi hội thoại rỗng (`!lastRealAt`), nên tin đầu tiên của người kia không hiện. Mỗi 4s gọi Server Action (bị xếp hàng chung với action gửi tin), không có cờ chống chồng request. Badge unread và danh sách hội thoại không bao giờ tự refresh | `src/components/chat/chat-thread.tsx:194` `if (document.hidden \|\| !lastRealAt) return;` | Poll từ mốc `initialAt`. Chuyển sang Route Handler GET + `AbortController`, hoặc Supabase Realtime với private channel |
| M4 | Hydration mismatch và giờ sai ở chat: `Intl.DateTimeFormat` không truyền `timeZone`, `toDateString()` theo TZ máy | `chat-thread.tsx:91-114` | Dùng `formatTime`/`TIME_ZONE` có sẵn ở `lib/utils.ts` |
| M5 | Form bị reset khi server trả lỗi validate (hành vi `<form action>` của React 19), nên người dùng mất dữ liệu đã nhập | `auth-form.tsx:120-216`, `session-form.tsx:170,350…`, `profile-form.tsx:73-114` | Trả `values` trong `ActionState` rồi dùng `defaultValue={state.values?.x}`, hoặc dùng `onSubmit` + `startTransition` |
| M6 | Ảnh chat **riêng tư** nằm trong bucket **public**, không thu hồi được. Xoá tin nhắn không xoá ảnh và không cập nhật `lastMessagePreview` | `actions/chat.ts:119` → `storage.ts:151` `getPublicUrl`; `chat.ts:259-262` | Dùng bucket private + `createSignedUrl`. Khi xoá thì tính lại preview và gọi `deleteImage` |
| M7 | Không rate limit cho bất kỳ thao tác ghi nào (post, comment, reaction, message, link preview). Bài "announcement" gửi thông báo cho cả team, nên spam một lần nhân lên N bản ghi | `actions/posts.ts`, `actions/chat.ts`, `posts.ts:195-211` | `@upstash/ratelimit` (Vercel Marketplace) hoặc bảng đếm theo `actor.id` |
| M8 | Feed: `limit: 500` comment áp **toàn cục** cho cả trang. "Tải thêm" là tăng `limit` rồi tải lại tất cả. Bộ lọc loại bài chạy bằng JS sau khi đã limit | `src/lib/feed.ts:140-149`, `bang-tin/page.tsx` | Window function `row_number() over (partition by post_id)`, đưa filter vào `where`, phân trang bằng cursor |
| M9 | Mỗi request (kể cả poll 4s) đều chạy `UPDATE profiles SET last_active_at` và nuốt lỗi | `src/lib/auth.ts:53-57` `.catch(() => undefined)` | Chỉ update khi `lastActiveAt < now() - 5 phút`, và log lỗi |
| M10 | Thiếu route `/auth/callback` và luồng quên/đặt lại mật khẩu. `PUBLIC_PATHS` còn `/auth` và `/gioi-thieu-v2` (route không tồn tại) | `src/lib/supabase/middleware.ts:17-20`; `actions/auth.ts:147` không có `emailRedirectTo` | Thêm `app/auth/callback/route.ts` (`exchangeCodeForSession`) và trang reset password; dọn `PUBLIC_PATHS` |
| M11 | Moderator tự nhập rồi tự xác nhận kết quả kèo của chính mình | `src/lib/challenge-logic.ts:234` `if (isModerator) return ok;` | Đặt kiểm tra `submittedBy !== userId` trước nhánh moderator |
| M12 | Không vào lại được kèo đã rời: `insert` vi phạm unique, người dùng chỉ thấy "Có lỗi xảy ra" | `actions/challenges.ts:489-495`; unique ở `schema.ts:326` | `.onConflictDoUpdate({ target: [...], set: { status: "accepted", leftAt: null } })` |
| M13 | Sửa kèo bị TOCTOU: đọc `result` ngoài tx, và vẫn đổi được cược khi kèo đã `locked` | `actions/challenges.ts:326-336, 384-398` | Dùng `loadLocked(tx)`. Đổi cược thì reset trạng thái đồng ý của participants |
| M14 | Thiếu `global-error.tsx`. Không có `(app)/not-found.tsx`, nên `notFound()` trong app làm mất header và nav | `src/app/` | Thêm cả hai file |
| M15 | Không có monitoring (Sentry hoặc tương đương). 12 `console.error` chỉ nằm trong log Vercel | toàn bộ | Thêm `instrumentation.ts` với `onRequestError`, hoặc dùng `@sentry/nextjs` |
| M16 | Env không validate bằng schema. `CRON_SECRET` đọc thẳng dù đã có `serverEnv.cronSecret`. `.env.example` thiếu `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_TIME_ZONE` và khai trùng 2 biến | `api/cron/route.ts:43`, `db/index.ts:8`, `utils.ts:12`, `bang-tin/page.tsx:26` | Dùng một `z.object({...}).parse(process.env)` duy nhất trong `env.ts` |
| M17 | Không có security headers (CSP, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, HSTS) | `next.config.ts` không có `headers()` | Thêm `async headers()` với các header cơ bản. CSP dùng nonce vì có 2 inline script |
| M18 | Lint không có rule TypeScript nào: TS 7 buộc phải dùng `@babel/eslint-parser`, nên `no-unused-vars` và `no-explicit-any` không chạy. Đây là lý do có 7 file chết | `eslint.config.mjs` | Cân nhắc hạ về TS 5.x (typescript-eslint có hỗ trợ), hoặc thêm `knip` để bắt code chết |
| M19 | Code chết khoảng 1.150 dòng: `action-button.tsx`, `ActionRequiredBanner.tsx`, `MatchCard.tsx`, `PageHeader.tsx`, `SidebarWidgets.tsx`, `lib/mock/`, `lib/supabase/client.ts`, các export `SideNav`/`HeaderNav`/`HeaderQuickActions` trong `nav.tsx`, `feed.ts` (`listComments`, `getPost`), CSS `[data-v2]` | các file kể trên | Xoá; gỡ `date-fns` |
| M20 | Fetch trùng giữa `generateMetadata` và page | `keo/[id]/page.tsx:59 & 287`, `buoi-tap/[id]/page.tsx:40 & 79`, `thanh-vien/[id]`, `tin-nhan/[id]` | Bọc các hàm query bằng `React.cache()` |
| M21 | Design token: hai hệ song song (`ink/navy/gold` và biến shadcn). `hover:bg-gold-accent-hover` không sinh ra CSS vì `@theme` không khai báo `--color-gold-accent-hover`. Có 509 `text-[Npx]` | `ui/button.tsx:24`; `globals.css:136,206` | Thêm `--color-gold-accent-hover` vào `@theme`, định nghĩa type scale, gộp về một hệ token |
| M22 | Form a11y: 0 lượt `aria-invalid`/`aria-describedby`; một số `<Field>` không có `htmlFor` | `ui/index.tsx:196-235`; `session-actions.tsx:59`; `client-actions.tsx:168,400` | Dùng `useId()` để nối label, input và thông báo lỗi |
| M23 | Drawer mobile không có `role="dialog"`, không đóng bằng Escape, không bẫy focus, hamburger thiếu `aria-expanded` | `components/layout/site-header.tsx:330-436` | Dùng `<dialog>` + `showModal()` giống `hoi-lai.tsx` |
| M24 | DEPLOY.md lỗi thời: chỉ nhắc file SQL 01, ghi "cron mỗi giờ" trong khi thực tế là mỗi ngày, thiếu biến `PUBLISHABLE_KEY`. Không có README | `DEPLOY.md` | Viết README (setup, scripts, kiến trúc) và cập nhật DEPLOY.md |

### 🟢 Low / Nice-to-have

- **L1.** Cron so sánh secret không timing-safe: `src/app/api/cron/route.ts:52` `if (header !== \`Bearer ${secret}\`)`. Dùng `crypto.timingSafeEqual`.
- **L2.** `settleChallenge` được export trong file `"use server"` (`src/actions/results.ts:225`), nên trở thành một endpoint action không có auth. Hiện chưa khai thác được vì tham số `tx` không serialize qua được. Nên chuyển sang `src/lib/` với `server-only`.
- **L3.** `admin.ts:23` dùng `!(role in ROLES)`, nên `"toString"` qua được kiểm tra. Đổi sang `Object.hasOwn` hoặc `z.enum`. Ở `admin.ts:77`, moderator khoá được moderator khác. Nên so sánh `rank`.
- **L4.** Có 24 chỗ dùng `String(formData.get("…Id"))` không validate uuid (ví dụ `posts.ts:240`, `chat.ts:45`, `sessions.ts:272`). Id sai định dạng gây lỗi Postgres 22P02, người dùng chỉ thấy "Có lỗi xảy ra".
- **L5.** `link-preview.ts:166-172`: `String.fromCodePoint` ném RangeError với entity lớn, khiến không đăng được bài link. Response 3xx không `cancel()` body.
- **L6.** `maps.ts:351-358`: cho mọi path trên `google.com`, nên `google.com/url?q=…` trở thành open redirect trong nút "Chỉ đường".
- **L7.** Truyền nguyên `Profile` (email, status, bio) vào client component `site-header.tsx` qua `layout.tsx:21`. Chỉ nên truyền `{id, fullName, avatarUrl, role}`.
- **L8.** TypeScript: 10 `any`, tất cả ở `src/lib/queries.ts` (ví dụ `:55`, `:74` `orderBy: (p: any, { asc }: any) =>`). Có 10 `as unknown as` (`challenges.ts:70-71`, `results.ts:58-59`…). Nên định nghĩa `ChallengeLike` bằng `Pick<$inferSelect,…>`.
- **L9.** Code trùng lặp:
  - `loadLocked` ở `challenges.ts:45-77` và `results.ts:34-61`.
  - Click-outside viết lại 4 lần.
  - Hàm lấy "tên gọi" viết lại 4 lần.
  - `MOT_NGAY` khai 2 lần.
  - `dayLabel` trong chat trùng với `utils.ts`.
- **L10.** Theme state lệch giữa `ThemeToggle` và `UserMenu`, vì mỗi lần gọi `useTheme()` tạo một `useState` riêng (`components/theme.tsx:64`). Nên dùng `useSyncExternalStore`.
- **L11.** `post-composer.tsx:71-73`: cleanup giữ closure cũ nên object URL bị rò. Ngoài ra còn 12 warning hooks của ESLint.
- **L12.** Default props giả `unread = 3, unreadMessages = 2` tại `app-header.tsx:14-15` và `site-header.tsx:65-66`.
- **L13.** Đặt tên không thống nhất: 26 file tên tiếng Việt, 5 file PascalCase, hai file `reveal.tsx` trùng tên. Comment trộn có dấu và không dấu.
- **L14.** Hai thư viện icon (lucide và phosphor). Barlow tải 4 weight nhưng chỉ dùng 800. `--font-sans: var(--font-sans)` tự tham chiếu (`globals.css:140`).
- **L15.** `/gioi-thieu` đếm `profiles`/`play_sessions` qua Supabase client, nhưng RLS deny-all nên **luôn ra 0**, khiến khối số liệu không bao giờ hiện (`gioi-thieu/page.tsx:36-55`). Đây là code vô dụng, hoặc nên đếm bằng Drizzle.
- **L16.** OG image `/logo.png` có kích thước 958×1024 thay vì 1200×630. Mức ưu tiên thấp vì app để `noindex`.
- **L17.** Nút hiện mật khẩu có `tabIndex={-1}` (`auth/dark-field.tsx:101`). `Alert` dùng `role="status"` cho cả lỗi, nên đổi sang `role="alert"`.

---

## 5. Top 10 việc cần làm ngay

| # | Việc | Liên quan | Độ khó |
|---|---|---|---|
| 1 | Nâng `next` lên ≥16.3.8 và `sharp` ≥0.35.5, sau đó chạy lại `npm audit` | C1 | Dễ |
| 2 | Sửa parse `datetime-local` theo `Asia/Ho_Chi_Minh` (cả chiều ghi lẫn chiều đổ vào form) | C2 | Vừa |
| 3 | Thêm `.gitattributes`, rồi commit working tree theo từng phần, mỗi phần build xanh | C3 | Vừa |
| 4 | Đặt `ALLOWED_EMAIL_DOMAINS` và `BOOTSTRAP_ADMIN_EMAILS` trên Vercel, thêm fail-closed ở production | H5 | Dễ |
| 5 | Sửa open redirect `next` và `SubmitButton` | H1, H3 | Dễ |
| 6 | Vá SSRF IPv6 và port trong `link-preview.ts` | H2 | Vừa |
| 7 | Baseline migration (`drizzle-kit generate` hoặc `00-base.sql` kèm RLS), sửa đường dẫn dotenv, xử lý bảng `debts` | H4 | Vừa |
| 8 | Chặn huỷ/xoá kèo khi đang `pending_confirm`/`disputed`; kiểm lại trạng thái trong `settleChallenge` | H6, H8 | Dễ |
| 9 | CI (typecheck + lint + build) và vitest cho `challenge-logic.ts` | H7 | Vừa |
| 10 | Sửa `audit()` dùng savepoint, sửa thứ tự chat 200 tin và poll khi hội thoại rỗng | M1, M2, M3 | Dễ–Vừa |

## 6. Quick wins (dưới 30 phút mỗi việc)

- `SubmitButton`: destructure `disabled` (H3). Khoảng 5 phút.
- `safeNext()` cho open redirect (H1). Khoảng 10 phút.
- `npm i next@latest-16 sharp@latest` (C1). Khoảng 10 phút, cộng thời gian build lại.
- `config({ path: [".env.local", ".env"] })` trong 3 file (H4 một phần). Khoảng 5 phút.
- `canCancel` chặn `pending_confirm`/`disputed` (H6). Khoảng 10 phút.
- `chat.ts` đổi sang `desc` + `.reverse()`; poll khi `!lastRealAt` (M2, M3). Khoảng 15 phút.
- Thêm `timeZone: TIME_ZONE` trong `chat-thread.tsx` (M4). Khoảng 10 phút.
- Throttle `lastActiveAt` (M9). Khoảng 10 phút.
- Thêm `--color-gold-accent-hover` vào `@theme` (M21). Khoảng 2 phút.
- `crypto.timingSafeEqual` cho cron (L1). Khoảng 5 phút.
- Xoá 7 file chết và `date-fns` (M19). Khoảng 15 phút.
- Thêm `global-error.tsx` và `(app)/not-found.tsx` (M14). Khoảng 20 phút.
- Thêm `headers()` bảo mật cơ bản trong `next.config.ts` (M17, chưa gồm CSP). Khoảng 15 phút.
- Bọc `getChallengeDetail`/`getSessionDetail`/`getProfileById`/`getConversation` bằng `React.cache` (M20). Khoảng 10 phút.

## 7. Đề xuất refactor / kiến trúc dài hạn

1. **Mô hình bảo mật DB.** App chạy Drizzle bằng role `postgres` (đã kiểm: `rolbypassrls = true`), nên toàn bộ phân quyền nằm ở code. Cách này chấp nhận được với RLS deny-all, nhưng cần:
   - Dùng một role DB riêng với quyền tối thiểu cho app, không dùng `postgres`.
   - `REVOKE ALL ... FROM anon, authenticated` trên schema `public` làm lớp phòng thủ thứ hai. Hiện `anon` vẫn có đủ GRANT `SELECT/INSERT/UPDATE/DELETE/TRUNCATE` trên mọi bảng, và chỉ RLS đang chặn.
2. **Tầng service.** Tách `src/actions/*.ts` (file lớn nhất 951 dòng) thành:
   - Action mỏng: parse, auth, gọi service, revalidate.
   - `src/server/services/<domain>.ts` chứa logic và transaction.

   Gom `loadLocked`, các hàm `revalidate*` và FormData parsing về một chỗ.
3. **Realtime cho chat và thông báo** bằng Supabase Realtime Broadcast trên private channel (RLS trên `realtime.messages`), thay cho polling Server Action 4 giây.
4. **Design system.** Gộp hai hệ token, định nghĩa type scale trong `@theme`, tách `ui/index.tsx` (546 dòng) thành từng component kiểu shadcn, và chọn một thư viện icon.
5. **Quy ước code.** Viết vào `AGENTS.md` quy tắc đặt tên (tiếng Anh cho identifier và file, tiếng Việt cho UI và comment), kebab-case cho file. Thêm Prettier và lint-staged.
6. **Quan sát hệ thống.** Thêm Sentry hoặc `instrumentation.ts`, Vercel Analytics và Speed Insights, và alert khi cron thất bại.
7. **Test.** Unit test cho logic thuần (challenge-logic, validation), integration test cho Server Actions trên DB test (Supabase branch hoặc Docker), và Playwright cho luồng đăng nhập → tạo kèo → nhập kết quả.

## 8. Checklist trước khi lên production

| Mục | Trạng thái |
|---|---|
| `tsc` không lỗi | ✅ |
| `lint` không lỗi | ✅ (còn 12 warning) |
| `build` thành công | ✅ |
| `npm audit` không còn critical/high | ❌ (1 critical, 7 high) |
| Working tree sạch, đã commit | ❌ (159 mục chưa commit) |
| RLS bật trên mọi bảng | ✅ (đã kiểm trên DB: 15/15) |
| RLS và schema tái lập được từ repo | ❌ |
| Service role key chỉ ở server | ✅ |
| Không có secret trong git | ✅ |
| Server dùng `getUser()` thay vì `getSession()` | ✅ |
| Xác minh email bật | ✅ (`mailer_autoconfirm: false`) |
| Giới hạn domain đăng ký (`ALLOWED_EMAIL_DOMAINS`) | ❌ trên local / Cần xác nhận trên Vercel |
| Có admin bootstrap (`BOOTSTRAP_ADMIN_EMAILS`) | ❌ trên local / Cần xác nhận trên Vercel |
| Quên / đặt lại mật khẩu | ❌ |
| Không có open redirect | ❌ |
| Chống SSRF đầy đủ | ❌ |
| Rate limiting | ❌ |
| Security headers / CSP | ❌ |
| Validate input mọi Server Action | ✅ phần lớn (zod); ⚠️ 24 chỗ id chưa kiểm uuid |
| Phân quyền server-side, không IDOR | ✅ |
| Xử lý timezone đúng | ❌ |
| `error.tsx` / `loading.tsx` | ✅ |
| `global-error.tsx` | ❌ |
| Monitoring / error tracking | ❌ |
| Test tự động | ❌ |
| CI | ❌ |
| README / tài liệu setup đúng | ❌ (DEPLOY.md lỗi thời) |
| Cron có bảo vệ secret | ✅ (nên timing-safe) |
| Upload file validate loại và dung lượng | ✅ |
| Ảnh riêng tư (chat) không public | ❌ |
| Asset nặng đã tối ưu | ❌ (video 14 MB) |
