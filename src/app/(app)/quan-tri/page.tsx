import { count, desc, eq } from "drizzle-orm";
import { Activity, ShieldCheck, Swords, Users } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { auditLogs, challenges, debts, profiles } from "@/db/schema";
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  PageHeader,
  SectionTitle,
  Stat,
  Well,
} from "@/components/ui";
import { isModerator, requireProfile } from "@/lib/auth";
import { ROLES, type RoleKey } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";

import { MemberControls } from "./member-controls";

export const metadata: Metadata = { title: "Quản trị" };

export default async function AdminPage() {
  const me = await requireProfile();

  // Chặn ở tầng trang; các server action vẫn tự kiểm tra quyền riêng.
  if (!isModerator(me)) redirect("/keo");

  const [allProfiles, memberCount, openChallenges, openDebts, logs] =
    await Promise.all([
      db.query.profiles.findMany({ orderBy: [desc(profiles.createdAt)] }),
      db.select({ v: count() }).from(profiles).where(eq(profiles.status, "active")),
      db.select({ v: count() }).from(challenges).where(eq(challenges.status, "open")),
      db.select({ v: count() }).from(debts).where(eq(debts.status, "outstanding")),
      db.query.auditLogs.findMany({
        orderBy: [desc(auditLogs.createdAt)],
        limit: 30,
      }),
    ]);

  const nameById = new Map(allProfiles.map((p) => [p.id, p.fullName]));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Quản trị"
        description="Quản lý thành viên, vai trò và theo dõi hoạt động."
        action={<Badge tone="navy">{ROLES[me.role].label}</Badge>}
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat
          label="Thành viên"
          value={memberCount[0]?.v ?? 0}
          icon={<Users className="size-3.5" />}
          tone="navy"
        />
        <Stat
          label="Kèo đang mở"
          value={openChallenges[0]?.v ?? 0}
          icon={<Swords className="size-3.5" />}
          tone="lime"
        />
        <Stat
          label="Nợ chưa trả"
          value={openDebts[0]?.v ?? 0}
          icon={<Activity className="size-3.5" />}
          tone="rose"
        />
        <Stat
          label="Tài khoản khoá"
          value={allProfiles.filter((p) => p.status === "suspended").length}
          icon={<ShieldCheck className="size-3.5" />}
          tone="slate"
        />
      </div>

      {/* Thành viên */}
      <section aria-labelledby="ql-thanh-vien">
        <SectionTitle>
          <span id="ql-thanh-vien">Thành viên ({allProfiles.length})</span>
        </SectionTitle>

        <Card className="divide-y divide-ink-800 overflow-hidden">
          {allProfiles.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex flex-wrap items-center gap-3 p-4",
                p.status === "suspended" && "bg-rose-50/50",
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
          <Card>
            <CardBody className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-ink-800 pb-2 last:border-0 last:pb-0"
                >
                  <code className="rounded bg-ink-850 px-1.5 py-0.5 text-[11.5px] font-semibold text-navy-800">
                    {log.action}
                  </code>
                  <span className="text-[13px] text-ink-400">
                    {log.actorId
                      ? (nameById.get(log.actorId) ?? "Người dùng đã xoá")
                      : "Hệ thống"}
                  </span>
                  <span className="ml-auto text-[11.5px] text-ink-500">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </section>
    </div>
  );
}
