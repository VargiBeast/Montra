import { ArrowLeft, LogOut, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { UserAvatar } from "../components/UserAvatar";

interface ProfilePageProps {
  user: User;
  busy: boolean;
  onBack: () => void;
  onSignOut: () => Promise<void>;
}

export function ProfilePage({ user, busy, onBack, onSignOut }: ProfilePageProps) {
  const email = user.email ?? "Email unavailable";
  const initials = email.slice(0, 1).toUpperCase();
  return (
    <main className="page-content">
      <div className="page-header">
        <div><p className="greeting">Your personal account</p><h1 className="page-title">Profile</h1></div>
        <button className="secondary-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Back</button>
      </div>
      <section className="panel profile-card">
        <div className="profile-avatar"><UserAvatar user={user} fallback={initials} /></div>
        <div className="profile-info"><h2>{user.user_metadata?.full_name || user.user_metadata?.name || "Your Saldo account"}</h2><p>{email}</p></div>
      </section>
      <section className="panel profile-detail">
        <div className="detail-line"><span>Sign-in method</span><strong>{user.app_metadata?.provider === "google" ? "Google" : user.app_metadata?.provider === "apple" ? "Apple" : "Email link"}</strong></div>
        <div className="detail-line"><span>Account created</span><strong>{user.created_at ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(user.created_at)) : "—"}</strong></div>
      </section>
      <button className="danger-button" type="button" disabled={busy} onClick={() => void onSignOut()} style={{ marginTop: 20 }}><LogOut size={16} />{busy ? "Signing out…" : "Sign out"}</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 30, color: "var(--subtle)", fontSize: 12 }}><UserRound size={15} /> Your account is personal to you.</div>
    </main>
  );
}