import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { CalendarDays, MapPin, Users } from "@/components/icons";
import { LinkButton } from "@/components/ui/button";
import { SPORTS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { getSessionMoi } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";

/**
 * Trang mời công khai của một buổi tập: `/moi/<id>`.
 *
 * ================================================================
 * VÌ SAO PHẢI LÀ MỘT TRANG CÔNG KHAI RIÊNG
 * ================================================================
 *
 * Dán link buổi tập vào Zalo thì thẻ xem trước luôn ra đúng một câu
 * chung chung — "LH Sport Hub · Cộng đồng thể thao nội bộ…" — bất kể
 * gửi buổi nào.
 *
 * Lý do đo được: `/buoi-tap/<id>` nằm sau đăng nhập, nên trình thu thập
 * của Zalo nhận HTTP 307 đá sang `/dang-nhap` rồi đọc thẻ của TRANG
 * ĐĂNG NHẬP. Trình thu thập là một khách vô danh; không cho nó đọc được
 * gì thì không thể có thẻ xem trước nào khác.
 *
 * Nên có trang này: công khai, nhẹ, và chỉ mang đúng những gì cần để
 * quyết định có đi hay không.
 *
 * ================================================================
 * CHỈ LỘ NHỮNG GÌ CẦN
 * ================================================================
 *
 * Công khai: tên buổi, giờ, sân, và ĐẾM số người nhận đi.
 * Giữ kín: tên người tham gia, tiền sân, ghi chú, mã QR, địa chỉ chi
 * tiết. Xem ghi chú ở `getSessionMoi` trong `lib/queries.ts`.
 *
 * Đây là đánh đổi có chủ ý, không phải sơ suất: muốn có thẻ xem trước
 * thì ai cầm link cũng đọc được chừng ấy. Đổi lại, người được rủ biết
 * ngay là kèo gì trước khi phải đăng nhập.
 */

type Props = { params: Promise<{ id: string }> };

/** Câu mô tả dùng cho cả thẻ xem trước lẫn phần đầu trang. */
function moTaBuoi(b: {
  startsAt: Date;
  venueName: string;
  soNguoiDi: number;
  maxPlayers: number | null;
  status: string;
}) {
  if (b.status === "cancelled") return "Buổi này đã huỷ.";

  // `formatDateTime` đã kèm sẵn thứ ("Thứ 7, 19/09 • 20:00"), nên đừng
  // ghép thêm `weekdayLabel` — ra "Thứ 7, Thứ 7, 19/09".
  const khi = formatDateTime(b.startsAt);
  const nguoi =
    b.soNguoiDi === 0
      ? "Chưa ai nhận đi — mở hàng đi."
      : b.maxPlayers
        ? `${b.soNguoiDi}/${b.maxPlayers} người đã nhận đi.`
        : `${b.soNguoiDi} người đã nhận đi.`;

  return `${khi} · ${b.venueName}. ${nguoi}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const buoi = await getSessionMoi(id);
  if (!buoi) return { title: "Không tìm thấy buổi tập" };

  const mon = SPORTS[buoi.sport as keyof typeof SPORTS]?.label ?? "Thể thao";
  const tieuDe = `${buoi.title} — rủ đi ${mon.toLowerCase()}`;
  const moTa = moTaBuoi(buoi);

  return {
    title: buoi.title,
    description: moTa,
    /*
      PHẢI KHAI LẠI `images`. Khai `openGraph` ở trang con là THAY THẾ
      hẳn khối của `app/layout.tsx`, không phải trộn vào — bỏ trống thì
      thẻ xem trước mất luôn ảnh và hiện trơ chữ. Đã đo: không có dòng
      này thì trang trả về không có thẻ `og:image` nào.

      Đường dẫn tương đối được, vì `metadataBase` ở layout gốc dựng
      thành tuyệt đối.
    */
    openGraph: {
      title: tieuDe,
      description: moTa,
      type: "website",
      images: ["/logo.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: tieuDe,
      description: moTa,
      images: ["/logo.png"],
    },
    /* Trang mời không nên nằm trong kết quả tìm kiếm: nó dành cho người
       được gửi link, không phải cho người lạ dò ra. */
    robots: { index: false, follow: false },
  };
}

export default async function TrangMoi({ params }: Props) {
  const { id } = await params;
  const buoi = await getSessionMoi(id);
  if (!buoi) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
    Đã đăng nhập thì vào thẳng buổi tập; chưa thì qua đăng nhập kèm
    `?next=` để sau khi đăng nhập quay lại đúng buổi vừa bấm — luồng đó
    đã có sẵn trong middleware.
  */
  const dich = `/buoi-tap/${buoi.id}`;
  const nutHref = user
    ? dich
    : `/dang-nhap?next=${encodeURIComponent(dich)}`;

  const daHuy = buoi.status === "cancelled";
  /*
    `react-hooks/purity` kêu vì `Date.now()` gọi trong lúc render. Luật
    đó đúng với component phía client, nơi render chạy lại nhiều lượt và
    phải cho cùng kết quả. Đây là SERVER component (`async`): mỗi yêu
    cầu chạy đúng một lượt rồi trả HTML, và "buổi này qua chưa" thì bắt
    buộc phải đọc đồng hồ. Plugin không phân biệt được hai loại.
  */
  // eslint-disable-next-line react-hooks/purity
  const daQua = buoi.endsAt.getTime() < Date.now();
  const mon = SPORTS[buoi.sport as keyof typeof SPORTS]?.label ?? "Thể thao";

  return (
    <main className="grid min-h-dvh place-items-center bg-navy-950 px-5 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5">
          <Image
            src="/logo-light.png"
            alt=""
            aria-hidden
            width={656}
            height={562}
            sizes="36px"
            className="h-9 w-auto object-contain"
          />
          <span className="font-display text-[17px] font-bold text-white">
            LH Sport Hub
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-[11px] font-bold tracking-[0.16em] text-gold-300 uppercase">
            {daHuy ? "Đã huỷ" : daQua ? "Đã diễn ra" : `Rủ đi ${mon}`}
          </p>

          <h1 className="font-display mt-2 text-[26px] leading-tight font-bold text-white">
            {buoi.title}
          </h1>

          <dl className="mt-5 space-y-3 text-[14px]">
            <div className="flex items-start gap-2.5">
              <CalendarDays
                className="mt-0.5 size-4 shrink-0 text-gold-300"
                aria-hidden
              />
              <div>
                <dt className="sr-only">Thời gian</dt>
                <dd className="text-white/90">
                  {formatDateTime(buoi.startsAt)}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin
                className="mt-0.5 size-4 shrink-0 text-gold-300"
                aria-hidden
              />
              <div>
                <dt className="sr-only">Sân</dt>
                <dd className="text-white/90">{buoi.venueName}</dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Users
                className="mt-0.5 size-4 shrink-0 text-gold-300"
                aria-hidden
              />
              <div>
                <dt className="sr-only">Người tham gia</dt>
                <dd className="text-white/90">
                  {buoi.soNguoiDi === 0
                    ? "Chưa ai nhận đi"
                    : buoi.maxPlayers
                      ? `${buoi.soNguoiDi}/${buoi.maxPlayers} người đã nhận đi`
                      : `${buoi.soNguoiDi} người đã nhận đi`}
                </dd>
              </div>
            </div>
          </dl>

          {daHuy ? (
            <p className="mt-6 text-[13.5px] text-white/60">
              Buổi này đã huỷ rồi. Vào app xem còn buổi nào khác không nhé.
            </p>
          ) : (
            <LinkButton href={nutHref} variant="accent" className="mt-6 w-full">
              {daQua ? "Xem buổi này" : "Tham gia"}
            </LinkButton>
          )}

          {!user && !daHuy && (
            <p className="mt-3 text-center text-[12.5px] text-white/50">
              Cần đăng nhập bằng tài khoản LH Sport Hub.
            </p>
          )}
        </div>

        <p className="mt-5 text-center text-[12.5px] text-white/40">
          Sân chơi nội bộ của team Light Human.
        </p>
      </div>
    </main>
  );
}
