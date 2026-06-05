/* Le Rond Point — bottom sheets : détail d'un jour & formulaire présence */

// ── Détail d'un jour ─────────────────────────────────────────
function DayDetailSheet({ date, open, onClose, onEdit, onAddForDay }) {
  const L = window.LRP;
  if (!date) return <Sheet open={open} onClose={onClose} />;
  const list = L.presencesOnDay(date).sort((a, b) => {
    if (a.userId === L.CURRENT_USER_ID) return -1; if (b.userId === L.CURRENT_USER_ID) return 1;
    return L.parse(a.start) - L.parse(b.start);
  });
  const meHere = list.some(p => p.userId === L.CURRENT_USER_ID);
  return (
    <Sheet open={open} onClose={onClose} title={L.fmtDay(date)}
      subtitle={list.length === 0 ? 'Personne pour le moment' : `${list.length} ${list.length > 1 ? 'personnes présentes' : 'personne présente'}`}>
      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '8px 0 18px' }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🤷</div>
          <div style={{ fontSize: 14, color: 'var(--muted-fg)', marginBottom: 16 }}>Aucune présence ce jour-là.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
          {list.map((p, i) => {
            const m = L.member(p.userId);
            const me = p.userId === L.CURRENT_USER_ID;
            return (
              <div key={p.id} onClick={() => me && onEdit(p)} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0',
                borderBottom: i < list.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: me ? 'pointer' : 'default',
              }}>
                <Avatar m={m} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{me ? 'Toi' : m.name}</span>
                    {me && <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, background: 'var(--primary-light)', padding: '1px 7px', borderRadius: 9999 }}>modifier</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--subtle)', marginTop: 1 }}>{m.city} · {L.fmtRange(p.start, p.end)}</div>
                  {p.note && <div style={{ fontSize: 13, color: 'var(--fg)', background: 'var(--surface-raised)', borderRadius: 9, padding: '7px 10px', marginTop: 7 }}>“{p.note}”</div>}
                </div>
                <AvailBadge availability={p.availability} compact />
              </div>
            );
          })}
        </div>
      )}
      {!meHere && (
        <Btn variant="secondary" style={{ width: '100%', marginTop: 6 }} onClick={() => onAddForDay(date)}>
          + Indiquer ma présence ce jour-là
        </Btn>
      )}
    </Sheet>
  );
}

// ── Formulaire d'ajout / modification ────────────────────────
function PresenceFormSheet({ open, onClose, editing, initialDate, onSave, onDelete }) {
  const L = window.LRP;
  const isEdit = !!editing;
  const def = React.useMemo(() => {
    if (editing) return { start: editing.start, end: editing.end, note: editing.note || '', availability: editing.availability };
    const base = initialDate ? L.ymd(initialDate) : '2026-07-15';
    return { start: base, end: base, note: '', availability: 'OPEN' };
  }, [editing, initialDate, open]);

  const [start, setStart] = React.useState(def.start);
  const [end, setEnd] = React.useState(def.end);
  const [note, setNote] = React.useState(def.note);
  const [avail, setAvail] = React.useState(def.availability);
  const [confirmDel, setConfirmDel] = React.useState(false);

  React.useEffect(() => { if (open) { setStart(def.start); setEnd(def.end); setNote(def.note); setAvail(def.availability); setConfirmDel(false); } }, [open, def]);

  const invalid = L.parse(end) < L.parse(start);

  function save() {
    if (invalid) return;
    onSave({ id: editing ? editing.id : 'p' + Date.now(), userId: L.CURRENT_USER_ID, start, end, note: note.trim(), availability: avail, updated: L.ymd(L.TODAY) });
  }

  const fieldLabel = { fontSize: 13, fontWeight: 600, color: 'var(--fg)', marginBottom: 6, display: 'block' };
  const inputStyle = {
    width: '100%', padding: '11px 13px', borderRadius: 12, border: '1.5px solid var(--border)',
    background: 'var(--surface)', fontFamily: 'inherit', fontSize: 15, color: 'var(--fg)', outline: 'none',
    boxSizing: 'border-box', appearance: 'none', WebkitAppearance: 'none',
  };

  return (
    <Sheet open={open} onClose={onClose} title={isEdit ? 'Modifier ta présence' : 'Nouvelle présence'}
      subtitle="Indique quand tu seras au quartier">
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={fieldLabel}>Arrivée</label>
          <input type="date" value={start} onChange={e => { setStart(e.target.value); if (L.parse(end) < L.parse(e.target.value)) setEnd(e.target.value); }} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={fieldLabel}>Départ</label>
          <input type="date" value={end} min={start} onChange={e => setEnd(e.target.value)} style={{ ...inputStyle, borderColor: invalid ? 'var(--destructive)' : 'var(--border)' }} />
        </div>
      </div>
      {invalid && <div style={{ fontSize: 12, color: 'var(--destructive)', marginTop: -8, marginBottom: 12 }}>Le départ doit être après l'arrivée.</div>}

      <label style={fieldLabel}>Disponibilité</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[{ k: 'OPEN', t: 'Ouvert aux retrouvailles', c: 'var(--available)', bg: 'var(--available-light)' },
          { k: 'BUSY', t: 'Passage rapide, peu dispo', c: 'var(--busy)', bg: 'var(--busy-light)' }].map(o => {
          const on = avail === o.k;
          return (
            <button key={o.k} onClick={() => setAvail(o.k)} style={{
              flex: 1, padding: '11px 10px', borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit',
              border: on ? `1.5px solid ${o.c}` : '1.5px solid var(--border)',
              background: on ? o.bg : 'var(--surface)', textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: 5,
            }}>
              <span style={{ width: 9, height: 9, borderRadius: 9999, background: o.c }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: on ? o.c : 'var(--muted-fg)', lineHeight: 1.25 }}>{o.t}</span>
            </button>
          );
        })}
      </div>

      <label style={fieldLabel}>Note <span style={{ color: 'var(--subtle)', fontWeight: 400 }}>(optionnel)</span></label>
      <div style={{ position: 'relative', marginBottom: 18 }}>
        <textarea value={note} maxLength={200} onChange={e => setNote(e.target.value)} rows={3}
          placeholder="Ex. Retour pour l'été, dispo le soir…"
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} />
        <span style={{ position: 'absolute', right: 12, bottom: 9, fontSize: 11, color: 'var(--subtle)' }}>{note.length}/200</span>
      </div>

      <Btn variant="primary" style={{ width: '100%', marginBottom: isEdit ? 10 : 4 }} onClick={save}>
        {isEdit ? 'Enregistrer' : 'Publier ma présence'}
      </Btn>

      {isEdit && (
        confirmDel ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setConfirmDel(false)}>Annuler</Btn>
            <Btn variant="destructive" style={{ flex: 1 }} onClick={() => onDelete(editing)}>Confirmer la suppression</Btn>
          </div>
        ) : (
          <Btn variant="destructive" style={{ width: '100%' }} onClick={() => setConfirmDel(true)}>Supprimer cette présence</Btn>
        )
      )}
    </Sheet>
  );
}

Object.assign(window, { DayDetailSheet, PresenceFormSheet });
