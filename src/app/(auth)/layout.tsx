import Image from "next/image";

import { AuthReveal } from "@/components/auth-reveal";
import { GlassCard } from "@/components/auth/glass-card";
import { HeroVideo } from "@/components/hero-video";
import { HoaTietThuongHieu } from "@/components/hoa-tiet-thuong-hieu";
import { BookOpen, Swords, Trophy } from "@/components/icons";

/** Ba thứ app làm, kể bằng một danh sách dọc chứ không phải ba ô bằng nhau. */
const DIEM = [
  { icon: Swords, k: "Kèo 1v1 và 2v2", v: "Mở cho cả team hoặc thách đích danh" },
  { icon: BookOpen, k: "Cẩm nang", v: "Luật, kỹ thuật, khởi động" },
  { icon: Trophy, k: "Bảng phong thần", v: "Vua kèo, chuỗi thắng" },
] as const;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Bảng thương hiệu — video cầu lông chạy nền, phủ navy. */}
      <aside className="relative hidden overflow-hidden lg:block">
        <HeroVideo label="Cảnh thi đấu cầu lông" />

        {/* Phủ đậm: video chỉ còn là chuyển động mờ phía sau, chữ vẫn đọc
            được và mọi thương hiệu của YouTube đều bị che. */}
        <div className="absolute inset-0 bg-navy-950/90" />

        {/*
          Hoạ tiết nhận diện, ĐẶT TRÊN lớp phủ chứ không dưới.

          Dưới lớp phủ thì `bg-navy-950/90` nuốt mất gần hết nét vàng.
          Trên lớp phủ nhưng dưới nội dung thì nó là nền có vân, còn chữ
          và logo vẫn nằm trên cùng.

          ĐẶT GÓC TRÊN-PHẢI, KHÔNG PHỦ CẢ BẢNG. Bản đầu tôi cho nó cao
          bằng cả cột: nét vàng cắt thẳng qua dòng tiêu đề, đọc chữ thì
          vướng mà hoạ tiết cũng chẳng ra hình gì. Trong banner gốc nó
          nằm gọn một bên, chừa hẳn chỗ cho chữ.

          Logo ở góc trên-TRÁI, tiêu đề ở giữa-trái, ba dòng giới thiệu
          ở dưới — nên góc trên-phải là mảng trống duy nhất.

          Tràn qua mép phải để trông như một mảng lớn hơn khung, chứ
          không phải một cái hình dán vào giữa.
        */}
        <HoaTietThuongHieu className="absolute -top-20 -right-28 aspect-square w-[78%]" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          {/*
            CÓ LOGO THẬT, KHÔNG CHỈ LÀ CHỮ.

            Chỗ này trước đây chỉ có khoá chữ "Light Human | SPORT HUB",
            kèm chú thích rằng logo nền trắng đặt lên navy sẽ thành một ô
            trắng. Điều đó đúng với `logo.png`, nhưng `logo-light.png` —
            bản nét sáng nền trong suốt — thì không, và chính tệp này đã
            dùng nó trên nền navy ở khối dành cho màn nhỏ phía dưới. Tức
            là lý do viết trong chú thích đã hết đúng từ lúc có tệp đó.

            Trang đăng nhập là thứ người mới thấy đầu tiên, nên để logo
            công ty ở đây chứ không bắt họ tin vào một dòng chữ.
          */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo-light.png"
              alt=""
              width={656}
              height={562}
              /* `sizes` chứ không để Next tự đoán: thiếu nó thì nó lấy theo
                 `width={656}` nhân với tỉ lệ điểm ảnh của màn, và đo được
                 là trình duyệt tải về bản rộng 1920px để vẽ một logo cao
                 44px. Khai báo đúng cỡ hiển thị thì nó chọn bản nhỏ. */
              sizes="64px"
              priority
              className="h-11 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="font-display text-xl leading-tight font-bold text-white">
                Light Human
              </span>
              <span className="text-[13px] font-semibold text-gold-300">
                Sport Hub
              </span>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="font-display text-4xl leading-[1.12] font-bold text-white xl:text-[44px]">
              Thách nhau một kèo,
              <br />
              thua thì <span className="text-gold-300">bao</span>.
            </h2>
            {/*
              Một câu, không phải một danh sách.

              Bản trước nhồi năm tính năng vào một câu 38 chữ rồi đóng lại
              bằng "tất cả gọn trong một nơi" — câu ai cũng viết được và
              không nói thêm điều gì. Mà ngay bên dưới đã có ba mục liệt
              kê sẵn tính năng rồi, nên đoạn này liệt kê lần nữa là thừa.

              Giữ ba động từ cụ thể nhất rồi kết bằng đúng cái khó chịu có
              thật mà app này giải quyết. Câu cuối cố ý trùng ý với dòng
              trên trang giới thiệu, để hai nơi nghe ra cùng một giọng.
            */}
            <p className="mt-5 text-[15px] leading-relaxed text-white/75">
              Chốt kèo, lên lịch ra sân, ghi tỉ số sau mỗi trận. Khỏi lục lại
              năm cái group chat.
            </p>
          </div>

          <ul className="max-w-md space-y-4 border-t border-white/15 pt-8">
            {DIEM.map(({ icon: Icon, k, v }) => (
              <li key={k} className="flex items-center gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/[0.08] text-gold-300">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-white">
                    {k}
                  </span>
                  <span className="block text-[13px] text-white/70">{v}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/*
        Bảng biểu mẫu.

        NỀN NAVY, KHÔNG THEO CHẾ ĐỘ SÁNG/TỐI, để hai nửa trang liền một
        mạch. Bỏ hai quầng sáng mờ và mặt kính của bản trước: chỗ gõ mật
        khẩu nên trông yên và chắc, không cần hiệu ứng ánh sáng.
      */}
      <main
        id="noi-dung"
        className="relative flex items-center justify-center overflow-hidden bg-navy-950 px-5 py-12 sm:px-8"
      >
        <AuthReveal>
          {/* Khoá thương hiệu cho màn hình nhỏ. Dùng bản nét sáng nền trong
              suốt: logo.png có nền TRẮNG ĐẶC, trước đây nó dựa vào
              mix-blend-multiply với nền sáng để tan nền đi — trên navy thì
              thủ thuật đó cho ra đúng một ô trắng. */}
          <div className="mb-7 flex flex-col items-center text-center lg:hidden">
            <Image
              src="/logo-light.png"
              alt="Light Human"
              width={656}
              height={562}
              sizes="96px"
              priority
              className="h-16 w-auto object-contain"
            />
            <p className="mt-1.5 text-[14px] font-semibold text-gold-300">
              Sport Hub
            </p>
          </div>

          <GlassCard>{children}</GlassCard>

          <p className="mt-7 text-center text-[12.5px] leading-relaxed text-white/65">
            Dành riêng cho nhân viên Light Human
          </p>
        </AuthReveal>
      </main>
    </div>
  );
}
