import * as React from "react";
import { Plus, Trophy } from "@/components/icons";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface VersusMember {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  status?: "accepted" | "invited" | "declined";
}

export interface VersusTeam {
  name?: string;
  members: VersusMember[];
  capacity: number;
  isWinner?: boolean;
  isMine?: boolean;
  score?: number | null;
  /** Chữ hiện khi đội chưa có ai. Mặc định "Đang tìm đối thủ". */
  emptyLabel?: string;
}

export interface VersusRowProps {
  teamA: VersusTeam;
  teamB: VersusTeam;
  size?: "sm" | "md";
  className?: string;
}

function getFirstName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] || fullName;
}

/**
 * Một phía của trận. Thứ bậc: tên người chơi là chữ to nhất, "Đội A" và
 * dấu "Bạn" là nhãn nhỏ phía trên, avatar nằm cuối làm điểm tựa.
 */
function TeamSide({
  team,
  side,
  align,
  size = "md",
}: {
  team: VersusTeam;
  side: "A" | "B";
  align: "left" | "right";
  size?: "sm" | "md";
}) {
  const emptySlots = Math.max(0, team.capacity - team.members.length);
  const isRight = align === "right";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2",
        isRight && "items-end text-right",
      )}
    >
      <div className="w-full min-w-0">
        <p
          className={cn(
            "flex items-center gap-1 text-[12px] font-semibold text-ink-500",
            isRight && "justify-end",
          )}
        >
          <span>{team.name || `Đội ${side}`}</span>
          {team.isWinner && (
            <Trophy
              className="size-3.5 text-gold-500"
              aria-label="Đội chiến thắng"
            />
          )}
          {team.isMine && (
            <span className="font-semibold text-gold-700 dark:text-gold-300">
              <span aria-hidden className="text-ink-600">
                {"· "}
              </span>
              Bạn
            </span>
          )}
        </p>

        <p
          className={cn(
            "mt-0.5 truncate text-[15px] leading-snug font-semibold",
            team.members.length === 0 ? "text-ink-500" : "text-ink-100",
          )}
        >
          {team.members.length === 0
            ? (team.emptyLabel ?? "Đang tìm đối thủ")
            : team.members
                .map(
                  (m) =>
                    getFirstName(m.fullName) +
                    (m.status === "invited" ? " (chờ)" : ""),
                )
                .join(", ")}
        </p>
      </div>

      <div
        className={cn(
          "flex items-center -space-x-1.5",
          isRight && "flex-row-reverse space-x-reverse",
        )}
      >
        {team.members.map((m) => (
          <Avatar
            key={m.id}
            name={m.fullName}
            src={m.avatarUrl}
            seed={m.id}
            size={size === "sm" ? "xs" : "sm"}
            className={cn(
              "ring-2 ring-ink-850",
              m.status === "invited" && "opacity-45 grayscale",
              team.isWinner && "ring-gold-400",
            )}
          />
        ))}

        {Array.from({ length: emptySlots }).map((_, i) => (
          <span
            key={i}
            role="img"
            aria-label="Vị trí còn trống"
            className={cn(
              "grid place-items-center rounded-full border border-dashed border-ink-700 bg-ink-900 text-ink-500",
              size === "sm" ? "size-6" : "size-8",
            )}
          >
            <Plus className={size === "sm" ? "size-3" : "size-3.5"} />
          </span>
        ))}
      </div>
    </div>
  );
}

export function VersusRow({
  teamA,
  teamB,
  size = "md",
  className,
}: VersusRowProps) {
  const hasScores =
    teamA.score !== null &&
    teamA.score !== undefined &&
    teamB.score !== null &&
    teamB.score !== undefined;

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-lg bg-ink-850 px-3.5 py-3",
        className,
      )}
    >
      <TeamSide team={teamA} side="A" align="left" size={size} />

      {/* Giữa: tỉ số nếu đã chốt, chưa thì VS */}
      <div className="flex shrink-0 items-center justify-center px-1">
        {hasScores ? (
          <p className="tabular font-display flex items-center text-[26px] leading-none text-ink-100">
            <span className={cn(teamB.isWinner && "text-ink-500")}>
              {teamA.score}
            </span>
            <span aria-hidden className="mx-1.5 text-[20px] text-ink-600">
              -
            </span>
            <span className={cn(teamA.isWinner && "text-ink-500")}>
              {teamB.score}
            </span>
          </p>
        ) : (
          <span className="font-display text-[13px] leading-none text-ink-500">
            VS
          </span>
        )}
      </div>

      <TeamSide team={teamB} side="B" align="right" size={size} />
    </div>
  );
}
