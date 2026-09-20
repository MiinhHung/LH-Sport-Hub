import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth";
import { unreadConversationCount } from "@/lib/chat";
import { unreadCount } from "@/lib/notifications";
import { openChallengeCount } from "@/lib/queries";

/**
 * Tóm tắt "có gì mới" cho ô thông báo ở trang chủ.
 *
 * Trang chủ vốn đã đọc phiên đăng nhập ở phía máy chủ, nên về lý thì có
 * thể đếm luôn ở đó. Không làm vậy vì hai lẽ: số đếm dựng sẵn trong HTML
 * sẽ đứng yên suốt thời gian người ta còn mở trang, mà trang chủ là chỗ
 * người ta hay để mở; và ba truy vấn này sẽ chen vào giữa đường dựng
 * trang, làm chậm khung hình đầu tiên của hero chỉ vì một cái ô ở góc.
 *
 * Đường dẫn này phải nằm trong danh sách công khai của proxy, nếu không
 * người chưa đăng nhập sẽ bị đá sang trang đăng nhập và nhận về một trang
 * HTML thay cho JSON.
 *
 * Nằm trong danh sách công khai KHÔNG có nghĩa là không kiểm tra quyền.
 * Danh tính lấy từ phiên Supabase phía máy chủ, không phải từ tham số do
 * trình duyệt gửi lên; chưa đăng nhập thì chỉ nhận `{ signedIn: false }`,
 * không có số liệu nào rò ra ngoài.
 */
export async function GET() {
  const profile = await getCurrentProfile();

  if (!profile || profile.status === "suspended") {
    return NextResponse.json(
      { signedIn: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const [notifications, messages, challenges] = await Promise.all([
    unreadCount(profile.id),
    unreadConversationCount(profile.id),
    openChallengeCount(profile.id),
  ]);

  return NextResponse.json(
    { signedIn: true, notifications, messages, challenges },
    // Số này riêng của từng người và đổi liên tục; đừng để bất cứ lớp đệm
    // nào giữ lại.
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
