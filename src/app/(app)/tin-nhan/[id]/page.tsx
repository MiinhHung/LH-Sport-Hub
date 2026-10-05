import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChatThread } from "@/components/chat/chat-thread";
import { Avatar } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { getConversation, listMessages, toPayload } from "@/lib/chat";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
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
  const profile = await requireProfile();

  // getConversation trả null khi người xem không thuộc cuộc trò chuyện,
  // nên người ngoài chỉ thấy trang 404, không biết nó có tồn tại hay không.
  const conversation = await getConversation(id, profile.id);
  if (!conversation) notFound();

  const history = await listMessages(id);

  return (
    /*
      KHOÁ BỀ NGANG CỘT TRÒ CHUYỆN.

      Đo trên bản dựng ở màn 1440: cột này rộng 940px, nên một tin nhắn
      hai chữ nằm sát mép phải còn mép trái bỏ trống 800px — mắt phải
      quét ngang gần cả màn hình để nối hai câu liền nhau. Chat đọc tốt
      nhất trong một cột hẹp, cùng lý do với việc một đoạn văn không nên
      dài quá bảy tám chục ký tự.
    */
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col md:px-5">
      <header className="flex items-center gap-3 border-b border-ink-800 pb-3.5">
        {/*
          Nút quay lại CHỈ CÓ trên điện thoại. Trên máy tính danh sách
          nằm ngay bên trái, luôn thấy — thêm một nút "quay lại" ở đó là
          thừa, và còn sai: không có chỗ nào để quay về cả.
        */}
        <Link
          href="/tin-nhan"
          aria-label="Về danh sách tin nhắn"
          className="-ml-1 grid size-9 shrink-0 place-items-center rounded-xl text-ink-500 transition-colors hover:bg-ink-850 hover:text-ink-100 md:hidden"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>

        <Avatar
          name={conversation.partner.fullName}
          src={conversation.partner.avatarUrl}
          seed={conversation.partner.id}
          size="md"
        />
        <div className="min-w-0">
          {/*
            Tên người đối thoại cỡ 18px, không phải 26px như trước. Khi
            trang này còn là một màn riêng thì tên là tiêu đề của cả màn
            nên to là đúng. Giờ nó chỉ là đầu một cột, mà chữ to ở đây
            đẩy vùng tin nhắn xuống và tranh chỗ với chính nội dung trò
            chuyện — thứ người ta vào đây để đọc.
          */}
          <h1 className="truncate text-[18px] leading-tight font-bold text-ink-100">
            {conversation.partner.fullName}
          </h1>
          {conversation.partner.department && (
            <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
              {conversation.partner.department}
            </p>
          )}
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
