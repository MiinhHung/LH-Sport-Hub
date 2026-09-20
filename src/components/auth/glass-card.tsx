import { BeamFrame } from "@/components/ui/beam-frame";

/**
 * Thẻ kính của hai trang đăng nhập / đăng ký.
 *
 * Chỉ còn phần MẶT KÍNH. Vệt sáng chạy viền, đốm góc và độ nghiêng đã
 * chuyển sang `BeamFrame` để hai trang tạo kèo / tạo buổi tập dùng chung —
 * trước đó cả bộ nằm gọn trong tệp này, mà chép sang nơi khác thì thành
 * hai bản mã giống nhau phải sửa song song.
 *
 * Mặt kính ở lại đây vì nó là thứ riêng của hai trang này: chúng có nền
 * navy cố định, không theo chế độ sáng/tối. Trong app thì khối bên trong
 * là thẻ thường, tự đổi màu theo nền.
 */
export function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <BeamFrame>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-950/45 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
        {/* Lưới chéo rất mờ, để mặt kính không phẳng lì */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)",
            backgroundSize: "30px 30px",
          }}
        />

        <div className="relative">{children}</div>
      </div>
    </BeamFrame>
  );
}
