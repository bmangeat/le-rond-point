/* Le Rond Point — app principale, navigation, tweaks */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": ["#3B7BF8", "#1D5FD8", "#EFF6FF"],
  "density": "regular",
  "cardStyle": "ombre"
}/*EDITMODE-END*/;

function Toast({ data, onDone }) {
  React.useEffect(() => {
    if (!data) return;
    const t = setTimeout(onDone, 3400);
    return () => clearTimeout(t);
  }, [data]);
  return (
    <div style={{
      position: 'absolute', top: 58, left: 16, right: 16, zIndex: 90,
      transform: data ? 'translateY(0)' : 'translateY(-140%)', opacity: data ? 1 : 0,
      transition: 'transform .4s cubic-bezier(0.32,0.72,0,1), opacity .3s',
      pointerEvents: 'none',
    }}>
      {data && (
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '13px 15px', boxShadow: '0 8px 30px rgba(15,23,42,0.16)', border: '1px solid var(--border)', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 20, lineHeight: 1, marginTop: 1 }}>🎉</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{data.title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted-fg)', marginTop: 1, lineHeight: 1.4 }}>{data.body}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const L = window.LRP;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState('login'); // login | invite | onboarding | app
  const [tab, setTab] = React.useState('calendar');
  const [adminOpen, setAdminOpen] = React.useState(false);
  const [, setV] = React.useState(0);
  const bump = () => setV(x => x + 1);

  const [daySheet, setDaySheet] = React.useState({ open: false, date: null });
  const [formSheet, setFormSheet] = React.useState({ open: false, editing: null, initialDate: null });
  const [toast, setToast] = React.useState(null);

  // ── handlers ──
  const openDay = (date) => setDaySheet({ open: true, date });
  const closeDay = () => setDaySheet(s => ({ ...s, open: false }));
  const openForm = (editing = null, initialDate = null) => setFormSheet({ open: true, editing, initialDate });
  const closeForm = () => setFormSheet(s => ({ ...s, open: false }));

  const onPresenceTap = (p) => {
    if (p.userId === L.CURRENT_USER_ID) openForm(p);
    else openDay(L.parse(p.start));
  };

  const onSavePresence = (data) => {
    const idx = L.PRESENCES.findIndex(p => p.id === data.id);
    const isNew = idx === -1;
    if (isNew) L.PRESENCES.push(data); else L.PRESENCES[idx] = data;
    closeForm();
    bump();
    if (isNew) {
      const others = L.overlapping(data);
      const users = [...new Set(others.map(p => p.userId))];
      if (users.length > 0) {
        const names = users.slice(0, 2).map(u => L.member(u).name).join(', ');
        setToast({ title: 'Vous serez là en même temps !', body: `${names}${users.length > 2 ? ` +${users.length - 2}` : ''} seront prévenus par email.` });
      }
    }
  };

  const onDeletePresence = (p) => {
    const idx = L.PRESENCES.findIndex(x => x.id === p.id);
    if (idx > -1) L.PRESENCES.splice(idx, 1);
    closeForm(); bump();
  };

  // variables de thème (tweaks)
  const pad = { compact: 13, regular: 16, comfy: 20 }[t.density] || 16;
  const themeVars = {
    '--primary': t.palette[0],
    '--primary-dark': t.palette[1],
    '--primary-light': t.palette[2],
    '--ring': t.palette[0],
    '--shadow-primary': `0 4px 16px 0 ${hexA(t.palette[0], 0.28)}`,
    '--shadow-primary-soft': `0 2px 12px 0 ${hexA(t.palette[0], 0.16)}`,
    '--card-pad': pad + 'px',
    '--card-shadow': t.cardStyle === 'ombre' ? 'var(--shadow-sm)' : 'none',
    '--card-border': t.cardStyle === 'bordure' ? '1px solid var(--border)' : '1px solid transparent',
  };

  // ── contenu selon la route ──
  let content;
  if (route === 'login') {
    content = <LoginScreen onLogin={() => setRoute('app')} onInvite={() => setRoute('invite')} />;
  } else if (route === 'invite') {
    content = <InviteScreen onAccept={() => setRoute('onboarding')} />;
  } else if (route === 'onboarding') {
    content = <OnboardingScreen onFinish={() => { setRoute('app'); setTab('calendar'); bump(); }} />;
  } else {
    // app
    const showFab = (tab === 'calendar' || tab === 'presences') && !adminOpen;
    content = (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: 52, paddingBottom: 96 }}>
          {adminOpen ? <AdminScreen onBack={() => setAdminOpen(false)} bump={bump} />
            : tab === 'calendar' ? <CalendarScreen onDayTap={openDay} onPresenceTap={onPresenceTap} />
            : tab === 'presences' ? <PresencesScreen onPresenceTap={onPresenceTap} />
            : <ProfileScreen onOpenAdmin={() => setAdminOpen(true)} onLogout={() => { setRoute('login'); setAdminOpen(false); setTab('calendar'); }} bump={bump} />}
        </div>
        {showFab && <FAB onClick={() => openForm(null, null)} />}
        {!adminOpen && <BottomNav active={tab} onChange={(id) => { setTab(id); setAdminOpen(false); closeDay(); closeForm(); }} />}
        <DayDetailSheet date={daySheet.date} open={daySheet.open} onClose={closeDay}
          onEdit={(p) => { closeDay(); setTimeout(() => openForm(p), 120); }}
          onAddForDay={(d) => { closeDay(); setTimeout(() => openForm(null, d), 120); }} />
        <PresenceFormSheet open={formSheet.open} editing={formSheet.editing} initialDate={formSheet.initialDate}
          onClose={closeForm} onSave={onSavePresence} onDelete={onDeletePresence} />
        <Toast data={toast} onDone={() => setToast(null)} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center', padding: 20, boxSizing: 'border-box' }}>
      <IOSDevice>
        <div style={{ ...themeVars, position: 'absolute', inset: 0, background: 'var(--bg)', color: 'var(--fg)', fontFamily: "'Inter', system-ui, sans-serif" }}>
          {content}
        </div>
      </IOSDevice>

      <TweaksPanel>
        <TweakSection label="Apparence" />
        <TweakColor label="Couleur primaire" value={t.palette}
          options={[["#3B7BF8", "#1D5FD8", "#EFF6FF"], ["#6366F1", "#4F46E5", "#EEF0FF"], ["#8B5CF6", "#7C3AED", "#F3EEFF"], ["#0EA5E9", "#0284C7", "#E0F2FE"]]}
          onChange={(v) => setTweak('palette', v)} />
        <TweakRadio label="Densité" value={t.density} options={['compact', 'regular', 'comfy']}
          onChange={(v) => setTweak('density', v)} />
        <TweakRadio label="Style des cartes" value={t.cardStyle} options={['ombre', 'bordure']}
          onChange={(v) => setTweak('cardStyle', v)} />
        <TweakSection label="Parcours" />
        <TweakButton label="Voir l'invitation" onClick={() => setRoute('invite')} />
        <TweakButton label="Voir l'onboarding" onClick={() => setRoute('onboarding')} />
        <TweakButton label="Écran de connexion" onClick={() => setRoute('login')} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
