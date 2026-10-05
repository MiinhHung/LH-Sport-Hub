import { CotHoiThoai } from "@/components/chat/cot-hoi-thoai";
import { KhungTroChuyen } from "@/components/chat/khung-tro-chuyen";
import { requireProfile } from "@/lib/auth";
import { listChatPartners, listConversations } from "@/lib/chat";

/**
 * Khung hai cột cho phần tin nhắn: danh sách bên trái, khung trò chuyện
 * bên phải.
 *
 * ĐẶT Ở LAYOUT CHỨ KHÔNG PHẢI Ở TỪNG TRANG, và đó mới là điểm chính.
 * Layout của App Router không bị dựng lại khi đổi `[id]`, nên bấm từ
 * người này sang người kia thì cột trái Ở YÊN: không nháy, không tải
 * lại, không mất chỗ cuộn. Nếu dựng hai cột trong từng trang thì mỗi lần
 * đổi người là cả danh sách dựng lại từ đầu — đúng cái cảm giác giật mà
 * hai cột sinh ra để tránh.
 *
 * Đổi lại là truy vấn danh sách nằm ở đây, nên nó chạy cho CẢ trang chỉ
 * mục lẫn từng cuộc. Với một đội vài chục người thì danh sách hội thoại
 * là truy vấn rẻ, đáng đánh đổi.
 *
 * CHIỀU CAO TÍNH TAY, không dùng `h-full`. Khung trò chuyện cần một
 * chiều cao CÓ THẬT thì vùng tin nhắn mới cuộn được bên trong còn ô soạn
 * tin đứng yên dưới đáy. `h-full` ở đây chỉ kế thừa từ một thẻ cha cũng
 * không biết mình cao bao nhiêu, nên rốt cuộc là cao bằng nội dung —
 * tức cả trang cuộn, ô soạn tin trôi mất.
 *
 * Số đo thật, lấy từ bản dựng:
 *
 *   thanh trên       64px
 *   thanh dưới       59px  (chỉ có dưới 768px)
 *   đệm của <main>   112px dưới / 64px dưới từ md
 *
 * Nên chiều cao là 100dvh trừ 64 trừ 59 trên điện thoại, và 100dvh trừ
 * 64 từ md trở lên. Phần đệm dưới của <main> bị triệt tiêu bằng margin
 * âm, nếu không thì khung dừng sớm và để lại một dải trống — đã đo: 71px
 * trên máy tính, 55px trên điện thoại.
 *
 * `dvh` chứ không `vh`: trên iOS thanh địa chỉ co giãn khi cuộn, `vh`
 * giữ nguyên số cũ nên ô soạn tin bị thanh địa chỉ che mất.
 */
export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const [conversations, partners] = await Promise.all([
    listConversations(profile.id),
    listChatPartners(profile.id),
  ]);

  // Người chưa từng nhắn — đưa lên hàng "nhắn nhanh".
  const daNhan = new Set(conversations.map((c) => c.partner.id));
  const nguoiMoi = partners.filter((p) => !daNhan.has(p.id));

  return (
    <div className="-mt-7 -mb-28 flex h-[calc(100dvh-7.7rem)] sm:-mt-9 md:-mb-16 md:h-[calc(100dvh-4rem)]">
      <CotHoiThoai
        viewerId={profile.id}
        nguoiMoi={nguoiMoi.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          avatarUrl: p.avatarUrl,
        }))}
        hoiThoai={conversations.map((c) => ({
          id: c.id,
          partner: c.partner,
          lastMessagePreview: c.lastMessagePreview,
          // Ngày giờ phải chuyển sang chuỗi: cột danh sách là Client
          // Component, mà `Date` thì không đi qua ranh giới đó được.
          lastMessageAt: c.lastMessageAt.toISOString(),
          lastSenderId: c.lastSenderId,
          unread: c.unread,
        }))}
      />

      <KhungTroChuyen>{children}</KhungTroChuyen>
    </div>
  );
}
