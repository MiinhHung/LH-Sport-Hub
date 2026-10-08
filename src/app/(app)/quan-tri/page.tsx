import { count, desc, eq } from "drizzle-orm";
import { ShieldCheck, Swords, Users } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { auditLogs, challenges, profiles } from "@/db/schema";
import { NhatKy } from "@/components/quan-tri/nhat-ky";
import {
  Avatar,
  Badge,
  Card,
  PageIntro,
  SectionTitle,
  Stat,
  Well,
} from "@/components/ui";
import { isModerator, requireProfile } from "@/lib/auth";
import { nhanHoatDong } from "@/lib/hoat-dong";
import { ROLES, type RoleKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { MemberControls } from "./member-controls";

export const metadata: Metadata = { title: "Quản trị" };

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

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Hệ thống"
        title="Quản trị"
        lead="Quản lý thành viên, vai trò và theo dõi hoạt động."
        action={<Badge tone="navy">{ROLES[me.role].label}</Badge>}
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
            {
              nhan: "Tài khoản khoá",
              so: allProfiles.filter((x) => x.status === "suspended").length,
              Icon: ShieldCheck,
            },
          ].map(({ nhan, so, Icon }) => (
            <div key={nhan} className="px-4 py-3.5">
              <p className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.12em] text-ink-500 uppercase">
                <Icon className="size-3.5" aria-hidden />
                {nhan}
              </p>
              <p className="tabular font-display mt-1 text-[24px] leading-none font-bold text-ink-100">
                {so}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Thành viên */}
      <section aria-labelledby="ql-thanh-vien">
        <SectionTitle>
          <span id="ql-thanh-vien">Thành viên ({allProfiles.length})</span>
        </SectionTitle>

        <Card className="divide-y divide-ink-800 overflow-hidden">
          {dsThanhVien.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex flex-wrap items-center gap-3 p-4",
                p.status === "suspended" && "bg-rose-50/50 dark:bg-rose-500/10",
              )}
            >
              <Avatar
                name={p.fullName}
                src={p.avatarUrl}
                seed={p.id}
                size="md"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-bold text-ink-100">
                  {p.fullName}
                </p>
                <p className="truncate text-[12.5px] text-ink-500">{p.email}</p>
                {/* Hoạt động lần cuối — ở trang quản trị thì đây là thứ
                    đáng giá hơn mọi chỗ khác: nó trả lời "ai đăng ký rồi
                    bỏ đó" mà không phải đi hỏi từng người. */}
                <p className="truncate text-[12px] text-ink-500">
                  {nhanHoatDong(p.lastActiveAt)}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <Badge tone={p.role === "member" ? "slate" : "navy"}>
                    {ROLES[p.role].label}
                  </Badge>
                  {p.status === "suspended" && (
                    <Badge tone="rose">Đang khoá</Badge>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <MemberControls
                  userId={p.id}
                  fullName={p.fullName}
                  role={p.role as RoleKey}
                  status={p.status}
                  canAssignRoles={me.role === "admin"}
                  isSelf={p.id === me.id}
                />
              </div>
            </div>
          ))}
        </Card>
      </section>

      {/* Nhật ký hoạt động */}
      <section aria-labelledby="audit">
        <SectionTitle>
          <span id="audit">Nhật ký hoạt động</span>
        </SectionTitle>

        {logs.length === 0 ? (
          <Well>
            <p className="text-[13.5px] text-ink-500">Chưa có hoạt động nào.</p>
          </Well>
        ) : (
          <NhatKy logs={logs} nguoiTheoId={nguoiTheoId} />
        )}
      </section>
    </div>
  );
}
