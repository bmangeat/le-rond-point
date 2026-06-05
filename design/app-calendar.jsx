/* Le Rond Point — écran Calendrier (grille + timeline barres) */

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Ruban de présences (barres horizontales) ─────────────────
function PresenceTimeline({ year, month, presences, onPresenceTap }) {
  const L = window.LRP;
  const monthStart = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthEnd = new Date(year, month, daysInMonth);

  const rows = presences
    .filter(p => L.rangesOverlap(L.ymd(monthStart), L.ymd(monthEnd), p.start, p.end))
    .sort((a, b) => L.parse(a.start) - L.parse(b.start));

  const isThisMonth = L.TODAY.getFullYear() === year && L.TODAY.getMonth() === month;
  const todayLeft = isThisMonth ? ((L.TODAY.getDate() - 0.5) / daysInMonth) * 100 : null;

  if (rows.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--subtle)', fontSize: 13 }}>
        Personne au quartier ce mois-ci.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* repère aujourd'hui */}
      {todayLeft !== null && (
        <div style={{ position: 'absolute', top: 2, bottom: 2, left: `calc(108px + ${todayLeft}% * (100% - 108px) / 100)`, width: 2, background: hexA('#3B7BF8', 0.0), zIndex: 0 }} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {rows.map(p => {
          const m = L.member(p.userId);
          const s = L.parse(p.start), e = L.parse(p.end);
          const startDay = s < monthStart ? 1 : s.getDate();
          const endDay = e > monthEnd ? daysInMonth : e.getDate();
          const left = ((startDay - 1) / daysInMonth) * 100;
          const width = ((endDay - startDay + 1) / daysInMonth) * 100;
          const open = p.availability === 'OPEN';
          const extendL = s < monthStart, extendR = e > monthEnd;
          const barBg = open ? m.color
            : `repeating-linear-gradient(45deg, ${m.color}, ${m.color} 4px, ${hexA(m.color, 0.55)} 4px, ${hexA(m.color, 0.55)} 9px)`;
          const me = p.userId === L.CURRENT_USER_ID;
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 100, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Avatar m={m} size="xs" />
                <span style={{ fontSize: 13, fontWeight: me ? 700 : 600, color: me ? 'var(--primary)' : 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {me ? 'Toi' : m.name}
                </span>
              </div>
              <div style={{ position: 'relative', flex: 1, height: 22, background: 'var(--surface-raised)', borderRadius: 9999 }}>
                <div onClick={() => onPresenceTap(p)} style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: left + '%', width: width + '%', minWidth: 22,
                  background: barBg, color: '#fff', cursor: 'pointer',
                  borderRadius: 9999,
                  borderTopLeftRadius: extendL ? 0 : 9999, borderBottomLeftRadius: extendL ? 0 : 9999,
                  borderTopRightRadius: extendR ? 0 : 9999, borderBottomRightRadius: extendR ? 0 : 9999,
                  display: 'flex', alignItems: 'center', paddingLeft: 9,
                  fontSize: 11, fontWeight: 600, overflow: 'hidden',
                  boxShadow: me ? '0 0 0 2px var(--surface), 0 0 0 3.5px ' + m.color : 'none',
                }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: width > 18 ? 1 : 0 }}>
                    {startDay}–{endDay}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Grille mensuelle ─────────────────────────────────────────
function MonthGrid({ year, month, onDayTap }) {
  const L = window.LRP;
  const weeks = L.monthGrid(year, month);
  const todayKey = L.ymd(L.TODAY);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center', marginBottom: 4 }}>
        {L.JOURS.map((j, i) => (
          <div key={i} style={{ fontSize: 11, fontWeight: 600, color: 'var(--subtle)', padding: '2px 0 8px' }}>{j}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {weeks.flat().map((dt, i) => {
          if (!dt) return <div key={i} />;
          const list = L.presencesOnDay(dt);
          const count = list.length;
          const mine = list.some(p => p.userId === L.CURRENT_USER_ID);
          const key = L.ymd(dt);
          const isToday = key === todayKey;
          const past = L.startOfDay(dt) < L.startOfDay(L.TODAY) && !isToday;
          let bg = 'transparent', col = 'var(--fg)', border = '1.5px solid transparent', weight = 500;
          if (mine) { bg = 'var(--primary-light)'; col = 'var(--primary)'; border = '1.5px solid var(--primary)'; weight = 700; }
          else if (count > 0) { bg = 'var(--surface-raised)'; }
          if (past) { col = mine ? hexA('#3B7BF8', 0.55) : 'var(--subtle)'; }
          return (
            <button key={i} onClick={() => onDayTap(dt)} style={{
              position: 'relative', aspectRatio: '1 / 1', border, borderRadius: 11,
              background: bg, color: col, fontSize: 14.5, fontWeight: weight, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center',
              outline: isToday && !mine ? '2px solid var(--primary)' : 'none', outlineOffset: -2,
            }}>
              {dt.getDate()}
              {count > 0 && (
                <span style={{ position: 'absolute', top: -3, right: -3 }}>
                  <CountBadge n={count} size={16} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Carte « tes prochaines présences » ───────────────────────
function MyPresenceOverlap({ presence, onPresenceTap, onSeeCalendar }) {
  const L = window.LRP;
  const others = L.overlapping(presence).sort((a, b) => L.parse(a.start) - L.parse(b.start));
  const uniqUsers = [...new Map(others.map(p => [p.userId, L.member(p.userId)])).values()];
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div onClick={() => onPresenceTap(presence)} style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{L.fmtRange(presence.start, presence.end)}</div>
          <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 1 }}>Ta présence</div>
        </div>
        <AvailBadge availability={presence.availability} compact />
      </div>
      {uniqUsers.length > 0 ? (
        <div onClick={onSeeCalendar} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: 'var(--surface-raised)', borderRadius: 12, padding: '9px 11px' }}>
          <AvatarStack members={uniqUsers} size="sm" />
          <span style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500, flex: 1 }}>
            {uniqUsers.length === 1 ? `${uniqUsers[0].name} sera là aussi` : `${uniqUsers.length} amis seront là en même temps`}
          </span>
          <IconChevron />
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--muted-fg)', background: 'var(--surface-raised)', borderRadius: 12, padding: '10px 12px' }}>
          Personne d'autre pour l'instant — ça peut changer !
        </div>
      )}
    </Card>
  );
}

// ── Écran calendrier ─────────────────────────────────────────
function CalendarScreen({ onDayTap, onPresenceTap }) {
  const L = window.LRP;
  const [cursor, setCursor] = React.useState({ y: 2026, m: 6 }); // juillet 2026
  const me = L.member(L.CURRENT_USER_ID);
  const myUpcoming = L.PRESENCES
    .filter(p => p.userId === L.CURRENT_USER_ID && L.startOfDay(L.parse(p.end)) >= L.startOfDay(L.TODAY))
    .sort((a, b) => L.parse(a.start) - L.parse(b.start));

  function shift(d) {
    setCursor(c => { let m = c.m + d, y = c.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return { y, m }; });
  }

  return (
    <div style={{ padding: '0 18px 12px' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0 18px' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--subtle)', fontWeight: 500 }}>Salut {me.name} 👋</div>
          <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Le Rond Point</div>
        </div>
        <Avatar m={me} size="md" />
      </div>

      {/* Tes prochaines présences */}
      {myUpcoming.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--subtle)', marginBottom: 10 }}>Tes prochaines présences</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myUpcoming.map(p => (
              <MyPresenceOverlap key={p.id} presence={p} onPresenceTap={onPresenceTap}
                onSeeCalendar={() => { const d = L.parse(p.start); setCursor({ y: d.getFullYear(), m: d.getMonth() }); }} />
            ))}
          </div>
        </div>
      )}

      {/* Calendrier */}
      <Card style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <NavArrow dir="left" onClick={() => shift(-1)} />
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', textTransform: 'capitalize' }}>{L.MOIS[cursor.m]} {cursor.y}</div>
          <NavArrow dir="right" onClick={() => shift(1)} />
        </div>
        <MonthGrid year={cursor.y} month={cursor.m} onDayTap={onDayTap} />
      </Card>

      {/* Timeline */}
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--subtle)', marginBottom: 12 }}>
        Qui est là en {L.MOIS[cursor.m]}
      </div>
      <Card style={{ padding: 14 }}>
        <PresenceTimeline year={cursor.y} month={cursor.m} presences={L.PRESENCES} onPresenceTap={onPresenceTap} />
      </Card>
    </div>
  );
}

function NavArrow({ dir, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 34, height: 34, borderRadius: 9999, border: 'none', cursor: 'pointer',
      background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <IconChevron dir={dir} color="var(--muted-fg)" size={17} />
    </button>
  );
}

Object.assign(window, { CalendarScreen, PresenceTimeline, MonthGrid, MyPresenceOverlap, hexA });
