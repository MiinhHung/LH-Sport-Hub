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
 * Số đo của khung app hiện tại (app/(app)/layout.tsx + nav.tsx):
 *
 *   thanh trên       57px  (56 + viền, chỉ có dưới lg)
 *   thanh dưới       56px  + vùng an toàn iOS (chỉ có dưới lg)
 *   đệm của <main>   trên 24 / 32 từ sm / 40 từ lg
 *                    dưới 112 / 64 từ lg
 *
 * Dưới md: khung tràn sát mép, margin âm triệt tiêu hết đệm của <main>,
 *   cao = 100dvh − 57 − 56 − vùng an toàn.
 * md tới lg: khung thành một thẻ, chừa 16px trên và dưới,
 *   cao = 100dvh − 57 − 56 − 32 − vùng an toàn.
 * Từ lg: không còn thanh trên / dưới, chừa 24px hai đầu, cao = 100dvh − 48.
 *
 * Đổi chiều cao thanh nào ở khung app thì phải sửa số ở đây theo, nếu
 * không ô soạn tin bị thanh dưới che hoặc trang có thanh cuộn thừa.
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
    <div
      className={
        "-mx-4 -mt-5 -mb-28 flex h-[calc(100dvh_-_113px_-_env(safe-area-inset-bottom))] overflow-hidden sm:-mx-6 sm:-mt-6 " +
        "md:mx-0 md:mt-0 md:mb-0 md:h-[calc(100dvh_-_65px_-_4rem)] md:rounded-xl md:border md:border-ink-800 md:bg-ink-900"
      }
    >
      <CotHoiThoai
        viewerId={profile.id}
        nguoiMoi={nguoiMoi.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          avatarUrl: p.avatarUrl,
        }))}
        hoiThoai={conversations.map((c) => ({
          id: c.id,
          // Cùng lý do với `lastMessageAt` ngay dưới: `lastActiveAt`
          // trong `partner` cũng là một `Date`, phải đổi sang chuỗi.
          partner: {
            ...c.partner,
            lastActiveAt: c.partner.lastActiveAt.toISOString(),
          },
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
