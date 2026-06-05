/* Le Rond Point — composants partagés */

// ── Avatar ───────────────────────────────────────────────────
function Avatar({ m, size = 'md', ring = false, style = {} }) {
  const px = { xs: 26, sm: 32, md: 40, lg: 48, xl: 64 }[size];
  const fs = { xs: 11, sm: 13, md: 15, lg: 18, xl: 24 }[size];
  return (
    <div style={{
      width: px, height: px, borderRadius: 9999, flexShrink: 0,
      background: m.color, color: '#fff', fontWeight: 600, fontSize: fs,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      letterSpacing: '-0.01em', boxShadow: ring ? '0 0 0 3px var(--surface), 0 0 0 4.5px ' + m.color : 'none',
      ...style,
    }}>{m.name[0]}</div>
  );
}

// ── Pile d'avatars (max 3 + N) ───────────────────────────────
function AvatarStack({ members, size = 'sm', max = 3 }) {
  const px = { xs: 26, sm: 32, md: 40 }[size];
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((m, i) => (
        <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -px * 0.32, boxShadow: '0 0 0 2px var(--surface)', borderRadius: 9999 }}>
          <Avatar m={m} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -px * 0.32, width: px, height: px, borderRadius: 9999,
          background: 'var(--surface-raised)', color: 'var(--muted-fg)',
          fontWeight: 600, fontSize: px * 0.36, display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: '0 0 0 2px var(--surface)',
        }}>+{extra}</div>
      )}
    </div>
  );
}

// ── Badge de disponibilité ───────────────────────────────────
function AvailBadge({ availability, compact = false }) {
  const open = availability === 'OPEN';
  const color = open ? 'var(--available)' : 'var(--busy)';
  const bg = open ? 'var(--available-light)' : 'var(--busy-light)';
  const label = open ? (compact ? 'Ouvert' : 'Ouvert aux retrouvailles') : (compact ? 'Peu dispo' : 'Passage rapide');
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
      padding: '3px 9px 3px 7px', borderRadius: 9999, background: bg, color,
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '-0.01em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 9999, background: color }} />
      {label}
    </span>
  );
}

// ── Badge compteur (calendrier) ──────────────────────────────
function CountBadge({ n, size = 16 }) {
  return (
    <span style={{
      minWidth: size, height: size, padding: '0 4px', borderRadius: 9999,
      background: 'var(--primary)', color: '#fff', fontSize: size * 0.62,
      fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      lineHeight: 1, fontVariantNumeric: 'tabular-nums',
    }}>{n}</span>
  );
}

// ── Bouton ───────────────────────────────────────────────────
function Btn({ variant = 'primary', size = 'md', children, onClick, style = {}, type = 'button' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', border: 'none',
    borderRadius: 9999, whiteSpace: 'nowrap', transition: 'transform .12s, filter .15s, background .15s',
    fontSize: size === 'sm' ? 13 : 15, padding: size === 'sm' ? '8px 16px' : '13px 22px',
    width: style.width === '100%' ? '100%' : undefined,
  };
  const variants = {
    primary: { background: 'var(--primary)', color: '#fff', boxShadow: 'var(--shadow-primary)' },
    secondary: { background: 'var(--primary-light)', color: 'var(--primary)' },
    ghost: { background: 'transparent', color: 'var(--muted-fg)' },
    destructive: { background: '#FEF2F2', color: 'var(--destructive)' },
    outline: { background: 'var(--surface)', color: 'var(--fg)', boxShadow: 'inset 0 0 0 1.5px var(--border)' },
  };
  return (
    <button type={type} onClick={onClick}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

// ── Carte ────────────────────────────────────────────────────
function Card({ children, style = {}, onClick, raised = false }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--surface)', borderRadius: 'var(--radius-xl)',
      border: 'var(--card-border)', boxShadow: raised ? 'var(--shadow-md)' : 'var(--card-shadow)',
      padding: 'var(--card-pad)', cursor: onClick ? 'pointer' : 'default', ...style,
    }}>{children}</div>
  );
}

