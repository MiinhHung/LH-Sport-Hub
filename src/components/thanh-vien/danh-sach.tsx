"use client";

import { Search, UserSearch } from "@/components/icons";
import { useMemo, useState } from "react";

import {
  TheThanhVien,
  type ThanhVien,
} from "@/components/thanh-vien/the-thanh-vien";
import { Card, EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/button";
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

  const pill = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
      active
        ? "border-navy-900 bg-navy-900 text-white dark:border-ink-600 dark:bg-ink-700"
        : "border-ink-800 text-ink-400 hover:border-ink-700 hover:text-ink-100",
    );

  const dangLoc = Boolean(tim.trim()) || muc !== null;

  return (
    <div className="space-y-6">
      {coBoLoc && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-500"
              aria-hidden
            />
            <input
              type="search"
              value={tim}
              onChange={(e) => setTim(e.target.value)}
              placeholder="Tìm tên hoặc phòng ban"
              aria-label="Tìm thành viên"
              className="h-10 w-full rounded-lg border border-ink-700 bg-ink-900 pr-3 pl-10 text-[14px] text-ink-200 outline-none transition-[border-color,box-shadow] placeholder:text-ink-500 hover:border-ink-600 focus:border-gold-500 focus:ring-2 focus:ring-gold-400/25"
            />
          </div>

          <div
            role="group"
            aria-label="Lọc theo trình độ"
            className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
          >
            <button
              type="button"
              onClick={() => setMuc(null)}
              aria-pressed={muc === null}
              className={pill(muc === null)}
            >
              Tất cả
            </button>
            {SKILL_LEVEL_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setMuc(muc === key ? null : key)}
                aria-pressed={muc === key}
                className={pill(muc === key)}
              >
                {SKILL_LEVELS[key].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loc.length === 0 ? (
        <EmptyState
          icon={<UserSearch className="size-6" />}
          title={
            tim.trim()
              ? `Không có ai khớp với "${tim.trim()}"`
              : "Không có ai ở mức này"
          }
          description="Thử từ khoá khác hoặc bỏ bộ lọc trình độ."
          action={
            dangLoc && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTim("");
                  setMuc(null);
                }}
              >
                Xoá bộ lọc
              </Button>
            )
          }
        />
      ) : (
        <>
          {daRaSan.length > 0 && (
            <section aria-labelledby="da-ra-san">
              <h2
                id="da-ra-san"
                className="mb-3 flex items-baseline gap-2 text-[16px] font-semibold text-ink-100"
              >
                Đang ra sân
                <span className="tabular text-[12.5px] font-medium text-ink-500">
                  {daRaSan.length} người
                </span>
              </h2>
              <Card className="overflow-hidden">
                <ul className="divide-y divide-ink-800">
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
                </ul>
              </Card>
            </section>
          )}

          {chuaRaSan.length > 0 && (
            <section aria-labelledby="chua-ra-san">
              <h2
                id="chua-ra-san"
                className="mb-3 flex items-baseline gap-2 text-[16px] font-semibold text-ink-100"
              >
                Chưa ra sân
                <span className="tabular text-[12.5px] font-medium text-ink-500">
                  {chuaRaSan.length} người
                </span>
              </h2>
              <Card className="overflow-hidden">
                <ul className="divide-y divide-ink-800">
                {chuaRaSan.map((m) => (
                  <TheThanhVien
                    key={m.id}
                    m={m}
                    isMe={m.id === meId}
                    nguoiXem={meId}
                  />
                ))}
                </ul>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}
