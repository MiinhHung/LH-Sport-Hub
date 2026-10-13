import { Plus, Swords } from "@/components/icons";

import { EmptyState } from "@/components/ui";
import { LinkButton } from "@/components/ui/button";

/**
 * Chỗ hiện khi chưa có kèo nào.
 *
 * Bản trước dựng hai thẻ kèo giả mờ phía sau để minh hoạ. Bỏ đi: dữ liệu
 * giả trong giao diện dễ bị tưởng là thật, và một ô trống gọn với đúng
 * một nút bấm đã nói đủ việc cần làm tiếp.
 */
export function ChuaCoKeo({
  tieuDe,
  moTa,
  choTaoKeo,
}: {
  tieuDe: string;
  moTa: string;
  /** Chỉ mời tạo kèo ở tab "đang tìm đối"; tab khác thì rỗng là do bộ lọc. */
  choTaoKeo: boolean;
}) {
  return (
    <EmptyState
      icon={<Swords className="size-6" />}
      title={tieuDe}
      description={moTa}
      action={
        choTaoKeo ? (
          <LinkButton href="/keo/tao">
            <Plus className="size-4" />
            Tạo kèo đầu tiên
          </LinkButton>
        ) : undefined
      }
    />
  );
}
