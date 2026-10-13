import { SiteHeader } from "@/components/layout/site-header";
import type { Profile } from "@/db/schema";

export interface AppHeaderProps {
  profile?: Profile | null;
  unread?: number;
  unreadMessages?: number;
  variant?: "default" | "landing";
  className?: string;
}

export function AppHeader({
  profile,
  unread = 3,
  unreadMessages = 2,
  variant = "default",
}: AppHeaderProps) {
  return (
    <SiteHeader
      profile={profile}
      unread={unread}
      unreadMessages={unreadMessages}
      variant={variant}
    />
  );
}

