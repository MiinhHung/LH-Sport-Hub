"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import {
  TheThanhVien,
  type ThanhVien,
} from "@/components/thanh-vien/the-thanh-vien";
import {
  SKILL_LEVELS,
  SKILL_LEVEL_KEYS,
  type SkillLevelKey,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Danh sách thành viên: ô tìm, lọc theo mức chơi, và chia hai nhóm.
 *
 * TRANG NÀY TRƯỚC ĐÂY LÀ MỘT LƯỚI PHẲNG. Mọi thẻ nặng ngang nhau, xếp
 * theo bảng chữ cái — nghĩa là thứ tự không mang thông tin gì. Mở ra
 * không biết nhìn vào đâu trước.
 *
 * Giờ chia hai nhóm theo câu hỏi người ta thật sự có: "ai đang đánh?"
 * (xếp theo số trận thắng, ba người đầu có số hạng trên ảnh) và "ai chưa
 * ra sân?" (xếp theo tên — nhóm này không có thứ tự nào đáng kể, và để
 * riêng ra thì ai đó nhìn vào sẽ nghĩ đến chuyện rủ họ đi đánh).
 *
 * Ô tìm và hàng lọc chỉ hiện từ 8 người trở lên. Team đang 19 người và
 * sẽ tới gần 30, lúc đó cuộn tìm một cái tên là việc khó chịu thật; còn
 * bày ô tìm ra trước ba cái thẻ thì nó chỉ chiếm chỗ.
 *
 * Lọc ở ngay trình duyệt chứ không qua URL: cả danh sách đã nằm sẵn
 * trong trang rồi (30 người là vài KB), gõ một chữ mà phải đợi máy chủ
 * trả về thì chậm hơn hẳn mà chẳng được gì.
 */
export function DanhSachThanhVien({
  members,
  meId,
}: {
  members: ThanhVien[];
  meId: string;
}) {
  const [tim, setTim] = useState("");
  const [muc, setMuc] = useState<SkillLevelKey | null>(null);

  const coBoLoc = members.length >= 8;

  const loc = useMemo(() => {
    const tu = tim.trim().toLowerCase();
    return members.filter((m) => {
      if (muc && m.skillLevel !== muc) return false;
      if (!tu) return true;
      return (
        m.fullName.toLowerCase().includes(tu) ||
        (m.department ?? "").toLowerCase().includes(tu)
      );
    });
  }, [members, tim, muc]);

  const daRaSan = useMemo(
    () =>
      loc
        .filter((m) => m.played > 0)
        .sort(
          (a, b) =>
            b.wins - a.wins ||
            b.played - a.played ||
            a.fullName.localeCompare(b.fullName, "vi"),
        ),
    [loc],
  );

  const chuaRaSan = useMemo(
    () =>
      loc
        .filter((m) => m.played === 0)
        .sort((a, b) => a.fullName.localeCompare(b.fullName, "vi")),
    [loc],
  );

  return (
    <div className="space-y-7">
      {coBoLoc && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500"
              aria-hidden
            />
            <input
              value={tim}
              onChange={(e) => setTim(e.target.value)}
              placeholder="Tìm tên hoặc phòng ban..."
              aria-label="Tìm thành viên"
              className="h-10 w-full rounded-xl border border-ink-800 bg-ink-850 pr-3 pl-9 text-[14px] text-ink-200 outline-none placeholder:text-ink-500 focus:border-ink-700"
            />
          </div>

          <div className="no-scrollbar -mx-4 flex items-center gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setMuc(null)}
              aria-pressed={muc === null}
              className={cn(
                "text-[11px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase transition-colors",
                muc === null
                  ? "text-gold-700 dark:text-gold-300"
                  : "text-ink-500 hover:text-ink-300",
              )}
            >
              Tất cả
            </button>
            {SKILL_LEVEL_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setMuc(muc === key ? null : key)}
                aria-pressed={muc === key}
                className={cn(
                  "text-[11px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase transition-colors",
                  muc === key
                    ? "text-gold-700 dark:text-gold-300"
                    : "text-ink-500 hover:text-ink-300",
                )}
              >
                {SKILL_LEVELS[key].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loc.length === 0 ? (
        <p className="py-10 text-center text-[14px] text-ink-500">
          Không có ai khớp với “{tim}”.
        </p>
      ) : (
        <>
          {daRaSan.length > 0 && (
            <section aria-labelledby="da-ra-san">
              <h2
                id="da-ra-san"
                className="mb-3 text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase"
              >
                Đang ra sân · {daRaSan.length}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {daRaSan.map((m, i) => (
                  <TheThanhVien
                    key={m.id}
                    m={m}
                    isMe={m.id === meId}
                    nguoiXem={meId}
                    /* Số hạng chỉ gắn khi KHÔNG lọc gì: lọc xong mà vẫn
                       đeo huy chương thì "hạng 1" chỉ còn nghĩa là hạng
                       nhất trong số người vừa lọc ra, dễ hiểu nhầm.

                       Và phải có ít nhất một trận thắng. Team mới có hai
                       người đã đánh, người thua đứng thứ hai vẫn được
                       gắn số 2 lên ảnh — trông như huy chương bạc cho
                       một trận thua. */
                    hang={
                      !tim && !muc && i < 3 && m.wins > 0 ? i + 1 : undefined
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {chuaRaSan.length > 0 && (
            <section aria-labelledby="chua-ra-san">
              <h2
                id="chua-ra-san"
                className="mb-3 text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase"
              >
                Chưa ra sân · {chuaRaSan.length}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {chuaRaSan.map((m) => (
                  <TheThanhVien
                    key={m.id}
                    m={m}
                    isMe={m.id === meId}
                    nguoiXem={meId}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