// ── Bottom Sheet ─────────────────────────────────────────────
function Sheet({ open, onClose, children, title, subtitle }) {
  const [mounted, setMounted] = React.useState(open);
  React.useEffect(() => { if (open) setMounted(true); }, [open]);
  if (!mounted) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80 }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.42)',
        backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
        opacity: open ? 1 : 0, transition: 'opacity .25s ease',
      }} onTransitionEnd={() => { if (!open) setMounted(false); }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--surface)', borderRadius: '26px 26px 0 0',
        boxShadow: '0 -8px 40px rgba(15,23,42,0.18)',
        transform: open ? 'translateY(0)' : 'translateY(101%)',
        transition: 'transform .32s cubic-bezier(0.32,0.72,0,1)',
        maxHeight: 'calc(100% - 52px)', display: 'flex', flexDirection: 'column',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
      }}>
        <div style={{ padding: '12px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 38, height: 5, borderRadius: 9999, background: 'var(--border)', margin: '0 auto' }} />
        </div>
        {(title || subtitle) && (
          <div style={{ padding: '8px 22px 6px', flexShrink: 0 }}>
            {title && <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 13, color: 'var(--subtle)', marginTop: 2 }}>{subtitle}</div>}
          </div>
        )}
        <div style={{ overflowY: 'auto', padding: '6px 22px 8px', WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Bottom Tab Bar ───────────────────────────────────────────
function BottomNav({ active, onChange }) {
  const tabs = [
    { id: 'calendar', label: 'Calendrier', icon: IconCal },
    { id: 'presences', label: 'Présences', icon: IconPeople },
    { id: 'profile', label: 'Profil', icon: IconUser },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
      background: 'var(--surface)', borderTop: '1px solid var(--border)',
      paddingBottom: 22, // home indicator
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      height: 86, boxShadow: '0 -2px 16px rgba(15,23,42,0.04)',
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        const Ic = t.icon;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '6px 18px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: on ? 'var(--primary)' : 'var(--subtle)', fontFamily: 'inherit',
          }}>
            <Ic active={on} />
            <span style={{ fontSize: 11, fontWeight: on ? 600 : 500, letterSpacing: '-0.01em' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── FAB ──────────────────────────────────────────────────────
function FAB({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Ajouter une présence"
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      style={{
        position: 'absolute', right: 18, bottom: 100, zIndex: 45,
        width: 58, height: 58, borderRadius: 9999, border: 'none', cursor: 'pointer',
        background: 'var(--primary)', color: '#fff', boxShadow: 'var(--shadow-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform .12s',
      }}>
      <svg width="26" height="26" viewBox="0 0 26 26"><path d="M13 5v16M5 13h16" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></svg>
    </button>
  );
}

// ── Icônes (trait, style iOS) ────────────────────────────────
function IconCal({ active }) {
  const sw = active ? 2.1 : 1.8;
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="4.5" width="17" height="16" rx="3.5" stroke="currentColor" strokeWidth={sw} />
      <path d="M3.5 9h17M8 3v3M16 3v3" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
      {active && <rect x="6.8" y="12" width="4" height="4" rx="1" fill="currentColor" />}
    </svg>
  );
}
function IconPeople({ active }) {
  const sw = active ? 2.1 : 1.8;
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth={sw} />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
      <path d="M16 6.2a3 3 0 010 5.6M17.5 19.5c0-2.3-1-3.9-2.5-4.7" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
    </svg>
  );
}
function IconUser({ active }) {
  const sw = active ? 2.1 : 1.8;
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth={sw} />
      <path d="M4.5 20c0-3.6 3.2-6 7.5-6s7.5 2.4 7.5 6" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
    </svg>
  );
}
function IconChevron({ dir = 'right', color = 'var(--subtle)', size = 16 }) {
  const d = { right: 'M6 3l6 6-6 6', left: 'M12 3L6 9l6 6', down: 'M3 6l6 6 6-6' }[dir];
  return <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}><path d={d} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

Object.assign(window, {
  Avatar, AvatarStack, AvailBadge, CountBadge, Btn, Card, Sheet, BottomNav, FAB,
  IconCal, IconPeople, IconUser, IconChevron,
});
