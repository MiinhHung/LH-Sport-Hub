import { ArrowUpRight, Newspaper } from "@/components/icons";
import type { Metadata } from "next";

import { MucLucCamNang } from "@/components/handbook/muc-luc";
import { PageIntro } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { ARTICLES, CATEGORIES } from "@/content/cam-nang";

export const metadata: Metadata = { title: "Cẩm nang" };

export default async function HandbookPage() {
  await requireProfile();

  return (
    <div className="space-y-6">
      {/* Đầu trang như mọi trang khác. Dải bìa có video chạy nền trước đây
          ăn 190px chỉ để nói lại chữ "Cẩm nang"; bìa lớn giờ thuộc về bài
          nổi bật, nơi nó dẫn vào một bài thật. */}
      <PageIntro
        title="Cẩm nang"
        lead={`Luật chơi, kỹ thuật, khởi động và trang bị. ${ARTICLES.length} bài, gom một chỗ để tra cho nhanh.`}
      />

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
        className="group flex items-center gap-3.5 rounded-xl border border-ink-800 bg-ink-900 p-4 transition-colors hover:border-ink-700 hover:bg-ink-850"
      >
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-navy-900 text-gold-300"
        >
          <Newspaper className="size-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-ink-100">
            Tin cầu lông mới nhất
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-ink-500">
            Giải đấu, kết quả, chuyển động. Đọc trên thethao247.vn
          </span>
        </span>

        <ArrowUpRight className="size-5 shrink-0 text-ink-500 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </a>

      <p className="border-t border-ink-800 pt-6 text-center text-[13px] text-ink-500">
        Thiếu nội dung nào hoặc thấy chỗ nào chưa đúng? Mọi người nhắn trong
        bảng tin để em bổ sung nhaaaaaa.
      </p>
    </div>
  );
}
