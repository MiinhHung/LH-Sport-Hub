import type { MetadataRoute } from "next";

import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

/**
 * Bản kê khai để thêm app vào màn hình chính điện thoại.
 *
 * Đội này dùng app ngay tại sân, trên điện thoại, một tay. Thêm vào màn
 * hình chính thì nó mở toàn màn hình — không thanh địa chỉ, không thanh
 * dấu trang — nên phần nội dung được thêm gần 120px chiều cao, và quan
 * trọng hơn là mở bằng một cú chạm thay vì gõ lại địa chỉ.
 *
 * `start_url` LÀ "/" CHỨ KHÔNG PHẢI "/bang-tin", dù bảng tin mới là nơi
 * người ta hay vào. Lý do: "/" là đường dẫn công khai duy nhất. Mở thẳng
 * vào bảng tin mà phiên đã hết hạn thì cú chạm đầu tiên rơi vào một cú
 * chuyển hướng sang trang đăng nhập — mở app ra thấy màn hình đăng nhập
 * là ấn tượng đầu tiên tệ nhất có thể.
 *
 * Và từ "/" thì người còn phiên KHÔNG phải bấm thêm gì: trang đó tự
 * chuyển sang bảng tin khi đã đăng nhập (xem `(marketing)/page.tsx`).
 * Trước đây nó dừng lại ở trang giới thiệu với một nút "Vào bảng tin",
 * tức mỗi lần mở app là trả thêm một cú chạm để phòng một trường hợp
 * thỉnh thoảng mới xảy ra.
 *
 * CÓ HAI BẢN BIỂU TƯỢNG 512, và đó không phải thừa. Android cắt biểu
 * tượng theo hình của từng hãng máy — tròn, vuông bo góc, giọt nước.
 * Bản `maskable` chừa sẵn lề 20% mỗi bên để phần bị cắt không ăn vào
 * logo. Bản thường giữ nguyên khổ cho những chỗ không cắt.
 *
 * Màu nền để trắng chứ không navy: đây là màu màn hình chờ lúc mở app,
 * mà logo gốc có nền trắng đặc — để navy thì logo hiện ra thành một ô
 * trắng nổi giữa nền tối.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} - Light Human`,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#001a4a",
    lang: "vi",
    categories: ["sports", "social"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
