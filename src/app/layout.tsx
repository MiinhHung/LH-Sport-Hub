import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";

import { THEME_SCRIPT } from "@/components/theme";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { publicEnv } from "@/lib/env";
import "./globals.css";

/** Be Vietnam Pro được thiết kế riêng cho dấu tiếng Việt. */
const sans = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

/** Serif tương phản cao, khớp với chữ trong logo Light Human. */
const display = Playfair_Display({
  subsets: ["vietnamese", "latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: `${APP_NAME} — Kèo & buổi tập của team`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    type: "website",
    locale: "vi_VN",
    images: ["/logo.png"],
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#001a4a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      className={`${sans.variable} ${display.variable}`}
      // Đoạn mã chặn bên dưới gắn lớp `.dark` trước khi React hydrate, nên
      // thuộc tính class của <html> sẽ khác với bản máy chủ dựng ra. Đây là
      // khác biệt CÓ CHỦ Ý, không phải lỗi; báo cho React biết để nó đừng
      // cảnh báo, và chỉ báo ở đúng thẻ này chứ không phải cả cây.
      suppressHydrationWarning
    >
      <body className="antialiased">
        {/*
          Chạy trước khung hình đầu tiên để không nháy trắng. Nội dung là
          hằng số do chính ứng dụng viết ra, không có gì từ người dùng lọt
          vào — xem THEME_SCRIPT trong components/theme.tsx.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />

        <a href="#noi-dung" className="skip-link">
          Bỏ qua tới nội dung
        </a>
        {children}
      </body>
    </html>
  );
}
