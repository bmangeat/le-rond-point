/* Le Rond Point — écrans Connexion, Invitation, Onboarding */

// ── Logo « rond-point » (anneau + points membres en orbite) ──
function Logo({ size = 96 }) {
  const colors = ['#3B7BF8', '#10B981', '#8B5CF6', '#F43F5E', '#F59E0B', '#06B6D4', '#F97316', '#EC4899'];
  const r = size * 0.40;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 9999, border: `${Math.max(3, size * 0.045)}px solid var(--primary-light)` }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: size * 0.34, height: size * 0.34, borderRadius: 9999, background: 'var(--primary)', boxShadow: 'var(--shadow-primary)' }} />
      {colors.map((c, i) => {
        const a = (i / colors.length) * Math.PI * 2 - Math.PI / 2;
        return <div key={i} style={{
          position: 'absolute', top: `calc(50% + ${Math.sin(a) * r}px)`, left: `calc(50% + ${Math.cos(a) * r}px)`,
          transform: 'translate(-50%,-50%)', width: size * 0.12, height: size * 0.12, borderRadius: 9999,
          background: c, boxShadow: '0 0 0 2.5px var(--surface)',
        }} />;
      })}
    </div>
  );
}

function GoogleButton({ onClick, label = 'Continuer avec Google' }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11,
      padding: '14px', borderRadius: 9999, border: '1.5px solid var(--border)', background: 'var(--surface)',
      cursor: 'pointer', fontFamily: 'inherit', fontSize: 15.5, fontWeight: 600, color: 'var(--fg)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" /><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" /></svg>
      {label}
    </button>
  );
}

// ── Connexion ────────────────────────────────────────────────
function LoginScreen({ onLogin, onInvite }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '90px 28px 40px', textAlign: 'center', background: 'var(--bg)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Logo size={104} />
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 28 }}>Le Rond Point</div>
        <div style={{ fontSize: 15.5, color: 'var(--muted-fg)', marginTop: 10, lineHeight: 1.5, maxWidth: 280 }}>
          Le quartier vous a vus grandir.<br />Sachez qui rentre, et quand.
        </div>
      </div>
      <div>
        <GoogleButton onClick={onLogin} label="Se connecter avec Google" />
        <div style={{ fontSize: 12.5, color: 'var(--subtle)', marginTop: 16, lineHeight: 1.5 }}>
          Accès sur invitation uniquement.
        </div>
        <button onClick={onInvite} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginTop: 8 }}>
          J'ai reçu un lien d'invitation →
        </button>
      </div>
    </div>
  );
}

// ── Invitation (landing /invite/[token]) ─────────────────────
function InviteScreen({ onAccept }) {
  const L = window.LRP;
  const inviter = L.member('u1');
  const preview = L.MEMBERS.filter(m => m.id !== 'u1').slice(0, 6);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '80px 28px 40px', textAlign: 'center', background: 'var(--bg)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Logo size={76} />
        <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 9, background: 'var(--surface)', padding: '8px 14px 8px 8px', borderRadius: 9999, boxShadow: 'var(--shadow-sm)' }}>
          <Avatar m={inviter} size="sm" />
          <span style={{ fontSize: 14, fontWeight: 500 }}><b>{inviter.name}</b> t'invite</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 22, lineHeight: 1.25 }}>Rejoins le groupe du<br />Rond Point</div>
        <div style={{ fontSize: 15, color: 'var(--muted-fg)', marginTop: 12, lineHeight: 1.5, maxWidth: 290 }}>
          Retrouve la bande du quartier et vois qui sera là quand tu rentres.
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
          <AvatarStack members={preview} size="md" max={6} />
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--subtle)', marginTop: 10 }}>{L.MEMBERS.length} membres déjà présents</div>
      </div>
      <div>
        <GoogleButton onClick={onAccept} label="Rejoindre avec Google" />
        <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 14 }}>Lien d'invitation valable encore 6 jours</div>
      </div>
    </div>
  );
}

