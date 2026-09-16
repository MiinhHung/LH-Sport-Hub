import { Users } from "lucide-react";
import type { Metadata } from "next";

import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { ROLES, SKILL_LEVELS, type SkillLevelKey } from "@/lib/constants";
import { getLeaderboard, listMembers } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Thành viên" };

export default async function MembersPage() {
  const me = await requireProfile();
  const [members, board] = await Promise.all([listMembers(), getLeaderboard()]);

  const statsById = new Map(board.map((e) => [e.profile.id, e]));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Thành viên"
        description={`${members.length} người đang hoạt động trong team.`}
      />

      {members.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title="Chưa có thành viên nào"
          description="Mời anh em đăng ký bằng email công ty."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const stats = statsById.get(m.id);
            const skill = SKILL_LEVELS[m.skillLevel as SkillLevelKey];
            const isMe = m.id === me.id;

            return (
              <Card
                key={m.id}
                className={cn("p-4", isMe && "border-navy-100 bg-navy-50")}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={m.fullName}
                    src={m.avatarUrl}
                    seed={m.id}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-ink-100">
                      {m.fullName}
                      {isMe && (
                        <span className="ml-1.5 text-[11px] font-bold text-navy-700">
                          bạn
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[12.5px] text-ink-500">
                      {m.department || "Chưa ghi phòng ban"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Badge tone="slate">{skill.label}</Badge>
                      {m.role !== "member" && (
                        <Badge tone="navy">{ROLES[m.role].label}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <dl className="mt-3.5 grid grid-cols-3 gap-2 border-t border-ink-800 pt-3 text-center">
                  <div>
                    <dt className="text-[10.5px] font-semibold tracking-wide text-ink-500 uppercase">
                      Thắng
                    </dt>
                    <dd className="tabular text-[15px] font-bold text-emerald-700">
                      {stats?.wins ?? 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] font-semibold tracking-wide text-ink-500 uppercase">
                      Thua
                    </dt>
                    <dd className="tabular text-[15px] font-bold text-ink-400">
                      {stats?.losses ?? 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] font-semibold tracking-wide text-ink-500 uppercase">
                      Nợ
                    </dt>
                    <dd
                      className={cn(
                        "tabular text-[15px] font-bold",
                        stats?.owedUnits
                          ? "text-rose-600"
                          : "text-ink-600",
                      )}
                    >
                      {stats?.owedUnits ?? 0}
                    </dd>
                  </div>
                </dl>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
