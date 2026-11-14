import type { CSSProperties } from "react";
import Image from "next/image";
import { memberInitialsFromNames } from "@/lib/sttns/memberDisplay";
import { cn } from "@/lib/utils";

type MemberLike = {
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
};

interface Props {
  member: MemberLike;
  size?: "xs" | "sm";
  className?: string;
  style?: CSSProperties;
}

const SIZE_CLASS = {
  xs: "h-5 w-5 text-[8px] border",
  sm: "h-6 w-6 text-[9px] border-2",
} as const;

export function MemberAvatar({ member, size = "sm", className, style }: Props) {
  const label =
    member.full_name?.trim() || member.email?.split("@")[0] || "Membre";
  const avatarUrl = member.avatar_url?.trim() || null;
  const initials = memberInitialsFromNames(member.full_name, member.email);

  return (
    <span
      title={label}
      aria-label={label}
      style={style}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-white bg-emerald-50 font-bold uppercase tracking-tight text-emerald-900 shadow-sm",
        SIZE_CLASS[size],
        className
      )}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          width={size === "xs" ? 20 : 24}
          height={size === "xs" ? 20 : 24}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        initials
      )}
    </span>
  );
}