// ── Onboarding (2 étapes) ────────────────────────────────────
function OnboardingScreen({ onFinish }) {
  const L = window.LRP;
  const me = L.member(L.CURRENT_USER_ID);
  const [step, setStep] = React.useState(0);
  const [city, setCity] = React.useState('');
  const [start, setStart] = React.useState('2026-07-15');
  const [end, setEnd] = React.useState('2026-07-22');
  const [avail, setAvail] = React.useState('OPEN');

  const inputStyle = { width: '100%', padding: '13px 14px', borderRadius: 13, border: '1.5px solid var(--border)', background: 'var(--surface)', fontFamily: 'inherit', fontSize: 16, color: 'var(--fg)', outline: 'none', boxSizing: 'border-box', appearance: 'none', WebkitAppearance: 'none' };

  function finishStep1() { if (city.trim()) me.city = city.trim(); setStep(1); }
  function finishOnboarding() {
    L.PRESENCES.push({ id: 'p' + Date.now(), userId: me.id, start, end, note: '', availability: avail, updated: L.ymd(L.TODAY) });
    onFinish();
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '74px 28px 36px', background: 'var(--bg)' }}>
      {/* progression */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 36 }}>
        {[0, 1].map(i => <div key={i} style={{ flex: 1, height: 5, borderRadius: 9999, background: i <= step ? 'var(--primary)' : 'var(--border)', transition: 'background .25s' }} />)}
      </div>

      {step === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>ÉTAPE 1 / 2</div>
          <div style={{ fontSize: 27, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>Bienvenue, {me.name} !</div>
          <div style={{ fontSize: 15, color: 'var(--muted-fg)', marginTop: 10, lineHeight: 1.5 }}>D'où nous rejoins-tu aujourd'hui ? Ta ville s'affichera à côté de tes présences.</div>
          <div style={{ marginTop: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}><Avatar m={me} size="xl" /></div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 7, display: 'block' }}>Ville de résidence actuelle</label>
            <input autoFocus value={city} onChange={e => setCity(e.target.value)} placeholder="Ex. Lyon, Berlin, Montréal…" style={inputStyle} />
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>ÉTAPE 2 / 2</div>
          <div style={{ fontSize: 27, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>Ta première présence</div>
          <div style={{ fontSize: 15, color: 'var(--muted-fg)', marginTop: 10, lineHeight: 1.5 }}>Quand penses-tu repasser au quartier ? Tu pourras la modifier à tout moment.</div>
          <div style={{ marginTop: 26 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 7, display: 'block' }}>Arrivée</label>
                <input type="date" value={start} onChange={e => { setStart(e.target.value); if (L.parse(end) < L.parse(e.target.value)) setEnd(e.target.value); }} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 7, display: 'block' }}>Départ</label>
                <input type="date" value={end} min={start} onChange={e => setEnd(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 7, display: 'block' }}>Disponibilité</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ k: 'OPEN', t: 'Ouvert aux retrouvailles', c: 'var(--available)', bg: 'var(--available-light)' }, { k: 'BUSY', t: 'Passage rapide', c: 'var(--busy)', bg: 'var(--busy-light)' }].map(o => {
                const on = avail === o.k;
                return <button key={o.k} onClick={() => setAvail(o.k)} style={{ flex: 1, padding: '12px 10px', borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit', border: on ? `1.5px solid ${o.c}` : '1.5px solid var(--border)', background: on ? o.bg : 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 9999, background: o.c }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: on ? o.c : 'var(--muted-fg)' }}>{o.t}</span>
                </button>;
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {step === 1 && <Btn variant="ghost" onClick={() => setStep(0)}>Retour</Btn>}
        <Btn variant="primary" style={{ flex: 1 }} onClick={step === 0 ? finishStep1 : finishOnboarding}>
          {step === 0 ? 'Continuer' : "C'est parti !"}
        </Btn>
      </div>
    </div>
  );
}

Object.assign(window, { Logo, GoogleButton, LoginScreen, InviteScreen, OnboardingScreen });
