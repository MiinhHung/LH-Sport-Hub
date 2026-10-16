# Đưa LH Sport Hub lên Vercel

Làm theo đúng thứ tự. Bước 1 bắt buộc phải xong trước khi deploy.

## 1. Tạo bảng cho Bảng tin (BẮT BUỘC)

Phần bảng tin dùng 4 bảng mới chưa có trong database.

```bash
npm run db:setup
```

Chạy `supabase/01-them-bang-tin.sql` lên database trong `DATABASE_URL`.
Cả file chạy trong một transaction: hỏng thì không đổi gì.

File này chỉ thêm mới, không sửa/xoá gì đang có, và chạy lại nhiều lần cũng không sao.

Kiểm tra: chạy `select count(*) from posts;` — ra `0` là được.

## 2. Tạo kho ảnh

```bash
npm run storage:setup
```

Tạo bucket `media` ở chế độ công khai (ảnh bài viết và avatar cần đọc
được qua URL). Chạy lại nhiều lần vô hại.

> Cả bước 1 và 2 gộp lại: `npm run setup`

## 3. Biến môi trường trên Vercel

Vào Project → Settings → Environment Variables, thêm cho cả
Production và Preview:

| Biến | Lấy ở đâu |
| --- | --- |
| `DATABASE_URL` | Supabase → Connect → **Transaction pooler** (cổng 6543) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (**tuyệt đối không để lộ**) |
| `NEXT_PUBLIC_SITE_URL` | `https://ten-app.vercel.app` |
| `CRON_SECRET` | Tự sinh chuỗi ngẫu nhiên dài |
| `ALLOWED_EMAIL_DOMAINS` | Domain email công ty, ví dụ `lighthuman.vn` |
| `BOOTSTRAP_ADMIN_EMAILS` | Email của bạn, để lần đăng nhập đầu tự thành admin |

Lưu ý `DATABASE_URL` **phải** là transaction pooler (6543), không dùng
kết nối trực tiếp 5432 — serverless mở nhiều kết nối ngắn, dùng 5432 sẽ
hết slot.

## 4. Deploy

```bash
git init && git add . && git commit -m "LH Sport Hub"
# đẩy lên GitHub rồi Import vào Vercel
```

`vercel.json` đã đặt sẵn:

- **Region `sin1`** (Singapore) — trùng region Supabase `ap-southeast-1`.
  Để mặc định (Mỹ) thì mỗi truy vấn database phải đi vòng nửa vòng trái
  đất, chậm thấy rõ.
- **Cron mỗi giờ** gọi `/api/cron` để tự xác nhận kết quả quá 3 ngày
  không ai phản hồi và nhắc lịch buổi tập. Vercel tự gửi kèm
  `Authorization: Bearer $CRON_SECRET`, nên chỉ cần khai biến đó là chạy.

## 5. Sau khi deploy

- Cập nhật `NEXT_PUBLIC_SITE_URL` thành domain thật rồi redeploy.
- Supabase → Authentication → URL Configuration: thêm domain Vercel vào
  **Site URL** và **Redirect URLs**.
- Đăng nhập bằng email trong `BOOTSTRAP_ADMIN_EMAILS` để có quyền admin.

### Xác nhận email khi đăng ký (nếu bật "Confirm email")

Người mới bấm link xác nhận xong phải được ĐĂNG NHẬP LUÔN. Ba chỗ cần đúng:

1. **Site URL** = `https://<domain thật>` (không để `http://localhost:3000`).
2. **Redirect URLs** có `https://<domain thật>/**`.
3. **Mẫu email** (Authentication → Emails → Templates → *Confirm signup*):
   đổi link thành kiểu `token_hash` để bấm trên thiết bị nào cũng vào được
   (kiểu mặc định chỉ vào được nếu mở link đúng trình duyệt lúc đăng ký):

   ```html
   <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/bang-tin">
     Xác nhận email
   </a>
   ```

Gói Supabase miễn phí dùng máy gửi mail có sẵn, mỗi giờ chỉ gửi được vài
email. Team đông thì gắn SMTP riêng (Resend, Brevo… gói miễn phí là đủ) ở
Authentication → SMTP Settings.

## Giới hạn gói miễn phí (đủ dùng cho ~20 người)

- Supabase free: 500MB database, 1GB storage. Ảnh đã được nén về WebP
  ~200KB/tấm, nên 1GB đủ cho khoảng 5.000 ảnh.
- Supabase free **tạm dừng project nếu 7 ngày không ai truy cập**. Team
  đánh hàng tuần thì hiếm khi dính, nhưng nếu nghỉ dài thì lần vào đầu
  tiên sẽ chậm vài chục giây.
