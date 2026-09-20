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
    <div className="mx-auto flex h-[calc(100dvh-13rem)] max-w-2xl flex-col md:h-[calc(100dvh-11rem)]">
      <Link
        href="/tin-nhan"
        className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-ink-500 transition-colors hover:text-ink-100"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Tin nhắn
      </Link>

      <header className="flex items-center gap-4 border-b border-ink-800 pt-5 pb-5">
        <Avatar
          name={conversation.partner.fullName}
          src={conversation.partner.avatarUrl}
          seed={conversation.partner.id}
          size="lg"
        />
        <div className="min-w-0">
          <h1 className="font-display truncate text-[26px] leading-tight font-bold text-ink-100">
            {conversation.partner.fullName}
          </h1>
          {conversation.partner.department && (
            <p className="mt-0.5 text-[13px] text-ink-500">
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
