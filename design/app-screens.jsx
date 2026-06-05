/* Le Rond Point — écrans Présences, Profil, Admin */

function SectionLabel({ children, style = {} }) {
  return <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--subtle)', ...style }}>{children}</div>;
}

// ── Carte présence (liste) ───────────────────────────────────
function PresenceCard({ presence, onTap }) {
  const L = window.LRP;
  const m = L.member(presence.userId);
  const me = presence.userId === L.CURRENT_USER_ID;
  const here = L.presenceCovers(presence, L.TODAY);
  return (
    <Card onClick={() => onTap(presence)} style={{ padding: 15, borderColor: me ? 'var(--primary)' : undefined, boxShadow: me ? 'var(--shadow-primary-soft)' : 'var(--card-shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: presence.note ? 9 : 6 }}>
        <Avatar m={m} size="md" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{me ? 'Toi' : m.name}</span>
            {here && <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--available)', background: 'var(--available-light)', padding: '1px 7px', borderRadius: 9999 }}>au quartier</span>}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--subtle)', marginTop: 1 }}>{m.city}</div>
        </div>
        <AvailBadge availability={presence.availability} compact />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, color: 'var(--muted-fg)', fontWeight: 500 }}>
        <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="2.5" y="3.5" width="13" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M2.5 7h13M6 2v3M12 2v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        {L.fmtRange(presence.start, presence.end)}
      </div>
      {presence.note && <div style={{ fontSize: 13, color: 'var(--fg)', background: 'var(--surface-raised)', borderRadius: 10, padding: '8px 11px', marginTop: 9 }}>“{presence.note}”</div>}
    </Card>
  );
}

