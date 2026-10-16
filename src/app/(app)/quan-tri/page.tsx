import { count, desc, eq } from "drizzle-orm";
import { Lock, Swords, Users } from "@/components/icons";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { auditLogs, challenges, profiles } from "@/db/schema";
import { NhatKy } from "@/components/quan-tri/nhat-ky";
import { Avatar, Badge, Card, PageIntro, type Tone } from "@/components/ui";
import { isModerator, requireProfile } from "@/lib/auth";
import { nhanHoatDong } from "@/lib/hoat-dong";
import { ROLES, type RoleKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { MemberControls } from "./member-controls";

export const metadata: Metadata = { title: "Quản trị" };

/** Người có quyền thì nhãn navy / vàng, thành viên thường để xám cho lặng. */
const TONE_VAI_TRO: Record<RoleKey, Tone> = {
  admin: "navy",
  moderator: "navy",
  organizer: "lime",
  member: "slate",
};

/** Thuộc ban quản trị (admin hoặc điều hành viên). */
function laQuanTri(role: string): boolean {
  return role === "admin" || role === "moderator";
}

export default async function AdminPage() {
  const me = await requireProfile();

  // Chặn ở tầng trang; các server action vẫn tự kiểm tra quyền riêng.
  if (!isModerator(me)) redirect("/keo");

  const [allProfiles, memberCount, openChallenges, logs] = await Promise.all([
    db.query.profiles.findMany({ orderBy: [desc(profiles.createdAt)] }),
    db
      .select({ v: count() })
      .from(profiles)
      .where(eq(profiles.status, "active")),
    db
      .select({ v: count() })
      .from(challenges)
      .where(eq(challenges.status, "open")),
    db.query.auditLogs.findMany({
      orderBy: [desc(auditLogs.createdAt)],
      limit: 30,
    }),
  ]);

  // Nhật ký cần cả ảnh đại diện, không chỉ tên: người quản trị quét
  // trang này theo NGƯỜI trước, theo việc sau.
  const nguoiTheoId = new Map(
    allProfiles.map((p) => [
      p.id,
      { id: p.id, fullName: p.fullName, avatarUrl: p.avatarUrl },
    ]),
  );

  /*
    THỨ TỰ CÓ NGHĨA, THAY CHO "MỚI ĐĂNG KÝ TRƯỚC".
    Danh sách trước đây xếp theo ngày tạo tài khoản giảm dần — một thứ
    tự không giúp gì cho việc người ta mở trang này ra để làm. Giờ:

      1. tài khoản đang khoá  — thứ duy nhất đang cần ai đó xử lý
      2. người có quyền       — admin, kiểm duyệt, tổ chức
      3. còn lại theo tên     — để tìm một cái tên bằng mắt

    Sắp ở đây chứ không ở SQL: danh sách này là toàn bộ tài khoản của
    một team vài chục người, sắp bằng JavaScript không đáng kể, mà quy
    tắc viết ra đọc dễ hơn nhiều so với một mệnh đề ORDER BY lồng CASE.
  */
  const dsThanhVien = [...allProfiles].sort((a, b) => {
    const khoa = (p: typeof a) => (p.status === "suspended" ? 0 : 1);
    return (
      khoa(a) - khoa(b) ||
      ROLES[b.role as RoleKey].rank - ROLES[a.role as RoleKey].rank ||
      a.fullName.localeCompare(b.fullName, "vi")
    );
  });

  const soKhoa = allProfiles.filter((x) => x.status === "suspended").length;

  return (
    <div className="space-y-6">
      <PageIntro
        title="Quản trị"
        lead="Quản lý thành viên, vai trò và theo dõi hoạt động."
        action={
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-500">
            Bạn đang là
            <Badge tone="navy">{ROLES[me.role].label}</Badge>
          </span>
        }
      />

      {/*
        BA CON SỐ TRONG MỘT THẺ, KHÔNG PHẢI BA THẺ RỜI.

        Chụp ở màn 1440: ba hộp mỗi hộp rộng 370px để đựng đúng một con
        số một chữ số. Chúng là ba mẩu của cùng một câu "team đang như
        thế nào", nên gom lại thì đọc một lượt là xong, và lấy lại được
        chỗ cho danh sách thành viên — thứ người ta vào đây để làm.
      */}
      <Card>
        <div className="grid grid-cols-3 divide-x divide-ink-800">
          {[
            { nhan: "Thành viên", so: memberCount[0]?.v ?? 0, Icon: Users },
            {
              nhan: "Kèo đang mở",
              so: openChallenges[0]?.v ?? 0,
              Icon: Swords,
            },
            { nhan: "Tài khoản khoá", so: soKhoa, Icon: Lock },
          ].map(({ nhan, so, Icon }) => (
            <div
              key={nhan}
              className="flex items-center gap-3 px-3 py-3.5 sm:px-5 sm:py-4"
            >
              <span
                aria-hidden
                className="hidden size-10 shrink-0 place-items-center rounded-lg bg-ink-850 text-ink-300 sm:grid"
              >
                <Icon className="size-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="tabular font-display text-[24px] leading-none font-bold text-ink-100">
                  {so}
                </p>
                <p className="mt-1 truncate text-[12.5px] font-medium text-ink-500">
                  {nhan}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Thành viên */}
        <section aria-labelledby="ql-thanh-vien" className="min-w-0">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-ink-800 px-4 py-3.5 sm:px-5">
              <h2
                id="ql-thanh-vien"
                className="text-[16px] font-semibold text-ink-100"
              >
                Thành viên
                <span className="tabular ml-1.5 font-semibold text-ink-500">
                  {allProfiles.length}
                </span>
              </h2>
              {soKhoa > 0 && (
                <Badge tone="rose">
                  <Lock className="size-3" />
                  {soKhoa} đang khoá
                </Badge>
              )}
            </div>

            <ul className="divide-y divide-ink-800">
              {dsThanhVien.map((p) => {
                const khoa = p.status === "suspended";
                return (
                  <li
                    key={p.id}
                    className={cn(
                      "relative flex flex-wrap items-center gap-x-3 gap-y-2.5 px-4 py-3 sm:px-5",
                      khoa && "bg-rose-50/60 dark:bg-rose-500/10",
                    )}
                  >
                    {khoa && (
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-[3px] bg-rose-500"
                      />
                    )}

                    <Avatar
                      name={p.fullName}
                      src={p.avatarUrl}
                      seed={p.id}
                      size="md"
                      className={cn(khoa && "opacity-60 grayscale")}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-[14px] font-semibold text-ink-100">
                          {p.fullName}
                        </p>
                        {p.id === me.id && (
                          <span className="shrink-0 text-[12px] font-medium text-ink-500">
                            (bạn)
                          </span>
                        )}
                        <Badge
                          tone={TONE_VAI_TRO[p.role as RoleKey]}
                          className="shrink-0"
                        >
                          {ROLES[p.role as RoleKey].label}
                        </Badge>
                        {khoa && (
                          <Badge tone="rose" className="shrink-0">
                            Đang khoá
                          </Badge>
                        )}
                      </div>
                      {/* Hoạt động lần cuối: ở trang quản trị thì đây là
                          thứ đáng giá hơn mọi chỗ khác: nó trả lời "ai
                          đăng ký rồi bỏ đó" mà không phải đi hỏi từng
                          người. */}
                      <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12.5px] text-ink-500">
                        <span className="truncate">{p.email}</span>
                        <span aria-hidden className="text-ink-600">
                          ·
                        </span>
                        <span className="shrink-0">
                          {nhanHoatDong(p.lastActiveAt)}
                        </span>
                      </p>
                    </div>

                    {/* Hàng của chính mình không có nút (MemberControls tự
                        trả null), nên bỏ luôn ô bọc để khỏi chừa khoảng trống. */}
                    {/* Điều hành viên không khoá được admin/điều hành viên khác
                        (luật của setUserStatusAction), nên giấu nút luôn. */}
                    {p.id !== me.id &&
                      (me.role === "admin" || !laQuanTri(p.role)) && (
                      <div className="w-full pl-[52px] sm:w-auto sm:pl-0">
                        <MemberControls
                          userId={p.id}
                          fullName={p.fullName}
                          role={p.role as RoleKey}
                          status={p.status}
                          canAssignRoles={me.role === "admin"}
                          canChangeStatus={
                            me.role === "admin" || !laQuanTri(p.role)
                          }
                          isSelf={p.id === me.id}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>

        {/* Nhật ký hoạt động */}
        <section aria-labelledby="audit" className="lg:sticky lg:top-10">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-1">
              <h2 id="audit" className="text-[16px] font-semibold text-ink-100">
                Nhật ký hoạt động
              </h2>
              <span className="text-[12.5px] font-medium text-ink-500">
                {logs.length} việc gần nhất
              </span>
            </div>

            {logs.length === 0 ? (
              <p className="px-4 pt-2 pb-5 text-[13.5px] text-ink-500">
                Chưa có hoạt động nào.
              </p>
            ) : (
              <NhatKy logs={logs} nguoiTheoId={nguoiTheoId} />
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
