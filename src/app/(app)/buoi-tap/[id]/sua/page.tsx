import { ArrowLeft } from "@/components/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  SessionForm,
  type BuoiDangSua,
} from "@/components/forms/session-form";
import { PageIntro } from "@/components/ui";
import { isModerator, requireProfile } from "@/lib/auth";
import { getSessionDetail } from "@/lib/queries";

export const metadata: Metadata = { title: "Sửa buổi tập" };

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profile = await requireProfile();
  const session = await getSessionDetail(id);
  if (!session) notFound();

  // Kiểm ở trang, và `updateSessionAction` kiểm lại lần nữa: ẩn nút
  // "Sửa" ở trang buổi tập chỉ giấu đường đi, gõ thẳng địa chỉ vẫn vào.
  if (session.creatorId !== profile.id && !isModerator(profile)) {
    redirect(`/buoi-tap/${id}`);
  }

  // Buổi đã huỷ là bản ghi để xem lại, không phải nháp.
  if (session.status === "cancelled") redirect(`/buoi-tap/${id}`);

  const buoi: BuoiDangSua = {
    id: session.id,
    sport: session.sport,
    title: session.title,
    venueName: session.venueName,
    venueAddress: session.venueAddress,
    mapUrl: session.mapUrl,
    showMap: session.showMap,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    maxPlayers: session.maxPlayers,
    costTotal: session.costTotal,
    notes: session.notes,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/buoi-tap/${id}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-ink-100"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại buổi tập
      </Link>

      <PageIntro
        title="Sửa buổi tập"
        lead="Đổi giờ hoặc đổi sân thì người đã nhận đi sẽ nhận được thông báo."
      />

      <SessionForm buoi={buoi} />
    </div>
  );
}