function PresencesScreen({ onPresenceTap }) {
  const L = window.LRP;
  const [showPast, setShowPast] = React.useState(false);
  const all = [...L.PRESENCES].sort((a, b) => L.parse(a.start) - L.parse(b.start));
  const upcoming = all.filter(p => L.startOfDay(L.parse(p.end)) >= L.startOfDay(L.TODAY));
  const past = all.filter(p => L.startOfDay(L.parse(p.end)) < L.startOfDay(L.TODAY)).reverse();

  // groupement par mois
  function grouped(list) {
    const groups = {};
    list.forEach(p => { const d = L.parse(p.start); const k = `${d.getFullYear()}-${d.getMonth()}`; (groups[k] = groups[k] || []).push(p); });
    return Object.entries(groups).map(([k, items]) => { const [y, mo] = k.split('-').map(Number); return { label: `${L.MOIS[mo]} ${y}`, items }; });
  }

  return (
    <div style={{ padding: '0 18px 12px' }}>
      <div style={{ padding: '6px 0 16px' }}>
        <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-0.02em' }}>Présences</div>
        <div style={{ fontSize: 13.5, color: 'var(--subtle)', marginTop: 2 }}>{upcoming.length} présences à venir au quartier</div>
      </div>

      {grouped(upcoming).map(g => (
        <div key={g.label} style={{ marginBottom: 18 }}>
          <SectionLabel style={{ marginBottom: 10, textTransform: 'capitalize' }}>{g.label}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {g.items.map(p => <PresenceCard key={p.id} presence={p} onTap={onPresenceTap} />)}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 6 }}>
        <button onClick={() => setShowPast(v => !v)} style={{
          width: '100%', background: 'var(--surface-raised)', border: 'none', cursor: 'pointer',
          borderRadius: 12, padding: '12px', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
          color: 'var(--muted-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {showPast ? 'Masquer les anciennes' : `Voir les anciennes (${past.length})`}
          <IconChevron dir={showPast ? 'up' : 'down'} color="var(--muted-fg)" />
        </button>
      </div>

      {showPast && (
        <div style={{ marginTop: 16, opacity: 0.85 }}>
          {grouped(past).map(g => (
            <div key={g.label} style={{ marginBottom: 18 }}>
              <SectionLabel style={{ marginBottom: 10, textTransform: 'capitalize' }}>{g.label}</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {g.items.map(p => <PresenceCard key={p.id} presence={p} onTap={onPresenceTap} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Profil ───────────────────────────────────────────────────
function ProfileScreen({ onOpenAdmin, onLogout, bump }) {
  const L = window.LRP;
  const me = L.member(L.CURRENT_USER_ID);
  const [city, setCity] = React.useState(me.city);
  const [editCity, setEditCity] = React.useState(false);
  const [notif, setNotif] = React.useState(me.notif);
  const myCount = L.PRESENCES.filter(p => p.userId === me.id).length;

  function saveCity() { me.city = city.trim() || me.city; setCity(me.city); setEditCity(false); bump(); }
  function toggleNotif() { const v = !notif; setNotif(v); me.notif = v; bump(); }

  const rowStyle = { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' };
  const sep = { height: 1, background: 'var(--border)', marginLeft: 16 };

  return (
    <div style={{ padding: '0 18px 12px' }}>
      <div style={{ padding: '6px 0 18px' }}>
        <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-0.02em' }}>Profil</div>
      </div>

      {/* En-tête profil */}
      <Card style={{ padding: 18, marginBottom: 18, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Avatar m={me} size="xl" /></div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>{me.name}</div>
        <div style={{ fontSize: 13.5, color: 'var(--subtle)', marginTop: 2 }}>{me.email}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 22, marginTop: 14 }}>
          <div><div style={{ fontSize: 19, fontWeight: 700, color: 'var(--primary)' }}>{myCount}</div><div style={{ fontSize: 11.5, color: 'var(--subtle)' }}>présences</div></div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div><div style={{ fontSize: 19, fontWeight: 700 }}>{me.role === 'ADMIN' ? 'Admin' : 'Membre'}</div><div style={{ fontSize: 11.5, color: 'var(--subtle)' }}>rôle</div></div>
        </div>
      </Card>

      {/* Réglages */}
      <SectionLabel style={{ marginBottom: 10, marginLeft: 4 }}>Mon profil</SectionLabel>
      <Card style={{ padding: 0, marginBottom: 18, overflow: 'hidden' }}>
        <div style={rowStyle}>
          <IconPin />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--subtle)' }}>Ville de résidence</div>
            {editCity ? (
              <input autoFocus value={city} onChange={e => setCity(e.target.value)} onBlur={saveCity} onKeyDown={e => e.key === 'Enter' && saveCity()}
                style={{ fontSize: 15, fontWeight: 500, border: 'none', borderBottom: '1.5px solid var(--primary)', outline: 'none', fontFamily: 'inherit', width: '100%', padding: '2px 0', background: 'transparent', color: 'var(--fg)' }} />
            ) : (
              <div style={{ fontSize: 15, fontWeight: 500 }}>{me.city}</div>
            )}
          </div>
          <button onClick={() => editCity ? saveCity() : setEditCity(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>{editCity ? 'OK' : 'Modifier'}</button>
        </div>
      </Card>

      <SectionLabel style={{ marginBottom: 10, marginLeft: 4 }}>Notifications</SectionLabel>
      <Card style={{ padding: 0, marginBottom: 18, overflow: 'hidden' }}>
        <div style={rowStyle}>
          <IconBell />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Emails de chevauchement</div>
            <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 1 }}>Quand un ami arrive pendant ta présence</div>
          </div>
          <Toggle on={notif} onClick={toggleNotif} />
        </div>
      </Card>

      {me.role === 'ADMIN' && (
        <Card onClick={onOpenAdmin} style={{ padding: 0, marginBottom: 18, overflow: 'hidden', cursor: 'pointer' }}>
          <div style={rowStyle}>
            <IconShield />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Gérer le groupe</div>
              <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 1 }}>{L.MEMBERS.length} membres · {L.INVITATIONS.length} invitations</div>
            </div>
            <IconChevron />
          </div>
        </Card>
      )}

      <Btn variant="ghost" style={{ width: '100%', color: 'var(--destructive)' }} onClick={onLogout}>Se déconnecter</Btn>
      <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--subtle)', marginTop: 14 }}>Le Rond Point · v1.0</div>
    </div>
  );
}

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 50, height: 30, borderRadius: 9999, border: 'none', cursor: 'pointer', flexShrink: 0,
      background: on ? 'var(--available)' : 'var(--border)', position: 'relative', transition: 'background .2s', padding: 0,
    }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 24, height: 24, borderRadius: 9999, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left .2s' }} />
    </button>
  );
}

// ── Admin ────────────────────────────────────────────────────
function AdminScreen({ onBack, bump }) {
  const L = window.LRP;
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [removed, setRemoved] = React.useState([]);

  function sendInvite() {
    if (!inviteEmail.includes('@')) return;
    setSent(true); setInviteEmail('');
    setTimeout(() => setSent(false), 2200);
  }

  return (
    <div style={{ padding: '0 18px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0 14px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px 4px 0', display: 'flex', alignItems: 'center', color: 'var(--primary)', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, gap: 2 }}>
          <IconChevron dir="left" color="var(--primary)" size={18} /> Profil
        </button>
      </div>
      <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Gérer le groupe</div>
      <div style={{ fontSize: 13.5, color: 'var(--subtle)', marginBottom: 20 }}>Invite et administre les membres du Rond Point</div>

      {/* Inviter */}
      <SectionLabel style={{ marginBottom: 10 }}>Inviter un ami</SectionLabel>
      <Card style={{ padding: 14, marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 9 }}>
          <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@exemple.com" type="email"
            style={{ flex: 1, padding: '11px 13px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--surface)', fontFamily: 'inherit', fontSize: 15, color: 'var(--fg)', outline: 'none', minWidth: 0 }} />
          <Btn variant="primary" onClick={sendInvite}>Inviter</Btn>
        </div>
        {sent && <div style={{ fontSize: 13, color: 'var(--available)', fontWeight: 600, marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>✓ Lien d'invitation envoyé (valable 7 jours)</div>}
      </Card>

      {/* Invitations en attente */}
      <SectionLabel style={{ marginBottom: 10 }}>Invitations en attente</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
        {L.INVITATIONS.map(inv => {
          const exp = L.daysBetween(L.TODAY, L.parse(inv.expires));
          return (
            <Card key={inv.id} style={{ padding: 13, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 9999, background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconMail />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.email}</div>
                <div style={{ fontSize: 12, color: exp <= 1 ? 'var(--busy)' : 'var(--subtle)', marginTop: 1 }}>{exp <= 0 ? 'Expire aujourd\'hui' : exp === 1 ? 'Expire demain' : `Expire dans ${exp} jours`}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--busy)', background: 'var(--busy-light)', padding: '3px 9px', borderRadius: 9999 }}>En attente</span>
            </Card>
          );
        })}
      </div>

      {/* Membres */}
      <SectionLabel style={{ marginBottom: 10 }}>Membres actifs · {L.MEMBERS.length}</SectionLabel>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {L.MEMBERS.map((m, i) => {
          const gone = removed.includes(m.id);
          const isMe = m.id === L.CURRENT_USER_ID;
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < L.MEMBERS.length - 1 ? '1px solid var(--border)' : 'none', opacity: gone ? 0.45 : 1 }}>
              <Avatar m={m} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {gone ? 'Ancien membre' : m.name}
                  {m.role === 'ADMIN' && !gone && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '1px 6px', borderRadius: 9999 }}>ADMIN</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gone ? '—' : m.email}</div>
              </div>
              {!isMe && !gone && (
                <button onClick={() => setRemoved(r => [...r, m.id])} style={{ background: '#FEF2F2', border: 'none', cursor: 'pointer', color: 'var(--destructive)', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', padding: '6px 12px', borderRadius: 9999 }}>Retirer</button>
              )}
              {isMe && <span style={{ fontSize: 12, color: 'var(--subtle)' }}>Toi</span>}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ── Petites icônes profil ────────────────────────────────────
function IconPin() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 21c4-4 7-7.5 7-11a7 7 0 10-14 0c0 3.5 3 7 7 11z" stroke="var(--primary)" strokeWidth="1.7" /><circle cx="12" cy="10" r="2.4" stroke="var(--primary)" strokeWidth="1.7" /></svg>; }
function IconBell() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" stroke="var(--primary)" strokeWidth="1.7" strokeLinejoin="round" /><path d="M10 19a2 2 0 004 0" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" /></svg>; }
function IconShield() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" stroke="var(--primary)" strokeWidth="1.7" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconMail() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="3" stroke="var(--muted-fg)" strokeWidth="1.7" /><path d="M4 7l8 6 8-6" stroke="var(--muted-fg)" strokeWidth="1.7" strokeLinecap="round" /></svg>; }

Object.assign(window, { PresencesScreen, ProfileScreen, AdminScreen, PresenceCard, SectionLabel, Toggle });
