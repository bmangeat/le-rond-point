/* Le Rond Point — données de démo (groupe d'amis du quartier) */
(function () {
  // "Aujourd'hui" figé pour un rendu déterministe
  const TODAY = new Date(2026, 5, 5); // 5 juin 2026 (mois 0-indexé : 5 = juin)

  const MEMBERS = [
    { id: 'u1', name: 'Brice',  city: 'Lyon',      color: '#3B7BF8', role: 'ADMIN',  email: 'brice.mangeat@gmail.com', joined: '2026-01-12', notif: true },
    { id: 'u2', name: 'Sophie', city: 'Marseille', color: '#8B5CF6', role: 'MEMBER', email: 'sophie.l@gmail.com',       joined: '2026-01-18', notif: true },
    { id: 'u3', name: 'Marc',   city: 'Berlin',    color: '#F97316', role: 'MEMBER', email: 'marc.delaunay@gmail.com', joined: '2026-01-20', notif: false },
    { id: 'u4', name: 'Amélie', city: 'Montréal',  color: '#10B981', role: 'MEMBER', email: 'amelie.roy@gmail.com',    joined: '2026-02-02', notif: true },
    { id: 'u5', name: 'Lucas',  city: 'Londres',   color: '#F43F5E', role: 'MEMBER', email: 'lucas.b@gmail.com',       joined: '2026-02-09', notif: true },
    { id: 'u6', name: 'Rayan',  city: 'Paris',     color: '#06B6D4', role: 'MEMBER', email: 'rayan.k@gmail.com',       joined: '2026-02-14', notif: true },
    { id: 'u7', name: 'Inès',   city: 'Barcelone', color: '#EC4899', role: 'MEMBER', email: 'ines.f@gmail.com',        joined: '2026-03-01', notif: true },
    { id: 'u8', name: 'Thomas', city: 'Singapour', color: '#6366F1', role: 'MEMBER', email: 'thomas.n@gmail.com',      joined: '2026-03-10', notif: true },
    { id: 'u9', name: 'Nadia',  city: 'Genève',    color: '#14B8A6', role: 'MEMBER', email: 'nadia.c@gmail.com',       joined: '2026-03-22', notif: true },
  ];

  // availability: 'OPEN' | 'BUSY'
  const PRESENCES = [
    { id: 'p1',  userId: 'u6', start: '2026-06-03', end: '2026-06-09', availability: 'BUSY', note: 'Juste un long week-end, je file vite mais on se boit un café !', updated: '2026-05-28' },
    { id: 'p9',  userId: 'u9', start: '2026-06-20', end: '2026-06-24', availability: 'OPEN', note: '', updated: '2026-05-30' },
    { id: 'p2',  userId: 'u1', start: '2026-07-10', end: '2026-07-24', availability: 'OPEN', note: "Retour pour l'été, dispo le soir la plupart du temps.", updated: '2026-06-01' },
    { id: 'p4',  userId: 'u5', start: '2026-07-12', end: '2026-07-18', availability: 'OPEN', note: 'Court séjour mais bien motivé pour une soirée.', updated: '2026-06-02' },
    { id: 'p3',  userId: 'u2', start: '2026-07-14', end: '2026-07-28', availability: 'OPEN', note: 'Vacances en famille, partante pour un apéro au Rond Point.', updated: '2026-06-03' },
    { id: 'p5',  userId: 'u3', start: '2026-07-20', end: '2026-08-03', availability: 'BUSY', note: 'Passage entre deux vols, contactez-moi avant de passer.', updated: '2026-06-03' },
    { id: 'p6',  userId: 'u7', start: '2026-07-22', end: '2026-08-05', availability: 'OPEN', note: '', updated: '2026-06-04' },
    { id: 'p7',  userId: 'u4', start: '2026-08-01', end: '2026-08-15', availability: 'OPEN', note: "Tout le mois d'août côté quartier, venez !", updated: '2026-06-04' },
    { id: 'p10', userId: 'u1', start: '2026-09-05', end: '2026-09-07', availability: 'OPEN', note: 'Petit week-end surprise.', updated: '2026-06-04' },
    { id: 'p8',  userId: 'u8', start: '2026-12-24', end: '2027-01-02', availability: 'OPEN', note: 'Pour les fêtes au quartier !', updated: '2026-06-04' },
  ];

  const INVITATIONS = [
    { id: 'i1', email: 'karim.haddad@gmail.com', sent: '2026-06-03', expires: '2026-06-10', status: 'PENDING' },
    { id: 'i2', email: 'julie.moreau@gmail.com', sent: '2026-05-30', expires: '2026-06-06', status: 'PENDING' },
  ];

  const CURRENT_USER_ID = 'u1';

  // ── Helpers de dates ─────────────────────────────────────────
  const MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const MOIS_COURT = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  const JOURS = ['L','M','M','J','V','S','D'];

  function parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
  function ymd(dt) { return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; }
  function startOfDay(dt) { return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()); }
  function daysBetween(a, b) { return Math.round((startOfDay(b) - startOfDay(a)) / 86400000); }
  function addDays(dt, n) { const x = new Date(dt); x.setDate(x.getDate() + n); return x; }

  // format "14 juil. – 28 juil. 2026" / "24 déc. 2026 – 2 janv. 2027"
  function fmtRange(startStr, endStr) {
    const s = parse(startStr), e = parse(endStr);
    const sY = s.getFullYear(), eY = e.getFullYear();
    const sStr = `${s.getDate()} ${MOIS_COURT[s.getMonth()]}`;
    const eStr = `${e.getDate()} ${MOIS_COURT[e.getMonth()]}`;
    if (sY !== eY) return `${sStr} ${sY} – ${eStr} ${eY}`;
    return `${sStr} – ${eStr} ${eY}`;
  }
  function fmtLong(dt) { return `${dt.getDate()} ${MOIS[dt.getMonth()]} ${dt.getFullYear()}`; }
  function fmtDay(dt) { const j = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'][dt.getDay()]; const s = `${j} ${dt.getDate()} ${MOIS[dt.getMonth()]}`; return s.charAt(0).toUpperCase() + s.slice(1); }

  // il y a X jours
  function timeAgo(str) {
    const d = daysBetween(parse(str), TODAY);
    if (d <= 0) return "aujourd'hui";
    if (d === 1) return 'hier';
    if (d < 7) return `il y a ${d} jours`;
    if (d < 14) return 'la semaine dernière';
    return `il y a ${Math.floor(d / 7)} sem.`;
  }

  function member(id) { return MEMBERS.find(m => m.id === id); }
  function presenceCovers(p, dt) { const d = startOfDay(dt); return d >= startOfDay(parse(p.start)) && d <= startOfDay(parse(p.end)); }
  function presencesOnDay(dt, list) { return (list || PRESENCES).filter(p => presenceCovers(p, dt)); }
  function rangesOverlap(aS, aE, bS, bE) { return startOfDay(parse(aS)) <= startOfDay(parse(bE)) && startOfDay(parse(bS)) <= startOfDay(parse(aE)); }

  // présences qui chevauchent une présence donnée (hors soi-même)
  function overlapping(presence, list) {
    return (list || PRESENCES).filter(p => p.id !== presence.id && p.userId !== presence.userId && rangesOverlap(presence.start, presence.end, p.start, p.end));
  }

  // grille du mois : tableau de semaines, chaque semaine = 7 cellules {date|null}
  function monthGrid(year, month) {
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7; // lundi = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }

  window.LRP = {
    TODAY, MEMBERS, PRESENCES, INVITATIONS, CURRENT_USER_ID,
    MOIS, MOIS_COURT, JOURS,
    parse, ymd, startOfDay, daysBetween, addDays,
    fmtRange, fmtLong, fmtDay, timeAgo,
    member, presenceCovers, presencesOnDay, rangesOverlap, overlapping, monthGrid,
  };
})();
