import { ArrowUpRight, Newspaper } from "lucide-react";
import type { Metadata } from "next";

import { MucLucCamNang } from "@/components/handbook/muc-luc";
import { HeroVideo } from "@/components/hero-video";
import { requireProfile } from "@/lib/auth";
import { ARTICLES, CATEGORIES } from "@/content/cam-nang";

export const metadata: Metadata = { title: "Cẩm nang" };

export default async function HandbookPage() {
  await requireProfile();

  return (
    <div className="space-y-8">
      {/*
        Dải bìa thu từ 340px xuống 190px.

        Nó vẫn giữ được chất — video chạy nền, phủ navy, ánh vàng chéo
        góc — nhưng không còn ăn gần hết màn hình đầu tiên. Đo trước khi
        sửa: dải bìa 340px cộng thẻ bài nổi bật 480px đẩy bài THỨ HAI
        xuống y=1072, tức phải cuộn qua hơn một màn mới thấy bài thứ hai
        trong một mục có mười ba bài.
      */}
      <header className="relative -mx-4 h-[170px] overflow-hidden sm:mx-0 sm:h-[190px] sm:rounded-3xl">
        <HeroVideo label="Cảnh thi đấu cầu lông" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/88 to-navy-900/65" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_88%_10%,rgba(220,174,66,0.18),transparent_65%)]" />

        <div className="relative flex h-full max-w-2xl flex-col justify-end p-6 sm:p-8">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-gold-300 uppercase">
            Cẩm nang
          </p>
          <h1 className="font-display mt-1.5 text-[26px] leading-[1.08] font-bold text-white sm:text-[32px]">
            Đánh cho đúng, giữ cho bền
          </h1>
          <p className="mt-2 max-w-[52ch] text-[13.5px] leading-relaxed text-white/70">
            Luật chơi, kỹ thuật, khởi động và trang bị — {ARTICLES.length} bài,
            gom một chỗ để tra cho nhanh.
          </p>
        </div>
      </header>

      <MucLucCamNang articles={ARTICLES} categories={CATEGORIES} />

      {/*
        TIN CẦU LÔNG: DẪN SANG NGUỒN, KHÔNG KÉO VỀ.

        Ý ban đầu là hiện tin từ thethao247.vn ngay trong app. Đã thử và
        không làm được một cách tử tế:

          · trang không có RSS — mọi đường feed đều trả 404;
          · trang nấp sau Cloudflare, yêu cầu từ Node nhận HTTP 403 kèm
            màn hình "Just a moment...", kể cả với đầy đủ header trình
            duyệt. Muốn lấy được phải vượt qua một lớp chặn họ cố tình
            dựng lên, và nội dung thì vẫn là của họ.

        Đã thử nguồn thay thế có RSS hợp lệ: quét 6 báo thể thao Việt Nam
        được 1260 tin, chỉ 4 tin nhắc tới cầu lông mà 2 là dương tính giả.
        Một mục tin dựng trên đó sẽ trống gần như mọi lúc — trống còn tệ
        hơn không có.

        Nên: một đường dẫn thật thà. Không bao giờ hỏng, không đụng tới
        công sức của ai.
      */}
      <a
        href="https://thethao247.vn/cau-long-c44/"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3.5 rounded-2xl border border-ink-800 bg-ink-900 p-4 transition-colors hover:border-ink-700 hover:bg-ink-850"
      >
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-50 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300"
        >
          <Newspaper className="size-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-ink-100">
            Tin cầu lông mới nhất
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-ink-500">
            Giải đấu, kết quả, chuyển động — đọc trên thethao247.vn
          </span>
        </span>

        <ArrowUpRight
          className="size-5 shrink-0 text-ink-500 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden
        />
      </a>

      <p className="border-t border-ink-800 pt-6 text-center text-[13px] text-ink-500">
        Thiếu nội dung nào hoặc thấy chỗ nào chưa đúng? Mọi người nhắn trong
        bảng tin để em bổ sung nhaaaaaa.
      </p>
    </div>
  );
}
