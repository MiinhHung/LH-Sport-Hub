import { ArrowLeft } from "@/components/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChatThread } from "@/components/chat/chat-thread";
import { ChamHoatDong } from "@/components/ui/cham-hoat-dong";
import { Avatar } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { getConversation, listMessages, toPayload } from "@/lib/chat";
import { nhanHoatDong } from "@/lib/hoat-dong";
import { isUuid } from "@/lib/validation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Tin nhắn" };
  const profile = await requireProfile();
  const conversation = await getConversation(id, profile.id);
  return { title: conversation?.partner.fullName ?? "Tin nhắn" };
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Id rác trên URL mà xuống thẳng Postgres sẽ nổ 22P02 thành lỗi 500.
  if (!isUuid(id)) notFound();
  const profile = await requireProfile();

  // getConversation trả null khi người xem không thuộc cuộc trò chuyện,
  // nên người ngoài chỉ thấy trang 404, không biết nó có tồn tại hay không.
  const conversation = await getConversation(id, profile.id);
  if (!conversation) notFound();

  const history = await listMessages(id);
  const hoatDong = nhanHoatDong(conversation.partner.lastActiveAt);

  return (
    /*
      BỀ NGANG CỘT TRÒ CHUYỆN.

      Từng đo ở màn 1440: cột này rộng 940px, tin hai chữ nằm sát mép
      phải còn mép trái bỏ trống 800px. Giờ cả khung tin nhắn là một thẻ
      nằm trong <main> (tối đa 1120px) trừ cột danh sách 320px, nên cột
      này không vượt quá chừng 720px. Chat vẫn đọc trong một cột hẹp mà
      không cần khoá thêm.
    */
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center gap-3 border-b border-ink-800 bg-ink-900 px-3 py-2.5 sm:px-4 md:px-5 md:py-3">
        {/*
          Nút quay lại CHỈ CÓ trên điện thoại. Trên máy tính danh sách
          nằm ngay bên trái, luôn thấy — thêm một nút "quay lại" ở đó là
          thừa, và còn sai: không có chỗ nào để quay về cả.
        */}
        <Link
          href="/tin-nhan"
          aria-label="Về danh sách tin nhắn"
          className="grid size-10 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-850 hover:text-ink-100 md:hidden"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>

        <Link
          href={`/thanh-vien/${conversation.partner.id}`}
          aria-label={`Xem hồ sơ của ${conversation.partner.fullName}`}
          className="relative shrink-0 rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-gold-400/50"
        >
          <Avatar
            name={conversation.partner.fullName}
            src={conversation.partner.avatarUrl}
            seed={conversation.partner.id}
            size="md"
          />
          <ChamHoatDong
            lastActiveAt={conversation.partner.lastActiveAt}
            co="sm"
            ringClass="ring-ink-900"
          />
        </Link>
        <div className="min-w-0">
          {/*
            Tên người đối thoại cỡ 16px, không phải 26px như trước. Khi
            trang này còn là một màn riêng thì tên là tiêu đề của cả màn
            nên to là đúng. Giờ nó chỉ là đầu một cột, mà chữ to ở đây
            đẩy vùng tin nhắn xuống và tranh chỗ với chính nội dung trò
            chuyện — thứ người ta vào đây để đọc.
          */}
          <h1 className="truncate text-[16px] leading-tight font-semibold text-ink-100">
            {conversation.partner.fullName}
          </h1>
          {/* Câu chữ thay vì bắt đoán qua cái chấm: ở khung chat, biết
              người kia vừa rời đi 2 phút hay 2 ngày trước quyết định
              mình có ngồi đợi trả lời hay không. */}
          <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
            {hoatDong === "Đang hoạt động" ? (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {hoatDong}
              </span>
            ) : (
              hoatDong
            )}
            {conversation.partner.department &&
              ` · ${conversation.partner.department}`}
          </p>
        </div>
      </header>

      <ChatThread
        conversationId={conversation.id}
        viewerId={profile.id}
        partnerName={conversation.partner.fullName.split(" ").slice(-1)[0]}
        initialMessages={history.map(toPayload)}
      />
    </div>
  );
}
