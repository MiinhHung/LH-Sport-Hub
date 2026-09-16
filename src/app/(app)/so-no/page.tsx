import { ArrowRight, HandCoins, PartyPopper, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  Badge,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  SectionTitle,
  Stat,
  Well,
} from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { DEBT_STATUS_META } from "@/lib/challenge-logic";
import { STAKES, formatStake, type StakeKey } from "@/lib/constants";
import { debtInvolves, debtSides, listDebts, type DebtRow } from "@/lib/queries";
import { cn, timeAgo } from "@/lib/utils";

import { DebtActions } from "./debt-actions";

export const metadata: Metadata = { title: "Sổ nợ" };

function names(people: { user: { fullName: string } }[]) {
  return people.map((p) => p.user.fullName).join(", ") || "—";
}

function DebtCard({
  debt,
  currentUserId,
}: {
  debt: DebtRow;
  currentUserId: string;
}) {
  const { debtors, creditors } = debtSides(debt);
  const { isDebtor, isCreditor } = debtInvolves(debt, currentUserId);
  const stakeKey = debt.stakeType as StakeKey;
  const meta = DEBT_STATUS_META[debt.status];

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        isDebtor && "border-rose-200",
        isCreditor && "border-emerald-200",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-[3px]",
          isDebtor ? "bg-rose-400" : isCreditor ? "bg-emerald-400" : "bg-ink-700",
        )}
      />
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          <span className="shrink-0 text-[11px] text-ink-500">
            {timeAgo(debt.createdAt)}
          </span>
        </div>

        {/* Ai nợ ai */}
        <div className="flex items-center gap-2.5 text-[13.5px]">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold tracking-wide text-ink-500 uppercase">
              Bên nợ
            </p>
            <p className="truncate font-bold text-rose-700">{names(debtors)}</p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-ink-600" aria-hidden />
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[10.5px] font-bold tracking-wide text-ink-500 uppercase">
              Bên nhận
            </p>
            <p className="truncate font-bold text-emerald-700">
              {names(creditors)}
            </p>
          </div>
        </div>

        {/* Món nợ */}
        <Well className="flex items-center gap-3">
          <span className="text-xl leading-none" aria-hidden>
            {STAKES[stakeKey].icon}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] leading-tight font-bold text-ink-100">
              {formatStake(stakeKey, debt.stakeQty, debt.stakeNote)}
            </p>
            <Link
              href={`/keo/${debt.challengeId}`}
              className="truncate text-xs text-ink-500 hover:text-navy-700 hover:underline"
            >
              từ kèo “{debt.challenge.title}”
            </Link>
          </div>
        </Well>

        {debt.proofUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={debt.proofUrl}
            alt="Ảnh chứng minh đã trả nợ"
            className="h-36 w-full rounded-xl object-cover ring-1 ring-ink-800"
          />
        )}

        <DebtActions
          debtId={debt.id}
          status={debt.status}
          isDebtor={isDebtor}
          isCreditor={isCreditor}
        />
      </CardBody>
    </Card>
  );
}

export default async function DebtLedgerPage() {
  const profile = await requireProfile();
  const allDebts = await listDebts();

  const iOwe = allDebts.filter((d) => debtInvolves(d, profile.id).isDebtor);
  const owedToMe = allDebts.filter(
    (d) => debtInvolves(d, profile.id).isCreditor,
  );
  const mine = [...iOwe, ...owedToMe];
  const others = allDebts.filter(
    (d) => !mine.some((m) => m.id === d.id),
  );

  const owedUnits = iOwe.reduce((sum, d) => sum + d.stakeQty, 0);
  const receivableUnits = owedToMe.reduce((sum, d) => sum + d.stakeQty, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sổ nợ"
        description="Cả đội thua bao cả đội thắng. Trả xong nhớ bấm xác nhận cho sạch sổ."
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Stat
          label="Bạn đang nợ"
          value={owedUnits}
          sub={`${iOwe.length} khoản chưa trả`}
          icon={<HandCoins className="size-3.5" />}
          tone="rose"
        />
        <Stat
          label="Người khác nợ bạn"
          value={receivableUnits}
          sub={`${owedToMe.length} khoản`}
          icon={<PartyPopper className="size-3.5" />}
          tone="emerald"
        />
        <Stat
          label="Cả team"
          value={allDebts.length}
          sub="khoản đang treo"
          icon={<Users className="size-3.5" />}
          tone="navy"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <section aria-labelledby="no-cua-toi">
        <SectionTitle>
          <HandCoins className="size-4 text-gold-500" aria-hidden />
          <span id="no-cua-toi">Liên quan tới bạn ({mine.length})</span>
        </SectionTitle>

        {mine.length === 0 ? (
          <EmptyState
            icon={<PartyPopper className="size-5" />}
            title="Sổ sạch"
            description="Bạn không nợ ai, cũng chẳng ai nợ bạn. Đi thách kèo đi cho vui."
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {mine.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                currentUserId={profile.id}
              />
            ))}
          </div>
        )}
      </section>

      {others.length > 0 && (
        <section aria-labelledby="no-toan-team">
          <SectionTitle>
            <Users className="size-4 text-ink-500" aria-hidden />
            <span id="no-toan-team">Nợ của người khác ({others.length})</span>
          </SectionTitle>
          <div className="grid gap-3 lg:grid-cols-2">
            {others.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                currentUserId={profile.id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
