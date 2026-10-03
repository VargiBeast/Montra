import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

interface UserAvatarProps {
  user: User;
  fallback?: ReactNode;
}

export function UserAvatar({ user, fallback }: UserAvatarProps) {
  const metadata = user.user_metadata ?? {};
  const candidate = metadata.avatar_url ?? metadata.picture;
  let imageUrl: string | null = null;
  if (typeof candidate === "string") {
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "https:") imageUrl = parsed.toString();
    } catch {
      imageUrl = null;
    }
  }
  const name =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    user.email ||
    "";
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "S";

  return imageUrl ? <img src={imageUrl} alt="" referrerPolicy="no-referrer" /> : fallback ?? initials;
}