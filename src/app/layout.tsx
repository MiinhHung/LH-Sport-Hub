import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Plus_Jakarta_Sans, Caveat } from "next/font/google";

import { THEME_SCRIPT } from "@/components/theme";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { publicEnv } from "@/lib/env";
import { INTRO_SCRIPT } from "@/lib/intro";
import "./globals.css";

/**
 * FONT CHỮ HIỆN ĐẠI HỖ TRỢ TIẾNG VIỆT TOÀN DIỆN.
 * Plus Jakarta Sans: hình học thanh thoát, tối ưu cho giao diện SaaS.
 * Barlow Condensed: phong cách thể thao, năng lượng, góc cạnh cho tiêu đề.
 * Caveat: chữ ký viết tay nghệ thuật của các thành viên.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ["vietnamese", "latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["vietnamese", "latin"],
  variable: "--font-sport",
  display: "swap",
  weight: ["600", "700", "800", "900"],
});

const caveat = Caveat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-signature",
  display: "swap",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: `${APP_NAME}: kèo & buổi tập của team`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  /*
   * Biểu tượng tab dùng bản thu nhỏ, KHÔNG dùng logo.png gốc.
   *
   * logo.png là ảnh 958×1024 nặng 335KB. Trình duyệt tải nó về chỉ để vẽ
   * một ô 16px trên thanh tab — và tải ở MỌI trang, kể cả trang giới
   * thiệu vốn không dùng logo ở đâu khác. Đo trên bản build: đó là tệp
   * nặng nhất của cả trang chủ, hơn cả gói JavaScript lớn nhất.
   *
   * Hai bản thu nhỏ sinh từ chính tệp đó: 64px cho tab (2,1KB) và 180px
   * cho lúc lưu vào màn hình chính iOS (15,3KB).
   */
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
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
      className={`${sans.variable} ${barlowCondensed.variable} ${caveat.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/*
         * Thẻ <script> THƯỜNG, không dùng next/script.
         *
         * Ở App Router, `<Script strategy="beforeInteractive">` không chạy lúc
         * trình duyệt đọc HTML: Next xếp nó vào hàng `self.__next_s` rồi mới
         * chạy sau khi tải xong gói JavaScript, và theo tài liệu thì nó "không
         * chặn hydrate". Tức là nền tối loé trắng một nhịp, còn màn mở đầu có
         * khi gắn cờ trễ hơn lúc React mount, thành không chiếu.
         *
         * Thẻ thường trong <head> thì trình duyệt chạy ngay khi đọc tới, trước
         * khung hình đầu tiên. Hai đoạn này nhỏ và không phụ thuộc gì.
         */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body className="antialiased">
        <a href="#noi-dung" className="skip-link">
          Bỏ qua tới nội dung
        </a>
        {children}
      </body>
    </html>
  );
}
