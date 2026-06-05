"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/shared/Avatar";
import { Mail, UserMinus, Clock, ChevronLeft, Link2, Copy, Check } from "lucide-react";
import Link from "next/link";
import type { Session } from "next-auth";

interface Member {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  city?: string | null;
  memberColor: number;
  role: "ADMIN" | "MEMBER";
  createdAt: Date;
}

interface Invitation {
  id: string;
  email: string | null;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

interface AdminClientProps {
  session: Session;
  members: Member[];
  pendingInvitations: Invitation[];
}

export function AdminClient({ session, members, pendingInvitations }: AdminClientProps) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const [generatingLink, setGeneratingLink] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerateLink() {
    setInviteError(null);
    setInviteLink(null);
    setCopied(false);
    setGeneratingLink(true);
    try {
      const res = await fetch("/api/admin/invite/link", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteLink(data.url);
      refresh();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setGeneratingLink(false);
    }
  }

  async function handleCopyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    setInviting(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteSuccess(`Invitation envoyée à ${inviteEmail} !`);
      setInviteEmail("");
      refresh();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(id: string, name: string) {
    if (!confirm(`Retirer ${name} du groupe ? Ses présences passées seront conservées.`)) return;
    await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/profile" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-heading-1">Administration</h1>
        </div>

        {/* Inviter */}
        <div className="card space-y-3">
          <h2 className="text-heading-3">Inviter un membre</h2>
          <form onSubmit={handleInvite} className="space-y-3">
            {inviteError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{inviteError}</p>
            )}
            {inviteSuccess && (
              <p className="text-sm text-available bg-available-light rounded-lg px-3 py-2">{inviteSuccess}</p>
            )}
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="email@exemple.com"
                required
                className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-primary disabled:opacity-60"
              >
                {inviting ? "…" : "Inviter"}
              </button>
            </div>
          </form>

          {/* Séparateur */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-2xs text-muted-foreground uppercase tracking-wide">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Lien partageable à usage unique */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGenerateLink}
              disabled={generatingLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground font-semibold text-sm hover:bg-muted transition-colors disabled:opacity-60"
            >
              <Link2 className="w-4 h-4" />
              {generatingLink ? "Génération…" : "Générer un lien d'invitation"}
            </button>

            {inviteLink && (
              <div className="space-y-2">
                <p className="text-caption">
                  Lien à usage unique, valable 7 jours. Partage-le à qui tu veux.
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={inviteLink}
                    onFocus={e => e.target.select()}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-muted text-sm truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-primary flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copié" : "Copier"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invitations en attente */}
        {pendingInvitations.length > 0 && (
          <div>
            <h2 className="text-label mb-3">Invitations en attente ({pendingInvitations.length})</h2>
            <div className="space-y-2">
              {pendingInvitations.map(inv => (
                <div key={inv.id} className="card flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {inv.email ? (
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Link2 className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-strong font-medium truncate">
                      {inv.email ?? "Lien d'invitation"}
                    </p>
                    <p className="text-caption flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expire le {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Membres */}
        <div>
          <h2 className="text-label mb-3">Membres ({members.length})</h2>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="card flex items-center gap-3">
                <Avatar name={m.name} image={m.image} memberColor={m.memberColor} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-body-strong font-semibold">{m.name}</p>
                    {m.role === "ADMIN" && (
                      <span className="text-2xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Admin</span>
                    )}
                  </div>
                  <p className="text-caption truncate">{m.email}</p>
                  {m.city && <p className="text-caption">{m.city}</p>}
                </div>
                {m.id !== session.user.id && m.role !== "ADMIN" && (
                  <button
                    onClick={() => handleRemoveMember(m.id, m.name)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
