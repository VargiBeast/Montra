import { ArrowLeft, LogOut, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { UserAvatar } from "../components/UserAvatar";
import { readLanguage } from "../lib/i18n";
import { useTranslation } from "../lib/i18n";

interface ProfilePageProps {
  user: User;
  busy: boolean;
  onBack: () => void;
  onSignOut: () => Promise<void>;
}

export function ProfilePage({ user, busy, onBack, onSignOut }: ProfilePageProps) {
  const t = useTranslation();
  const email = user.email ?? t("emailUnavailable");
  const initials = email.slice(0, 1).toUpperCase();
  return (
    <main className="page-content">
      <div className="page-header">
        <div><p className="greeting">{t("yourPersonalAccount")}</p><h1 className="page-title">{t("profile")}</h1></div>
        <button className="secondary-button" type="button" onClick={onBack}><ArrowLeft size={16} /> {t("back")}</button>
      </div>
      <section className="panel profile-card">
        <div className="profile-avatar"><UserAvatar user={user} fallback={initials} /></div>
        <div className="profile-info"><h2>{user.user_metadata?.full_name || user.user_metadata?.name || t("yourMontraAccount")}</h2><p>{email}</p></div>
      </section>
      <section className="panel profile-detail">
        <div className="detail-line"><span>{t("signInMethod")}</span><strong>{user.app_metadata?.provider === "google" ? "Google" : user.app_metadata?.provider === "apple" ? "Apple" : "Email link"}</strong></div>
          <div className="detail-line"><span>{t("accountCreated")}</span><strong>{user.created_at ? new Intl.DateTimeFormat(readLanguage(), { dateStyle: "medium" }).format(new Date(user.created_at)) : "—"}</strong></div>
      </section>
      <button className="danger-button" type="button" disabled={busy} onClick={() => void onSignOut()} style={{ marginTop: 20 }}><LogOut size={16} />{busy ? t("signingOut") : t("signOut")}</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 30, color: "var(--subtle)", fontSize: 12 }}><UserRound size={15} /> {t("accountPersonal")}</div>
    </main>
  );
}