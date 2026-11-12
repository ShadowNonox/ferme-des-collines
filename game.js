/* La Ferme des Collines — jeu de gestion original */
'use strict';
(function () {
  const $ = (s) => document.querySelector(s);
  const SAVE_KEY = 'ferme-collines-v1';

  /* ================= Données du jeu ================= */
  // animal : se promène dans le pré ; building : apparaît sur la colline (bx = position horizontale en %)
  const BIZ = [
    { id: 'poules',     name: 'Poulailler',          icon: '🐔', prod: '🥚', animal: '🐔', cost: 4,     growth: 1.07, rev: 1,      time: 0.8,  mgr: 'Mamie Odette',        mgrIcon: '👵', mgrCost: 1e3 },
    { id: 'vaches',     name: 'Pré des vaches',      icon: '🐄', prod: '🥛', animal: '🐄', cost: 70,    growth: 1.15, rev: 50,     time: 3,    mgr: 'Jules le Vacher',     mgrIcon: '👨‍🌾', mgrCost: 2e4 },
    { id: 'moutons',    name: 'Bergerie',            icon: '🐑', prod: '🧶', animal: '🐑', cost: 900,   growth: 1.14, rev: 520,    time: 6,    mgr: 'Lina la Bergère',     mgrIcon: '👩‍🌾', mgrCost: 3e5 },
    { id: 'verger',     name: 'Verger',              icon: '🍎', prod: '🍎', building: '🌳', bx: 18, cost: 11e3,  growth: 1.13, rev: 5.2e3,  time: 12,   mgr: 'Papi Gaston',         mgrIcon: '👴', mgrCost: 4e6 },
    { id: 'ruches',     name: 'Ruchers',             icon: '🐝', prod: '🍯', animal: '🐝', flyer: true, cost: 140e3, growth: 1.12, rev: 60e3,   time: 25,   mgr: "Zoé l'Apicultrice",   mgrIcon: '🧑‍🌾', mgrCost: 5e7 },
    { id: 'fromagerie', name: 'Fromagerie',          icon: '🧀', prod: '🧀', building: '🏠', bx: 31, cost: 1.8e6, growth: 1.11, rev: 700e3,  time: 60,   mgr: 'Maître Fernand',      mgrIcon: '🧑‍🍳', mgrCost: 8e8 },
    { id: 'glacier',    name: 'Glacier fermier',     icon: '🍦', prod: '🍦', building: '🏪', bx: 44, cost: 25e6,  growth: 1.10, rev: 8.5e6,  time: 150,  mgr: 'Rosa la Glacière',    mgrIcon: '👩‍🍳', mgrCost: 1.2e10 },
    { id: 'moulin',     name: 'Moulin & boulangerie', icon: '🥖', prod: '🥖', building: '🌾', bx: 57, cost: 350e6, growth: 1.09, rev: 110e6,  time: 400,  mgr: 'Hector le Meunier',   mgrIcon: '🧔', mgrCost: 2e11 },
    { id: 'marche',     name: 'Marché du village',   icon: '🧺', prod: '💰', building: '⛺', bx: 70, cost: 5e9,   growth: 1.08, rev: 1.5e9,  time: 1200, mgr: 'Clémence la Marchande', mgrIcon: '💁', mgrCost: 4e12 },
    { id: 'foire',      name: 'Grande foire agricole', icon: '🎡', prod: '🎟️', building: '🎡', bx: 84, cost: 80e9,  growth: 1.07, rev: 25e9,   time: 3600, mgr: 'Monsieur le Maire',   mgrIcon: '🎩', mgrCost: 1e14 },
  ];

  // Paliers : 's' = vitesse x2, 'x' = gains multipliés
  const MILESTONES = [[10,'x',2],[25,'s',2],[50,'s',2],[100,'s',2],[150,'x',2],[200,'s',2],[250,'x',3],[300,'x',2],[400,'x',3],[500,'x',4],[600,'x',2],[700,'x',2],[800,'x',3],[900,'x',2],[1000,'x',5],[1250,'x',3],[1500,'x',3],[2000,'x',5]];
  const SYNERGY = [25, 50, 100, 200, 300, 400, 500, 750, 1000];

  const TIERS = ['Engrais bio', 'Outils neufs', 'Race primée', 'Label du terroir', 'Légende de la vallée'];
  const GLOBALS = ['Pluie bienfaisante', 'Été radieux', 'Tracteur rutilant', 'Coopérative régionale', 'Renommée nationale', 'Export mondial', 'Ferme du siècle', 'Agriculture interplanétaire'];
  const UPG = [];
  BIZ.forEach((b, i) => TIERS.forEach((t, k) => UPG.push({ id: 'b' + i + 't' + k, name: t, target: i, mult: 3, cost: b.cost * 2500 * Math.pow(1000, k) })));
  GLOBALS.forEach((g, k) => UPG.push({ id: 'g' + k, name: g, target: -1, mult: 3, cost: 3e5 * Math.pow(800, k) }));
  UPG.sort((a, b) => a.cost - b.cost);

  const SHOP = [
    { id: 'engrais',  icon: '✨', name: 'Engrais enchanté',     desc: 'Toutes les productions 25 % plus rapides', max: 4, cost: (l) => 5 * Math.pow(3, l) },
    { id: 'chien',    icon: '🐕', name: 'Chien de garde',       desc: '+2 h de gains max quand tu es absent',     max: 5, cost: (l) => 3 * Math.pow(2, l) },
    { id: 'ballon',   icon: '🎈', name: 'Aire de montgolfières', desc: 'Les montgolfières passent 35 % plus souvent', max: 3, cost: (l) => 4 * Math.pow(3, l) },
    { id: 'heritage', icon: '📜', name: 'Héritage familial',    desc: 'Commence chaque saison avec un fermier de plus déjà embauché', max: 4, cost: (l) => 8 * Math.pow(4, l) },
  ];

  const ACH = [
    { id: 'first',   icon: '🐣', name: 'Premier pas',            desc: 'Achète un deuxième poulailler',          test: () => S.biz[0].owned >= 2 },
    { id: 'p25',     icon: '🐔', name: 'Cot cot cot !',           desc: 'Possède 25 poulaillers',                  test: () => S.biz[0].owned >= 25 },
    { id: 'v25',     icon: '🐄', name: 'Meuh-gnifique',           desc: 'Possède 25 prés des vaches',              test: () => S.biz[1].owned >= 25 },
    { id: 'm25',     icon: '🐑', name: 'Laine de luxe',           desc: 'Possède 25 bergeries',                    test: () => S.biz[2].owned >= 25 },
    { id: 'all',     icon: '🗺️', name: 'Le grand domaine',        desc: 'Débloque les 10 activités',               test: () => S.biz.every((b) => b.owned > 0) },
    { id: 'c100',    icon: '💯', name: 'Centenaire',              desc: 'Possède 100 exemplaires d’une activité',  test: () => S.biz.some((b) => b.owned >= 100) },
    { id: 'c500',    icon: '🏆', name: 'Empire agricole',         desc: 'Possède 500 exemplaires d’une activité',  test: () => S.biz.some((b) => b.owned >= 500) },
    { id: 't1000',   icon: '🌍', name: 'Mille hectares',          desc: 'Possède 1 000 bâtiments au total',        test: () => totalOwned() >= 1000 },
    { id: 'syn',     icon: '🤝', name: 'Tout le monde s’entraide', desc: 'Possède 25 de chaque activité',          test: () => minOwned() >= 25 },
    { id: 'e1',      icon: '🐷', name: 'Petite tirelire',         desc: 'Gagne 1 000 🪙 au total',                 test: () => S.totalEarned >= 1e3 },
    { id: 'e2',      icon: '💵', name: 'Premier million',         desc: 'Gagne 1 M 🪙 au total',                   test: () => S.totalEarned >= 1e6 },
    { id: 'e3',      icon: '💰', name: 'Milliardaire des champs', desc: 'Gagne 1 Md 🪙 au total',                  test: () => S.totalEarned >= 1e9 },
    { id: 'e4',      icon: '🏦', name: 'Banque de la vallée',     desc: 'Gagne 1 Bn 🪙 au total',                  test: () => S.totalEarned >= 1e12 },
    { id: 'e5',      icon: '👑', name: 'Roi du terroir',          desc: 'Gagne 1 Bd 🪙 au total',                  test: () => S.totalEarned >= 1e15 },
    { id: 'e6',      icon: '🪐', name: 'Fortune cosmique',        desc: 'Gagne 1 Tn 🪙 au total',                  test: () => S.totalEarned >= 1e18 },
    { id: 'rate',    icon: '⚡', name: 'Ça tourne !',              desc: 'Gagne 1 M 🪙 par seconde',                test: () => ips() >= 1e6 },
    { id: 'mgr1',    icon: '🧑‍🌾', name: 'Première embauche',       desc: 'Engage ton premier fermier',              test: () => S.managers.some(Boolean) },
    { id: 'mgrAll',  icon: '👨‍👩‍👧‍👦', name: 'Grande famille',      desc: 'Engage les 10 fermiers',                 test: () => S.managers.every(Boolean) },
    { id: 'upg1',    icon: '🔧', name: 'Bricoleur',               desc: 'Achète une amélioration',                 test: () => upgCount() >= 1 },
    { id: 'upg25',   icon: '⚙️', name: 'Ingénieur agronome',      desc: 'Achète 25 améliorations',                 test: () => upgCount() >= 25 },
    { id: 'b1',      icon: '🎈', name: 'Ballon en vue !',          desc: 'Attrape une montgolfière',                test: () => S.stats.balloons >= 1 },
    { id: 'b10',     icon: '🪂', name: 'Chasseur de ballons',     desc: 'Attrape 10 montgolfières',                test: () => S.stats.balloons >= 10 },
    { id: 'pet',     icon: '❤️', name: 'Ami des bêtes',           desc: 'Caresse 50 animaux',                      test: () => S.stats.pets >= 50 },
    { id: 'pet2',    icon: '💞', name: 'Câlinothérapie',          desc: 'Caresse 500 animaux',                     test: () => S.stats.pets >= 500 },
    { id: 's1',      icon: '🍀', name: 'Nouvelle saison',         desc: 'Lance ta première nouvelle saison',       test: () => S.stats.seasons >= 1 },
    { id: 's5',      icon: '🌈', name: 'Fermier chevronné',       desc: 'Lance 5 nouvelles saisons',               test: () => S.stats.seasons >= 5 },
    { id: 'shop',    icon: '🐕', name: 'Bon chien !',              desc: 'Achète un bonus de saison',               test: () => SHOP.some((x) => S.shop[x.id] > 0) },
  ];

  /* ================= État ================= */
  function newState() {
    return {
      version: 1,
      money: 0, runEarned: 0, totalEarned: 0,
      biz: BIZ.map((_, i) => ({ owned: i === 0 ? 1 : 0, progress: 0, running: false })),
      managers: BIZ.map(() => false),
      upgrades: {},
      clovers: 0, cloversEarned: 0,
      shop: { engrais: 0, chien: 0, ballon: 0, heritage: 0 },
      ach: {},
      stats: { seasons: 0, balloons: 0, pets: 0, clicks: 0, played: 0, bought: 0 },
      boostUntil: 0,
      buyMode: 1,
      sound: true,
      tuto: false,
      lastSave: Date.now(),
    };
  }
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }
  function merge(d) {
    const s = newState();
    if (!d || typeof d !== 'object') return s;
    s.money = Math.max(0, num(d.money, 0));
    s.runEarned = num(d.runEarned, 0);
    s.totalEarned = num(d.totalEarned, 0);
    s.biz = BIZ.map((_, i) => {
      const o = (d.biz || [])[i] || {};
      return { owned: Math.max(0, Math.floor(num(o.owned, i === 0 ? 1 : 0))), progress: Math.min(0.999, Math.max(0, num(o.progress, 0))), running: !!o.running };
    });
    s.managers = BIZ.map((_, i) => !!(d.managers || [])[i]);
    s.upgrades = d.upgrades && typeof d.upgrades === 'object' ? d.upgrades : {};
    s.clovers = Math.max(0, num(d.clovers, 0));
    s.cloversEarned = Math.max(0, num(d.cloversEarned, 0));
    for (const k in s.shop) s.shop[k] = Math.max(0, num((d.shop || {})[k], 0));
    s.ach = d.ach && typeof d.ach === 'object' ? d.ach : {};
    for (const k in s.stats) s.stats[k] = num((d.stats || {})[k], 0);
    s.boostUntil = num(d.boostUntil, 0);
    s.buyMode = [1, 10, 100, 'ms', 'max'].includes(d.buyMode) ? d.buyMode : 1;
    s.sound = d.sound !== false;
    s.tuto = !!d.tuto;
    s.lastSave = num(d.lastSave, Date.now());
    return s;
  }
  function load() {
    try { const raw = localStorage.getItem(SAVE_KEY); return raw ? merge(JSON.parse(raw)) : null; } catch (e) { return null; }
  }
  function save() {
    S.lastSave = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ }
  }

  const loaded = load();
  let S = loaded || newState();
  const firstVisit = !loaded;

  /* ================= Calculs ================= */
  const C = { rev: [], spd: [], global: 1 };
  const totalOwned = () => S.biz.reduce((a, b) => a + b.owned, 0);
  const minOwned = () => Math.min(...S.biz.map((b) => b.owned));
  const upgCount = () => UPG.filter((u) => S.upgrades[u.id]).length;
  const achCount = () => ACH.filter((a) => S.ach[a.id]).length;

  function msInfo(o) {
    let s = 1, x = 1;
    for (const [n, t, v] of MILESTONES) { if (o < n) break; if (t === 's') s *= v; else x *= v; }
    return { s, x };
  }
  const nextMs = (o) => MILESTONES.find((m) => m[0] > o);
  const prevMs = (o) => { let p = 0; for (const m of MILESTONES) if (m[0] <= o) p = m[0]; return p; };
  function synergyMult() { const m = minOwned(); let x = 1; for (const n of SYNERGY) if (m >= n) x *= 2; return x; }
  const cloverBonus = () => 0.03 * S.clovers;

  function recalc() {
    let g = 1;
    for (const u of UPG) if (u.target < 0 && S.upgrades[u.id]) g *= u.mult;
    g *= synergyMult();
    g *= 1 + cloverBonus();
    g *= 1 + 0.02 * achCount();
    C.global = g;
    const tempo = Math.pow(1.25, S.shop.engrais);
    BIZ.forEach((b, i) => {
      const m = msInfo(S.biz[i].owned);
      let x = m.x;
      for (const u of UPG) if (u.target === i && S.upgrades[u.id]) x *= u.mult;
      C.rev[i] = b.rev * x;
      C.spd[i] = b.time / m.s / tempo;
    });
  }
  const boostOn = () => Date.now() < S.boostUntil;
  const cycleRev = (i) => C.rev[i] * S.biz[i].owned * C.global * (boostOn() ? 7 : 1);
  function ips() { let t = 0; BIZ.forEach((b, i) => { if (S.biz[i].owned > 0 && S.managers[i]) t += cycleRev(i) / C.spd[i]; }); return t; }
  // Revenu théorique si tout tournait (sert pour les récompenses)
  function potentialRate() { let t = 0; BIZ.forEach((b, i) => { if (S.biz[i].owned > 0) t += cycleRev(i) / C.spd[i]; }); return t; }

  function bizCost(i, n) {
    const b = BIZ[i], o = S.biz[i].owned;
    return b.cost * Math.pow(b.growth, o) * (Math.pow(b.growth, n) - 1) / (b.growth - 1);
  }
  function maxAfford(i) {
    const b = BIZ[i];
    const base = b.cost * Math.pow(b.growth, S.biz[i].owned);
    if (S.money < base) return 0;
    return Math.max(0, Math.floor(Math.log(S.money * (b.growth - 1) / base + 1) / Math.log(b.growth) + 1e-9));
  }
  function buyQty(i) {
    if (S.biz[i].owned === 0) return 1;
    const m = S.buyMode;
    if (m === 'max') return Math.max(1, maxAfford(i));
    if (m === 'ms') { const n = nextMs(S.biz[i].owned); return n ? n[0] - S.biz[i].owned : 1; }
    return m;
  }
  const canPay = (c) => S.money >= c * (1 - 1e-9);
  function pay(c) { S.money = Math.max(0, S.money - c); }

  const cloversTotalFor = (total) => Math.floor(2 * Math.sqrt(total / 1e10));
  const claimable = () => Math.max(0, cloversTotalFor(S.totalEarned) - S.cloversEarned);

  /* ================= Formatage ================= */
  const SUF = ['', 'k', 'M', 'Md', 'Bn', 'Bd', 'Tn', 'Td', 'Qan', 'Qad', 'Qin', 'Qid', 'Sxn', 'Sxd', 'Spn', 'Spd', 'Ocn', 'Ocd', 'Non', 'Nod', 'Dcn', 'Dcd'];
  function fmt(n) {
    if (!isFinite(n)) return '∞';
    if (n < 0) return '-' + fmt(-n);
    if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1).replace('.', ',') : String(Math.floor(n));
    let e = Math.floor(Math.log10(n) / 3 + 1e-9);
    if (e >= SUF.length) return n.toExponential(2).replace('.', ',');
    let v = n / Math.pow(1000, e);
    if (v >= 999.995 && e + 1 < SUF.length) { e++; v /= 1000; }
    const s = v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : v.toFixed(0);
    return s.replace('.', ',') + ' ' + SUF[e];
  }
  function fmtTime(s) {
    if (s < 1) return s.toFixed(2).replace('.', ',') + ' s';
    if (s < 60) return (s < 10 ? s.toFixed(1).replace('.', ',') : Math.ceil(s)) + ' s';
    s = Math.ceil(s);
    if (s < 3600) return Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0');
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    if (h < 48) return h + ' h ' + String(m).padStart(2, '0');
    return Math.floor(h / 24) + ' j ' + (h % 24) + ' h';
  }

  /* ================= Sons (synthétisés, aucun fichier) ================= */
  let actx = null;
  function ac() {
    if (!S.sound) return null;
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(f, dur, type = 'sine', vol = 0.05, slide = 0, delay = 0) {
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  const SFX = {
    coin: () => { tone(988, 0.07, 'square', 0.025); tone(1319, 0.14, 'square', 0.025, 0, 0.06); },
    buy: () => tone(440, 0.14, 'triangle', 0.07, 1.8),
    launch: () => tone(620, 0.08, 'sine', 0.05, 1.4),
    pet: (k) => { const f = [180, 520, 330, 700][k % 4]; tone(f, 0.35, k === 1 || k === 3 ? 'square' : 'sawtooth', 0.025, k === 0 ? 0.7 : 1.15); },
    ach: () => [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.2, 'triangle', 0.05, 0, k * 0.09)),
    big: () => [392, 523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, 0.3, 'triangle', 0.05, 0, k * 0.1)),
    error: () => tone(200, 0.15, 'square', 0.03, 0.7),
  };

  /* ================= Effets visuels ================= */
  const fx = $('#fx');
  function toast(icon, title, text) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="ico">${icon}</span><div><b>${title}</b><small>${text || ''}</small></div>`;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 3400);
    const all = $('#toasts').children; if (all.length > 4) all[0].remove();
  }
  function confetti(n = 60, emojis = ['🍀', '🌼', '⭐', '🪙', '🌸']) {
    for (let k = 0; k < n; k++) {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.textContent = emojis[k % emojis.length];
      el.style.left = Math.random() * 100 + 'vw';
      el.style.animationDuration = 2.5 + Math.random() * 2.5 + 's';
      el.style.animationDelay = Math.random() * 0.8 + 's';
      el.style.fontSize = 16 + Math.random() * 18 + 'px';
      fx.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }
  function bumpMoney() { const m = $('#money-box'); m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); }

  /* ================= Modale ================= */
  function modal(title, html, actions) {
    $('#modal-title').innerHTML = title;
    $('#modal-body').innerHTML = html;
    const box = $('#modal-actions'); box.innerHTML = '';
    (actions || [{ label: 'Super !', cls: 'btn-green' }]).forEach((a) => {
      const b = document.createElement('button');
      b.className = 'btn ' + (a.cls || ''); b.textContent = a.label;
      b.onclick = () => { if (a.keepOpen !== true) closeModal(); if (a.fn) a.fn(); };
      box.appendChild(b);
    });
    $('#modal').classList.remove('hidden');
  }
  function closeModal() { $('#modal').classList.add('hidden'); }

  /* ================= Le pré animé ================= */
  const pasture = $('#pasture'), sceneEl = $('#scene');
  const scene = { w: 0, h: 0, animals: [], builds: {} };
  function sceneResize() {
    const oldW = scene.w;
    const r = pasture.getBoundingClientRect(); scene.w = r.width; scene.h = r.height;
    scene.animals.forEach((a) => {
      if (oldW < 100) { const [y0, y1] = yRange(a); a.x = 30 + Math.random() * Math.max(10, scene.w - 80); a.y = y0 + Math.random() * (y1 - y0); }
      a.x = Math.min(a.x, scene.w - 40); pickTarget(a);
    });
  }
  const wantAnimals = (i) => { const o = S.biz[i].owned; return o <= 0 ? 0 : Math.min(7, 1 + Math.floor(Math.log2(o))); };
  function yRange(a) { return a.flyer ? [scene.h * 0.12, scene.h * 0.55] : [scene.h * 0.56, scene.h * 0.8]; }
  function pickTarget(a) {
    const [y0, y1] = yRange(a);
    a.tx = 20 + Math.random() * Math.max(10, scene.w - 70);
    a.ty = y0 + Math.random() * (y1 - y0);
  }
  function addAnimal(i, born) {
    const b = BIZ[i];
    const el = document.createElement('div');
    el.className = 'animal' + (b.flyer ? ' flyer' : '') + (born ? ' newborn' : '');
    el.innerHTML = `<span>${b.animal}</span>`;
    const a = { i, el, flyer: !!b.flyer, dir: 1, walking: false, wait: Math.random() * 2, speed: b.flyer ? 60 + Math.random() * 40 : 18 + Math.random() * 16 };
    const [y0, y1] = yRange(a);
    a.x = 30 + Math.random() * Math.max(10, scene.w - 80);
    a.y = y0 + Math.random() * (y1 - y0);
    pickTarget(a);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); petAnimal(a); });
    sceneEl.appendChild(el);
    scene.animals.push(a);
    if (born) setTimeout(() => el.classList.remove('newborn'), 700);
  }
  function syncScene(born) {
    if (scene.w < 100) sceneResize();
    BIZ.forEach((b, i) => {
      if (b.animal) {
        const list = scene.animals.filter((a) => a.i === i);
        const want = wantAnimals(i);
        for (let k = list.length; k < want; k++) addAnimal(i, born);
        for (let k = list.length; k > want; k--) { const a = list[k - 1]; a.el.remove(); scene.animals.splice(scene.animals.indexOf(a), 1); }
      }
      if (b.building) {
        const has = S.biz[i].owned > 0;
        if (has && !scene.builds[i]) {
          const el = document.createElement('div');
          el.className = 'building'; el.textContent = b.building;
          el.style.left = b.bx + '%'; el.style.bottom = '47%'; el.style.zIndex = 2;
          el.title = b.name;
          sceneEl.appendChild(el); scene.builds[i] = el;
        } else if (!has && scene.builds[i]) { scene.builds[i].remove(); delete scene.builds[i]; }
      }
    });
  }
  function clearScene() {
    scene.animals.forEach((a) => a.el.remove()); scene.animals = [];
    Object.values(scene.builds).forEach((el) => el.remove()); scene.builds = {};
  }
  function popInPasture(x, y, text, cls) {
    const el = document.createElement('div');
    el.className = 'pop ' + (cls || '');
    el.textContent = text;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    sceneEl.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
    setTimeout(() => el.remove(), 1400);
  }
  function petAnimal(a) {
    a.el.classList.remove('pet'); void a.el.offsetWidth; a.el.classList.add('pet');
    const gain = Math.max(1, potentialRate() * 0.4);
    earn(gain);
    S.stats.pets++;
    popInPasture(a.x + 16, a.y - 6, '❤️ +' + fmt(gain), 'gold');
    SFX.pet(a.i);
    hideTip();
  }
  let tipHidden = false;
  function hideTip() { if (tipHidden) return; tipHidden = true; $('#pasture-tip').style.opacity = 0; }
  function sceneUpdate(dt) {
    for (const a of scene.animals) {
      if (a.wait > 0) {
        a.wait -= dt;
        if (a.walking) { a.walking = false; a.el.classList.remove('walk'); }
      } else {
        const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
        if (d < 3) { a.wait = a.flyer ? Math.random() * 0.4 : 1 + Math.random() * 4; pickTarget(a); }
        else {
          const s = Math.min(d, a.speed * dt);
          a.x += (dx / d) * s; a.y += (dy / d) * s;
          if (Math.abs(dx) > 1) a.dir = dx > 0 ? -1 : 1;
          if (!a.walking && !a.flyer) { a.walking = true; a.el.classList.add('walk'); }
        }
      }
      const depth = a.flyer ? 1 : 0.8 + 0.4 * ((a.y - scene.h * 0.56) / (scene.h * 0.24));
      a.el.style.transform = `translate(${a.x.toFixed(1)}px,${a.y.toFixed(1)}px) scale(${(depth * a.dir).toFixed(3)},${depth.toFixed(3)})`;
      a.el.style.zIndex = a.flyer ? 120 : 10 + Math.floor(a.y);
    }
  }
  function productPop(i) {
    if (document.hidden) return;
    const b = BIZ[i];
    let x, y;
    if (b.animal) {
      const list = scene.animals.filter((a) => a.i === i);
      if (!list.length) return;
      const a = list[Math.floor(Math.random() * list.length)];
      x = a.x + 16; y = a.y - 4;
    } else if (scene.builds[i]) {
      x = (b.bx / 100) * scene.w + 20; y = scene.h * 0.53 - 30;
    } else return;
    popInPasture(x, y, b.prod, 'item');
  }

  /* ================= Actions ================= */
  function earn(x) {
    if (!(x > 0) || !isFinite(x)) return;
    S.money += x; S.runEarned += x; S.totalEarned += x;
  }
  function buyBiz(i) {
    const n = buyQty(i), c = bizCost(i, n);
    if (!canPay(c)) { SFX.error(); return; }
    const before = S.biz[i].owned;
    pay(c);
    S.biz[i].owned += n;
    S.stats.bought += n;
    recalc();
    SFX.buy();
    syncScene(true);
    const card = cards[i];
    if (card) { card.root.classList.remove('flash'); void card.root.offsetWidth; card.root.classList.add('flash'); }
    if (before === 0) {
      toast(BIZ[i].icon, BIZ[i].name + ' débloqué !', 'Clique sur l’icône pour lancer la production.');
      buildBizCards();
    }
    // Paliers franchis
    for (const [m, t, v] of MILESTONES) {
      if (before < m && S.biz[i].owned >= m) {
        toast('⭐', `${BIZ[i].name} : palier ${m} !`, t === 's' ? 'Production 2x plus rapide' : `Gains x${v}`);
      }
    }
    const synBefore = SYNERGY.filter((x) => x <= Math.min(...S.biz.map((b, k) => (k === i ? before : b.owned)))).length;
    const synAfter = SYNERGY.filter((x) => x <= minOwned()).length;
    if (synAfter > synBefore) { toast('🤝', 'Synergie de la ferme !', 'Toute la ferme rapporte x2'); confetti(30); }
    refreshUI(true);
  }
  function launchBiz(i) {
    const st = S.biz[i];
    if (st.owned <= 0 || st.running || S.managers[i]) return;
    st.running = true; st.progress = 0;
    S.stats.clicks++;
    SFX.launch();
    if (!S.tuto) { S.tuto = true; const h = document.querySelector('.hint-bubble'); if (h) h.remove(); }
  }
  function hireManager(i) {
    const c = BIZ[i].mgrCost;
    if (S.managers[i] || S.biz[i].owned <= 0 || !canPay(c)) return;
    pay(c); S.managers[i] = true; S.biz[i].running = true;
    SFX.big();
    toast(BIZ[i].mgrIcon, BIZ[i].mgr + ' est embauché(e) !', BIZ[i].name + ' tourne maintenant tout seul.');
    renderManagers(); refreshUI(true);
  }
  function buyUpgrade(u, silent) {
    if (S.upgrades[u.id] || !canPay(u.cost)) return false;
    pay(u.cost); S.upgrades[u.id] = true; recalc();
    if (!silent) { SFX.buy(); toast('🔧', u.name, u.target < 0 ? 'Toute la ferme x' + u.mult : BIZ[u.target].name + ' x' + u.mult); }
    return true;
  }
  function buyAllUpgrades() {
    let n = 0;
    for (const u of UPG) if (!S.upgrades[u.id] && canPay(u.cost)) { buyUpgrade(u, true); n++; }
    if (n) { SFX.big(); toast('🔧', n + ' amélioration' + (n > 1 ? 's' : '') + ' achetée' + (n > 1 ? 's' : ''), 'Ta ferme est plus efficace !'); }
    else SFX.error();
    renderUpgrades(); refreshUI(true);
  }
  function buyShop(item) {
    const l = S.shop[item.id];
    if (l >= item.max) return;
    const c = item.cost(l);
    if (S.clovers < c) { SFX.error(); return; }
    S.clovers -= c; S.shop[item.id]++;
    recalc(); SFX.big();
    toast(item.icon, item.name + ' niveau ' + S.shop[item.id], item.desc);
    renderSeason(); refreshUI(true);
  }
  function askNewSeason() {
    const g = claimable();
    if (g < 1) return;
    modal('🍀 Nouvelle saison ?',
      `<div class="big">🌱</div><p>Tu vas repartir de zéro (pièces, activités, fermiers et améliorations)…</p>
       <p>…mais tu gagnes <b>${fmt(g)} trèfles d'or</b> ! Chaque trèfle non dépensé augmente <b>tous</b> tes revenus de 3 %.</p>
       <p>Tes succès, tes trèfles et tes bonus de saison sont conservés.</p>`,
      [{ label: 'Pas encore', cls: '' }, { label: 'Nouvelle saison !', cls: 'btn-gold', fn: doNewSeason }]);
  }
  function doNewSeason() {
    const g = claimable();
    if (g < 1) return;
    const keep = {
      clovers: S.clovers + g, cloversEarned: S.cloversEarned + g, shop: S.shop, ach: S.ach, stats: S.stats,
      totalEarned: S.totalEarned, sound: S.sound, buyMode: S.buyMode, tuto: true,
    };
    S = Object.assign(newState(), keep);
    S.stats.seasons++;
    for (let k = 0; k < S.shop.heritage && k < BIZ.length; k++) S.managers[k] = true;
    recalc(); clearScene(); syncScene(true); buildBizCards(); renderAll();
    save();
    SFX.big(); confetti(90);
    toast('🍀', 'Saison ' + (S.stats.seasons + 1) + ' !', '+' + fmt(g) + ' trèfles d’or');
    switchTab('farm');
  }

  /* ================= Montgolfières ================= */
  let nextBalloon = Date.now() + 40000;
  function scheduleBalloon() {
    const base = 70000 + Math.random() * 90000;
    nextBalloon = Date.now() + base / (1 + 0.35 * S.shop.ballon);
  }
  function spawnBalloon() {
    const el = document.createElement('div');
    el.className = 'balloon';
    el.innerHTML = '<span>🎈</span>';
    el.style.top = 90 + Math.random() * Math.max(60, window.innerHeight * 0.35) + 'px';
    el.title = 'Attrape la montgolfière !';
    let caught = false;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (caught) return; caught = true;
      el.remove();
      catchBalloon(e.clientX, e.clientY);
    });
    el.addEventListener('animationend', (e) => { if (e.target === el) el.remove(); });
    document.body.appendChild(el);
  }
  function catchBalloon(x, y) {
    S.stats.balloons++;
    const rate = potentialRate();
    if (rate > 0 && Math.random() < 0.5) {
      S.boostUntil = Date.now() + 30000;
      SFX.big(); confetti(40, ['🎉', '🎈', '⭐', '🪙']);
      modal('🎉 Fête au village !', '<div class="big">🎈</div><p>Toutes tes activités rapportent <b>x7</b> pendant <b>30 secondes</b> !</p>', [{ label: 'Youpi !', cls: 'btn-gold' }]);
    } else {
      const gain = Math.max(25, rate * 120, S.money * 0.15);
      earn(gain); bumpMoney();
      SFX.coin(); SFX.ach(); confetti(25, ['🪙', '💰', '✨']);
      toast('🎁', 'Colis surprise !', '+' + fmt(gain) + ' 🪙');
    }
    refreshUI(true);
  }

  /* ================= Interface : activités ================= */
  const cards = [];
  function bizState(i) {
    if (S.biz[i].owned > 0) return 'owned';
    const firstLocked = S.biz.findIndex((b) => b.owned === 0);
    return i === firstLocked ? 'locked' : 'mystery';
  }
  function buildBizCards() {
    const list = $('#biz-list');
    list.innerHTML = ''; cards.length = 0;
    BIZ.forEach((b, i) => {
      const st = bizState(i);
      const root = document.createElement('div');
      root.className = 'biz ' + st;
      if (st === 'mystery') {
        root.innerHTML = `<div class="biz-icon"><span>❓</span></div><div class="biz-body"><div class="biz-name">Activité mystère</div><small style="color:var(--muted)">Débloque l’activité précédente pour la découvrir.</small></div>`;
        list.appendChild(root); cards.push(null);
        return;
      }
      root.innerHTML = `
        <button class="biz-icon" aria-label="Lancer ${b.name}"><span>${b.icon}</span><span class="lvl">0</span></button>
        <div class="biz-body">
          <div class="biz-top"><span class="biz-name">${b.name}</span><span class="biz-mgr hidden"></span></div>
          <div class="bar"><div class="fill"></div><span class="bar-text"></span></div>
          <div class="biz-bottom">
            <button class="buy"><span class="buy-q"></span><span class="buy-c"></span></button>
            <span class="timer"></span>
          </div>
          <div class="ms"><div class="ms-fill"></div><span></span></div>
        </div>`;
      const c = {
        root, icon: root.querySelector('.biz-icon'), lvl: root.querySelector('.lvl'), mgr: root.querySelector('.biz-mgr'),
        bar: root.querySelector('.bar'), fill: root.querySelector('.fill'), barText: root.querySelector('.bar-text'),
        buy: root.querySelector('.buy'), buyQ: root.querySelector('.buy-q'), buyC: root.querySelector('.buy-c'),
        timer: root.querySelector('.timer'), msFill: root.querySelector('.ms-fill'), msText: root.querySelector('.ms span'),
        lastFloat: 0, state: st,
      };
      c.icon.addEventListener('click', () => launchBiz(i));
      c.buy.addEventListener('click', () => buyBiz(i));
      if (i === 0 && !S.tuto) {
        const h = document.createElement('div'); h.className = 'hint-bubble'; h.textContent = '👈 Clique pour ramasser les œufs !';
        root.appendChild(h);
      }
      list.appendChild(root); cards.push(c);
    });
  }
  function refreshBiz() {
    BIZ.forEach((b, i) => {
      const c = cards[i]; if (!c) return;
      const st = S.biz[i];
      const auto = S.managers[i];
      if (st.owned > 0 && c.state === 'locked') { c.state = 'owned'; c.root.classList.remove('locked'); c.root.classList.add('owned'); }
      c.lvl.textContent = st.owned;
      const n = buyQty(i), cost = bizCost(i, n);
      c.buyQ.textContent = st.owned === 0 ? 'Débloquer' : 'x' + n;
      c.buyC.textContent = '🪙 ' + fmt(cost);
      c.buy.disabled = !canPay(cost);
      if (st.owned === 0) return;
      const t = C.spd[i], rev = cycleRev(i);
      const fast = t < 0.25 && (auto || st.running);
      c.bar.classList.toggle('fast', fast);
      c.barText.textContent = fast ? '+' + fmt(rev / t) + ' /s' : '+' + fmt(rev);
      c.timer.textContent = st.running || auto ? fmtTime(Math.max(0, (1 - st.progress) * t)) : fmtTime(t);
      c.icon.classList.toggle('ready', !auto && !st.running);
      c.icon.classList.toggle('auto', auto);
      c.mgr.classList.toggle('hidden', !auto);
      if (auto) c.mgr.textContent = BIZ[i].mgrIcon + ' auto';
      const nm = nextMs(st.owned);
      if (nm) {
        const p = prevMs(st.owned);
        c.msFill.style.transform = `scaleX(${(st.owned - p) / (nm[0] - p)})`;
        c.msText.textContent = `Palier ${nm[0]} : ${nm[1] === 's' ? 'vitesse x2' : 'gains x' + nm[2]}`;
      } else { c.msFill.style.transform = 'scaleX(1)'; c.msText.textContent = 'Tous les paliers atteints !'; }
    });
  }
  function drawBars() {
    BIZ.forEach((b, i) => {
      const c = cards[i]; if (!c || S.biz[i].owned === 0) return;
      c.fill.style.transform = `scaleX(${S.biz[i].progress.toFixed(4)})`;
    });
  }
  function cardFloat(i, gain) {
    const c = cards[i]; if (!c || document.hidden) return;
    const now = performance.now();
    if (now - c.lastFloat < 450) return;
    c.lastFloat = now;
    const el = document.createElement('div');
    el.className = 'float'; el.textContent = '+' + fmt(gain);
    c.root.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
    setTimeout(() => el.remove(), 1200);
  }

  /* ================= Interface : listes ================= */
  function visibleUpgrades() { return UPG.filter((u) => !S.upgrades[u.id] && (u.target < 0 || S.biz[u.target].owned > 0)).slice(0, 24); }
  let upgEls = [];
  function renderUpgrades() {
    const box = $('#upg-list'); box.innerHTML = ''; upgEls = [];
    const list = visibleUpgrades();
    if (!list.length) { box.innerHTML = '<div class="empty">Plus d’amélioration disponible pour l’instant. Débloque de nouvelles activités !</div>'; return; }
    list.forEach((u) => {
      const el = document.createElement('div'); el.className = 'item';
      const who = u.target < 0 ? 'Toute la ferme' : BIZ[u.target].name;
      el.innerHTML = `<span class="ico">${u.target < 0 ? '🌍' : BIZ[u.target].icon}</span>
        <div class="txt"><b>${u.name}</b><small>${who} : gains x${u.mult}</small></div>
        <button class="btn btn-gold">🪙 ${fmt(u.cost)}</button>`;
      const btn = el.querySelector('button');
      btn.onclick = () => { if (buyUpgrade(u)) { renderUpgrades(); refreshUI(true); } };
      box.appendChild(el); upgEls.push({ u, btn });
    });
  }
  let mgrEls = [];
  function renderManagers() {
    const box = $('#mgr-list'); box.innerHTML = ''; mgrEls = [];
    BIZ.forEach((b, i) => {
      const el = document.createElement('div');
      const hired = S.managers[i], unlocked = S.biz[i].owned > 0;
      el.className = 'item' + (hired ? ' done' : unlocked ? '' : ' locked');
      el.innerHTML = `<span class="ico">${unlocked ? b.mgrIcon : '❔'}</span>
        <div class="txt"><b>${unlocked ? b.mgr : '???'}</b><small>${unlocked ? 'S’occupe de : ' + b.name + ' ' + b.icon : 'Débloque l’activité d’abord'}</small></div>
        ${hired ? '<span class="btn">✅ Au travail</span>' : `<button class="btn btn-green" ${unlocked ? '' : 'disabled'}>🪙 ${fmt(b.mgrCost)}</button>`}`;
      const btn = el.querySelector('button');
      if (btn) { btn.onclick = () => hireManager(i); mgrEls.push({ i, btn }); }
      box.appendChild(el);
    });
  }
  function renderSeason() {
    const g = claimable();
    const totalNow = cloversTotalFor(S.totalEarned);
    const nextAt = Math.pow((totalNow + 1) / 2, 2) * 1e10, prevAt = Math.pow(totalNow / 2, 2) * 1e10;
    const pct = Math.min(100, Math.max(0, ((S.totalEarned - prevAt) / (nextAt - prevAt)) * 100));
    $('#season-panel').innerHTML = `
      <div class="season-hero">
        <h2>🍀 Nouvelle saison</h2>
        <p>Quand ta ferme a bien grandi, tu peux recommencer une nouvelle saison. Tu repars de zéro, mais tu récoltes des <b>trèfles d'or</b> qui boostent tous tes revenus pour toujours.</p>
        <div class="season-big">
          <div><small>Trèfles d'or</small><b id="sea-clovers">🍀 ${fmt(S.clovers)}</b></div>
          <div><small>Bonus actuel</small><b id="sea-bonus">+${fmt(cloverBonus() * 100)} %</b></div>
          <div><small>À récolter</small><b id="sea-gain">+${fmt(g)}</b></div>
        </div>
        <small>Prochain trèfle : ${fmt(nextAt)} 🪙 gagnées au total</small>
        <div class="prog"><div style="width:${pct.toFixed(1)}%"></div></div>
        <button class="btn btn-gold" id="season-btn" ${g < 1 ? 'disabled' : ''}>${g < 1 ? 'Gagne 10 Md 🪙 au total pour ta 1ʳᵉ saison' : 'Lancer une nouvelle saison (+' + fmt(g) + ' 🍀)'}</button>
      </div>
      <div class="toolbar"><h2>Bonus de saison</h2></div>
      <p class="hint-text">Dépense tes trèfles pour des bonus permanents. Attention : un trèfle dépensé ne donne plus ses +3 %.</p>
      <div class="grid-list" id="shop-list"></div>`;
    $('#season-btn').onclick = askNewSeason;
    const box = $('#shop-list');
    SHOP.forEach((it) => {
      const l = S.shop[it.id], maxed = l >= it.max;
      const el = document.createElement('div');
      el.className = 'item' + (maxed ? ' done' : '');
      el.innerHTML = `<span class="ico">${it.icon}</span><div class="txt"><b>${it.name} <small>niv. ${l}/${it.max}</small></b><small>${it.desc}</small></div>
        ${maxed ? '<span class="btn">✅ Max</span>' : `<button class="btn btn-gold" ${S.clovers < it.cost(l) ? 'disabled' : ''}>🍀 ${fmt(it.cost(l))}</button>`}`;
      const b = el.querySelector('button'); if (b) b.onclick = () => buyShop(it);
      box.appendChild(el);
    });
  }
  function renderAch() {
    const box = $('#ach-list'); box.innerHTML = '';
    ACH.forEach((a) => {
      const on = !!S.ach[a.id];
      const el = document.createElement('div');
      el.className = 'ach ' + (on ? 'on' : 'off');
      el.innerHTML = `<span class="ico">${a.icon}</span><div><b>${a.name}</b><small>${a.desc}</small></div>`;
      box.appendChild(el);
    });
    $('#ach-count').textContent = `(${achCount()}/${ACH.length})`;
  }
  function renderStats() {
    const rows = [
      ['Pièces gagnées (cette saison)', fmt(S.runEarned) + ' 🪙'],
      ['Pièces gagnées (au total)', fmt(S.totalEarned) + ' 🪙'],
      ['Revenu automatique', fmt(ips()) + ' 🪙/s'],
      ['Multiplicateur global', 'x' + fmt(C.global)],
      ['Bâtiments possédés', fmt(totalOwned())],
      ['Saisons terminées', S.stats.seasons],
      ['Montgolfières attrapées', S.stats.balloons],
      ['Animaux caressés', S.stats.pets],
      ['Temps de jeu', fmtTime(S.stats.played)],
    ];
    $('#stats').innerHTML = rows.map(([k, v]) => `<div class="stat"><small>${k}</small><b>${v}</b></div>`).join('');
  }
  function renderAll() {
    renderUpgrades(); renderManagers(); renderSeason(); renderAch(); renderStats();
    document.querySelectorAll('#buymode button').forEach((b) => b.classList.toggle('active', String(S.buyMode) === b.dataset.mode));
    $('#opt-sound').textContent = S.sound ? '🔊 Son : activé' : '🔇 Son : coupé';
  }

  /* ================= Rafraîchissement ================= */
  let currentTab = 'farm';
  function setBadge(id, n) { const el = $('#badge-' + id); el.textContent = n > 0 ? (n > 99 ? '99+' : n) : ''; }
  let seenAch = 0;
  function refreshUI() {
    $('#money').textContent = fmt(S.money);
    $('#rate').textContent = fmt(ips());
    $('#clovers').textContent = fmt(S.clovers);
    $('#season-label').textContent = 'Saison ' + (S.stats.seasons + 1) + (S.clovers > 0 ? ' · bonus +' + fmt(cloverBonus() * 100) + ' %' : '');
    const bEl = $('#boost');
    if (boostOn()) { bEl.classList.remove('hidden'); bEl.textContent = '🎉 x7 · ' + Math.ceil((S.boostUntil - Date.now()) / 1000) + ' s'; }
    else bEl.classList.add('hidden');
    refreshBiz();
    setBadge('upgrades', UPG.filter((u) => !S.upgrades[u.id] && (u.target < 0 || S.biz[u.target].owned > 0) && canPay(u.cost)).length);
    setBadge('managers', BIZ.filter((b, i) => !S.managers[i] && S.biz[i].owned > 0 && canPay(b.mgrCost)).length);
    setBadge('season', claimable() >= 1 ? claimable() : 0);
    setBadge('more', Math.max(0, achCount() - seenAch));
    if (currentTab === 'upgrades') upgEls.forEach(({ u, btn }) => (btn.disabled = !canPay(u.cost)));
    if (currentTab === 'managers') mgrEls.forEach(({ i, btn }) => (btn.disabled = S.biz[i].owned <= 0 || !canPay(BIZ[i].mgrCost)));
    if (currentTab === 'more') { seenAch = achCount(); }
  }
  function checkAch() {
    let got = false;
    for (const a of ACH) {
      if (!S.ach[a.id] && a.test()) {
        S.ach[a.id] = Date.now(); got = true;
        toast(a.icon, 'Succès : ' + a.name, a.desc + ' · +2 % de revenus');
      }
    }
    if (got) { SFX.ach(); recalc(); if (currentTab === 'more') renderAch(); }
  }
  function switchTab(t) {
    currentTab = t;
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === t));
    document.querySelectorAll('.tab').forEach((s) => s.classList.toggle('active', s.id === 'tab-' + t));
    if (t === 'upgrades') renderUpgrades();
    if (t === 'managers') renderManagers();
    if (t === 'season') renderSeason();
    if (t === 'more') { renderAch(); renderStats(); seenAch = achCount(); }
    refreshUI();
  }

  /* ================= Boucle principale ================= */
  function step(dt) {
    S.stats.played += dt;
    for (let i = 0; i < BIZ.length; i++) {
      const st = S.biz[i];
      if (st.owned <= 0) continue;
      const auto = S.managers[i];
      if (auto) st.running = true;
      if (!st.running) continue;
      st.progress += dt / C.spd[i];
      if (st.progress >= 1) {
        const cyc = auto ? Math.floor(st.progress) : 1;
        const gain = cycleRev(i) * cyc;
        earn(gain);
        st.progress = auto ? st.progress - cyc : 0;
        if (!auto) { st.running = false; SFX.coin(); bumpMoney(); }
        cardFloat(i, gain);
        if (Math.random() < 0.6) productPop(i);
      }
    }
  }
  let last = performance.now(), uiAcc = 0, secAcc = 0, saveAcc = 0;
  function frame() {
    tick(true);
    requestAnimationFrame(frame);
  }
  // Horloge de secours : si le navigateur suspend les animations, le jeu continue d'avancer
  setInterval(() => { if (performance.now() - last > 120) tick(!document.hidden); }, 100);
  function tick(visual) {
    const now = performance.now();
    let dt = (now - last) / 1000; last = now;
    if (!(dt >= 0)) dt = 0;
    dt = Math.min(dt, 86400);
    step(dt);
    if (visual) { drawBars(); sceneUpdate(Math.min(dt, 0.1)); }
    uiAcc += dt; secAcc += dt; saveAcc += dt;
    if (uiAcc >= 0.1) { uiAcc = 0; refreshUI(); }
    if (secAcc >= 1) {
      secAcc = 0; checkAch();
      if (currentTab === 'more') renderStats();
      if (currentTab === 'season') { const g = claimable(); const el = $('#sea-gain'); if (el && el.textContent !== '+' + fmt(g)) renderSeason(); }
      if (Date.now() > nextBalloon) { spawnBalloon(); scheduleBalloon(); }
    }
    if (saveAcc >= 10) { saveAcc = 0; save(); }
  }

  /* ================= Gains hors ligne ================= */
  function offlineGains() {
    const elapsed = (Date.now() - S.lastSave) / 1000;
    if (elapsed < 30) return;
    const cap = (2 + 2 * S.shop.chien) * 3600;
    const t = Math.min(elapsed, cap);
    const savedBoost = S.boostUntil; S.boostUntil = 0;
    const gain = ips() * t;
    S.boostUntil = savedBoost;
    if (gain <= 0) return;
    earn(gain);
    setTimeout(() => {
      modal('🌙 Bon retour à la ferme !',
        `<div class="big">🧑‍🌾</div><p>Pendant ton absence (${fmtTime(elapsed)}), tes fermiers ont travaillé dur et ont gagné :</p>
         <p style="font-size:28px;font-weight:700">🪙 ${fmt(gain)}</p>
         ${elapsed > cap ? `<p><small>Les gains hors ligne sont limités à ${fmtTime(cap)}. Le chien de garde 🐕 augmente cette limite.</small></p>` : ''}`,
        [{ label: 'Merci les amis !', cls: 'btn-gold', fn: () => { SFX.coin(); confetti(30, ['🪙', '✨']); } }]);
    }, 400);
  }

  /* ================= Démarrage ================= */
  function bindUI() {
    document.querySelectorAll('#tabs button').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
    document.querySelectorAll('#buymode button').forEach((b) => b.addEventListener('click', () => {
      const m = b.dataset.mode; S.buyMode = isNaN(+m) ? m : +m;
      document.querySelectorAll('#buymode button').forEach((x) => x.classList.toggle('active', x === b));
      refreshUI();
    }));
    $('#buy-all-upg').addEventListener('click', buyAllUpgrades);
    $('#opt-sound').addEventListener('click', () => { S.sound = !S.sound; renderAll(); if (S.sound) SFX.coin(); });
    $('#opt-save').addEventListener('click', () => { save(); toast('💾', 'Partie sauvegardée', 'Ta ferme est à l’abri.'); });
    $('#opt-export').addEventListener('click', () => {
      save();
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
      modal('📤 Exporter ma partie', `<p>Copie ce code et garde-le précieusement :</p><textarea readonly id="exp-code">${code}</textarea>`,
        [{ label: 'Copier', cls: 'btn-gold', keepOpen: true, fn: () => { const t = $('#exp-code'); t.select(); try { navigator.clipboard.writeText(code); } catch (e) { document.execCommand('copy'); } toast('📋', 'Code copié !', ''); } }, { label: 'Fermer' }]);
    });
    $('#opt-import').addEventListener('click', () => {
      modal('📥 Importer une partie', '<p>Colle ton code de sauvegarde :</p><textarea id="imp-code"></textarea>',
        [{ label: 'Annuler' }, { label: 'Importer', cls: 'btn-gold', fn: () => {
          try {
            const d = JSON.parse(decodeURIComponent(escape(atob($('#imp-code').value.trim()))));
            S = merge(d); S.lastSave = Date.now();
            recalc(); clearScene(); syncScene(); buildBizCards(); renderAll(); save();
            toast('✅', 'Partie importée !', 'Bon retour à la ferme.');
          } catch (e) { toast('⚠️', 'Code invalide', 'Vérifie que tu as tout copié.'); }
        } }]);
    });
    $('#opt-reset').addEventListener('click', () => {
      modal('🗑️ Tout recommencer ?', '<p>Tu vas perdre <b>toute</b> ta progression, y compris les trèfles et les succès. C’est définitif !</p>',
        [{ label: 'Annuler', cls: 'btn-green' }, { label: 'Oui, tout effacer', cls: 'btn-red', fn: () => {
          S = newState(); S.tuto = false; recalc(); clearScene(); syncScene(); buildBizCards(); renderAll(); save();
          toast('🌱', 'Nouvelle ferme', 'Tout recommence !');
        } }]);
    });
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    window.addEventListener('resize', () => { sceneResize(); setHeaderHeight(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
    window.addEventListener('pagehide', save);
    window.addEventListener('beforeunload', save);
  }
  function setHeaderHeight() { document.documentElement.style.setProperty('--hh', $('#top').offsetHeight + 'px'); }

  recalc();
  bindUI();
  setHeaderHeight();
  sceneResize();
  syncScene(false);
  buildBizCards();
  renderAll();
  seenAch = achCount();
  if (!firstVisit) offlineGains();
  refreshUI();
  if (firstVisit) {
    modal('🐄 Bienvenue à la Ferme des Collines !',
      `<div class="big">🌄</div>
       <p>Ta grand-mère t'a légué un petit poulailler au fond de la vallée.</p>
       <p><b>Clique sur les icônes</b> pour produire, <b>achète</b> de nouveaux bâtiments, <b>embauche des fermiers</b> pour tout automatiser… et deviens la plus grande ferme du pays !</p>`,
      [{ label: 'C’est parti ! 🚜', cls: 'btn-gold', fn: () => SFX.coin() }]);
  }
  last = performance.now();
  requestAnimationFrame(frame);
  window.addEventListener('load', sceneResize);

  // Accès de débogage (pratique pour les tests)
  window.__ferme = { get S() { return S; }, scene, recalc, save, fmt, refreshUI, spawnBalloon, syncScene, buildBizCards, renderAll };
})();
