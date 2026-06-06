"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/shared/Avatar";
import { useLockBodyScroll } from "@/lib/use-lock-body-scroll";
import { Mail, UserMinus, Clock, ChevronLeft, ChevronRight, Link2, Copy, Check, X, Shield, User, Trash2, Flag } from "lucide-react";
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

interface ReportedComment {
  id: string;
  text: string;
  author: { name: string };
  event: { id: string; name: string };
  _count: { reports: number };
  reports: { reason: string | null; reporter: { name: string } }[];
}

interface AdminClientProps {
  session: Session;
  members: Member[];
  pendingInvitations: Invitation[];
  reportedComments: ReportedComment[];
}

export function AdminClient({ session, members, pendingInvitations, reportedComments }: AdminClientProps) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);

  // Liste locale des invitations en attente (mise à jour optimiste).
  // Évite un router.refresh() qui réinitialiserait l'affichage du lien généré.
  const [pending, setPending] = useState<Invitation[]>(pendingInvitations);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const [generatingLink, setGeneratingLink] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [roleBusy, setRoleBusy] = useState(false);

  // File de modération (mise à jour optimiste).
  const [reports, setReports] = useState<ReportedComment[]>(reportedComments);

  async function handleReport(commentId: string, op: "delete" | "dismiss") {
    const label = op === "delete" ? "Supprimer ce commentaire ?" : "Ignorer ce signalement ?";
    if (!confirm(label)) return;
    setReports(r => r.filter(c => c.id !== commentId));
    const res = await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, op }),
    });
    if (!res.ok) { refresh(); alert("L'action a échoué. Réessaie."); }
  }

  useLockBodyScroll(!!selectedMember);

  async function handleSetRole(member: Member, role: "ADMIN" | "MEMBER") {
    if (member.role === role) return;
    setRoleBusy(true);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setSelectedMember({ ...member, role });
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setRoleBusy(false);
    }
  }

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
      if (data.invitation) setPending(p => [data.invitation, ...p]);
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
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      setPending(p => [
        { id: data.token, email: inviteEmail, token: data.token, expiresAt, createdAt: new Date() },
        ...p.filter(i => i.email !== inviteEmail),
      ]);
      setInviteSuccess(`Invitation envoyée à ${inviteEmail} !`);
      setInviteEmail("");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(id: string, name: string) {
    if (!confirm(`Retirer ${name} du groupe ? Ses présences passées seront conservées.`)) return;
    await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
    setSelectedMember(null);
    refresh();
  }

  async function handleDeleteInvitation(inv: Invitation) {
    const label = inv.email ?? "ce lien d'invitation";
    if (!confirm(`Supprimer l'invitation pour ${label} ? Le lien deviendra inutilisable.`)) return;
    // Suppression optimiste, restauration en cas d'échec.
    setPending(p => p.filter(i => i.id !== inv.id));
    const res = await fetch(`/api/admin/invite/${inv.id}`, { method: "DELETE" });
    if (!res.ok) {
      setPending(p => [inv, ...p]);
      alert("La suppression a échoué. Réessaie.");
    }
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

        {/* Commentaires signalés (modération) */}
        {reports.length > 0 && (
          <div>
            <h2 className="text-label mb-3 flex items-center gap-1.5 text-destructive">
              <Flag className="w-4 h-4" /> Commentaires signalés ({reports.length})
            </h2>
            <div className="space-y-2">
              {reports.map(c => (
                <div key={c.id} className="card border-destructive/30 bg-destructive/5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-caption">
                      <span className="font-semibold text-foreground">{c.author.name}</span>
                      {" · "}
                      <Link href={`/sorties/${c.event.id}`} className="text-primary hover:underline">{c.event.name}</Link>
                    </p>
                    <span className="text-2xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                      {c._count.reports} signalement{c._count.reports > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-body-strong bg-surface rounded-lg px-3 py-2 border border-border break-words">{c.text}</p>
                  <ul className="text-caption space-y-0.5">
                    {c.reports.map((r, i) => (
                      <li key={i}>↳ Signalé par {r.reporter.name}{r.reason ? ` : « ${r.reason} »` : ""}</li>
                    ))}
                  </ul>
                  <div className="flex gap-2 pt-0.5">
                    <button
                      onClick={() => handleReport(c.id, "delete")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-destructive bg-destructive/10 font-semibold text-sm hover:bg-destructive/15 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Supprimer
                    </button>
                    <button
                      onClick={() => handleReport(c.id, "dismiss")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-muted-foreground bg-surface border border-border font-semibold text-sm hover:bg-muted transition-colors"
                    >
                      <Check className="w-4 h-4" /> Ignorer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
        {pending.length > 0 && (
          <div>
            <h2 className="text-label mb-3">Invitations en attente ({pending.length})</h2>
            <div className="space-y-2">
              {pending.map(inv => (
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
                  <button
                    onClick={() => handleDeleteInvitation(inv)}
                    aria-label="Supprimer l'invitation"
                    className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
              <button
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className="w-full card flex items-center gap-3 text-left hover:bg-muted transition-colors"
              >
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
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fiche de gestion d'un membre */}
      {selectedMember && (
        <>
          <div className="sheet-backdrop animate-fade-in" onClick={() => setSelectedMember(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-xl animate-slide-up safe-bottom">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-5 pb-8 space-y-5">
              {/* En-tête membre */}
              <div className="flex items-center gap-3">
                <Avatar name={selectedMember.name} image={selectedMember.image} memberColor={selectedMember.memberColor} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-heading-2">{selectedMember.name}</p>
                  <p className="text-caption truncate">{selectedMember.email}</p>
                  {selectedMember.city && <p className="text-caption">{selectedMember.city}</p>}
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Voir le profil complet */}
              <Link
                href={`/membres/${selectedMember.id}`}
                className="flex items-center justify-between gap-3 text-sm text-primary font-medium"
              >
                Voir le profil complet
                <ChevronRight className="w-4 h-4" />
              </Link>

              {/* Rôle */}
              <div>
                <h3 className="text-label mb-2">Rôle</h3>
                {selectedMember.id === session.user.id ? (
                  <p className="text-caption">Tu ne peux pas modifier ton propre rôle.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: "MEMBER", label: "Membre", Icon: User },
                      { value: "ADMIN", label: "Admin", Icon: Shield },
                    ] as const).map(({ value, label, Icon }) => {
                      const active = selectedMember.role === value;
                      return (
                        <button
                          key={value}
                          disabled={roleBusy}
                          onClick={() => handleSetRole(selectedMember, value)}
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-60 ${
                            active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-border/80"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Retirer du groupe */}
              {selectedMember.id !== session.user.id && selectedMember.role !== "ADMIN" && (
                <button
                  onClick={() => handleRemoveMember(selectedMember.id, selectedMember.name)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-destructive bg-destructive/10 font-semibold text-sm hover:bg-destructive/15 transition-colors"
                >
                  <UserMinus className="w-4 h-4" />
                  Retirer du groupe
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
