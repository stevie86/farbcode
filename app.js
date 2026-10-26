/* Farbcode — game logic and UI.
   No backend, no analytics, no cookies. Everything stays in the browser;
   the only state that leaves the page is what the player chooses to copy. */

(() => {
  'use strict';

  // ---------------------------------------------------------------- data ---

  const COLORS = [
    { id: 'red',    hex: '#d64045', shape: 'circle' },
    { id: 'blue',   hex: '#3b6fd4', shape: 'square' },
    { id: 'yellow', hex: '#d99a06', shape: 'triangle' },
    { id: 'green',  hex: '#3f9a52', shape: 'diamond' },
    { id: 'purple', hex: '#8b4fc9', shape: 'pentagon' },
    { id: 'cyan',   hex: '#12a4b8', shape: 'hexagon' },
  ];

  const SHAPES = {
    circle:   '<circle cx="12" cy="12" r="8.8"/>',
    square:   '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="2.6"/>',
    triangle: '<path d="M12 3.2 L20.8 20.4 L3.2 20.4 Z"/>',
    diamond:  '<path d="M12 2.6 L21.4 12 L12 21.4 L2.6 12 Z"/>',
    pentagon: '<path d="M12 2.8 L20.9 9.1 L17.8 19.7 L6.2 19.7 L3.1 9.1 Z"/>',
    hexagon:  '<path d="M12 2.7 L20.1 7.4 L20.1 16.6 L12 21.3 L3.9 16.6 L3.9 7.4 Z"/>',
  };

  const I18N = {
    de: {
      'tagline': 'Raten, nicht erraten. Form und Farbe.',
      'mode.daily': 'Tagesrätsel', 'mode.solo': 'Freies Spiel', 'mode.duo': 'Zu zweit',
      'daily.title': 'Tagesrätsel', 'daily.sub': 'Alle raten heute dieselbe Kombi.',
      'daily.streak': 'Serie', 'daily.solved': 'Heute gelöst.',
      'solo.title': 'Freies Spiel', 'solo.sub': 'Der Computer legt die Kombi fest.',
      'duo.setupTitle': 'Geheimcode eingeben',
      'duo.setupText': 'Der erste Spieler legt die Kombi fest. Danach wird das Gerät weitergegeben — der Code bleibt verdeckt, bis das Spiel endet.',
      'duo.setupCta': 'Code festlegen und weitergeben',
      'duo.handoverTitle': 'Jetzt das Gerät weitergeben',
      'duo.handoverText': 'Der Code ist gesetzt. Gib das Gerät weiter und drücke erst weiter, wenn niemand mehr auf die Farben schauen kann.',
      'duo.handoverCta': 'Der Code ist verdeckt — ich rate',
      'duo.guessTitle': 'Du bist am Zug', 'duo.guessSub': 'Der Code bleibt verdeckt, bis das Spiel endet.',
      'action.submit': 'Raten', 'action.newGame': 'Neues Spiel',
      'palette.title': 'Farben', 'palette.hint': 'Tastatur: 1–6 setzt eine Farbe, ←/→ wechselt das Feld, ↑/↓ wechselt die Farbe im Feld, Enter bestätigt, Backspace leert.',
      'settings.title': 'Einstellungen', 'settings.pegs': 'Länge', 'settings.colors': 'Farben',
      'settings.guesses': 'Versuche', 'settings.apply': 'Neues Spiel starten',
      'share.title': 'Teilen',
      'share.text': 'Kein Konto, kein Tracking. Das Ergebnis wird als Text kopiert, das Rätsel als Link in die Adresse.',
      'share.result': 'Ergebnis teilen', 'share.puzzle': 'Rätsel teilen',
      'share.copied': 'Kopiert — der Text liegt in der Zwischenablage.',
      'share.failed': 'Kopieren hat nicht geklappt. Bitte den Text markieren und von Hand kopieren.',
      'legend.exact': 'richtige Farbe, richtige Stelle',
      'legend.near': 'richtige Farbe, andere Stelle',
      'legend.wrong': 'Farbe kommt nicht vor',
      'how.title': 'So wird gespielt',
      'how.1': 'Der Code ist eine Reihe aus vier bis sechs Feldern. Jede Farbe hat eine eigene Form.',
      'how.2': 'Nach jedem Zug siehst du die Rückmeldung: eine richtige Farbe an richtiger Stelle, eine richtige Farbe an anderer Stelle, eine Farbe, die nicht vorkommt.',
      'how.3': 'Die Form trägt die Information, nicht nur die Farbe — das Spiel funktioniert auch bei Farbfehlsichtigkeit.',
      'train.title': 'Trainer',
      'train.intro': 'Drei Züge, die dir die Symbole erklären — danach spielst du allein weiter.',
      'train.start': 'Geführte erste Runde starten',
      'train.next': 'Nächsten Zug zeigen',
      'train.back': 'Zurück zum Spiel',
      'train.step': 'Trainingszug {n} von {max}',
      'train.done': 'Training geschafft — du kennst jetzt ●, ◐ und ✗.',
      'train.s1.goal': 'Zug 1: viermal dieselbe Farbe. Damit siehst du, wie „richtige Stelle“ und „kommt nicht vor“ zusammenspielen.',
      'train.s1.read': '● passt an Feld 1. Die drei ✗ heißen: Es gibt nur ein einziges Rot im Code — die Kreuze sind keine zusätzlichen roten Perlen.',
      'train.s2.goal': 'Zug 2: eine Farbe richtig platziert, eine richtig, aber an anderer Stelle. Jetzt kommt ◐ ins Spiel.',
      'train.s2.read': '● steht an Feld 2. ◐ heißt: dieselbe Farbe, andere Stelle — Rot sitzt an Feld 1, nicht an Feld 3. Die Kreuze: Blau gibt es nur einmal, und Feld 3 ist kein Rot.',
      'train.s3.goal': 'Zug 3: der vollständige Code.',
      'train.s3.read': 'Viermal ●: alle vier Farben sitzen an der richtigen Stelle. Gelöst.',
      'train.hintBtn': 'Hinweis geben',
      'train.hintIdle': 'Der Trainer schließt aus deinen Zügen, was sicher stimmt — und sagt dir, was noch offen ist.',
      'train.hintFirst': 'Setze in jedes Feld eine andere Farbe. So prüfst du mehrere Farben auf einmal.',
      'train.hintPos': 'Feld {n} ist {color}.',
      'train.hintAbsent': '{color} kommt nicht vor.',
      'train.hintPresent': '{color} kommt vor.',
      'train.hintCount': '{color} kommt genau {k}-mal vor.',
      'train.hintOpen': '{color} ist noch möglich.',
      'train.hintMore': 'Noch {n} Kombinationen sind möglich.',
      'train.hintOne': 'Genau eine Kombination ist noch möglich.',
      'train.hintSolution': 'Die einzige mögliche Kombination: {code}.',
      'footer.tagline': 'ein modernes Farb-Rate-Spiel', 'footer.about': 'Über das Spiel',
      'status.guess': 'Zug {n} von {max}',
      'status.exact1': '{n} richtige Farbe an richtiger Stelle',
      'status.exactN': '{n} richtige Farben an richtiger Stelle',
      'status.near1': '{n} richtige Farbe an anderer Stelle',
      'status.nearN': '{n} richtige Farben an anderer Stelle',
      'status.wrong1': '{n} Farbe kommt nicht vor',
      'status.wrongN': '{n} Farben kommen nicht vor',
      'status.win': 'Gelöst!', 'status.winSub': 'Du hast die Kombi in {n} Zügen gefunden.',
      'status.lose': 'Verloren.', 'status.loseSub': 'Die Kombi war {code}.',
      'announce.guess': 'Zug {n}. {detail}',
      'announce.win': 'Gelöst in {n} Zügen.',
      'announce.lose': 'Verloren. Die Kombi war {code}.',
      'announce.incomplete': 'Bitte zuerst alle Felder füllen.',
      'announce.handover': 'Der Code ist gesetzt. Gib das Gerät weiter.',
      'slot.empty': 'Feld {n}: leer',
      'slot.filled': 'Feld {n}: {color}, {shape}',
      'guess.summary': 'Zug {n}: {colors} — {detail}',
      'color.red': 'Rot', 'color.blue': 'Blau', 'color.yellow': 'Gelb',
      'color.green': 'Grün', 'color.purple': 'Violett', 'color.cyan': 'Türkis',
      'shape.circle': 'Kreis', 'shape.square': 'Quadrat', 'shape.triangle': 'Dreieck',
      'shape.diamond': 'Raute', 'shape.pentagon': 'Fünfeck', 'shape.hexagon': 'Sechseck',
    },
    en: {
      'tagline': 'Deduce, don’t guess. Shape and colour.',
      'mode.daily': 'Daily puzzle', 'mode.solo': 'Free play', 'mode.duo': 'Two players',
      'daily.title': 'Daily puzzle', 'daily.sub': 'Everyone solves the same combination today.',
      'daily.streak': 'Streak', 'daily.solved': 'Solved today.',
      'solo.title': 'Free play', 'solo.sub': 'The computer picks the combination.',
      'duo.setupTitle': 'Set the secret code',
      'duo.setupText': 'The first player sets the combination. Then hand the device over — the code stays hidden until the game ends.',
      'duo.setupCta': 'Set the code and hand over',
      'duo.handoverTitle': 'Hand over the device now',
      'duo.handoverText': 'The code is set. Pass the device on and only continue once nobody can see the colours any more.',
      'duo.handoverCta': 'The code is hidden — I am guessing',
      'duo.guessTitle': 'Your turn', 'duo.guessSub': 'The code stays hidden until the game ends.',
      'action.submit': 'Guess', 'action.newGame': 'New game',
      'palette.title': 'Colours', 'palette.hint': 'Keyboard: 1–6 sets a colour, ←/→ moves the slot, ↑/↓ cycles the colour, Enter confirms, Backspace clears.',
      'settings.title': 'Settings', 'settings.pegs': 'Length', 'settings.colors': 'Colours',
      'settings.guesses': 'Guesses', 'settings.apply': 'Start a new game',
      'share.title': 'Share',
      'share.text': 'No account, no tracking. The result is copied as text, the puzzle travels in the link.',
      'share.result': 'Share result', 'share.puzzle': 'Share puzzle',
      'share.copied': 'Copied — the text is in your clipboard.',
      'share.failed': 'Copying did not work. Please select the text and copy it manually.',
      'legend.exact': 'right colour, right place',
      'legend.near': 'right colour, wrong place',
      'legend.wrong': 'colour does not occur',
      'how.title': 'How it works',
      'how.1': 'The code is a row of four to six slots. Every colour carries its own shape.',
      'how.2': 'After each guess you get feedback: right colour in the right place, right colour in the wrong place, colour that does not occur.',
      'how.3': 'Shape carries the information, not colour alone — the game works with colour vision deficiency.',
      'train.title': 'Coach',
      'train.intro': 'Three moves that explain the markers — after that you play on your own.',
      'train.start': 'Start guided first round',
      'train.next': 'Show the next move',
      'train.back': 'Back to the game',
      'train.step': 'Training move {n} of {max}',
      'train.done': 'Training done — you know ●, ◐ and ✗ now.',
      'train.s1.goal': 'Move 1: the same colour four times. This shows how “right place” and “does not occur” fit together.',
      'train.s1.read': '● matches slot 1. The three ✗ mean: there is only one red in the code — the crosses are not extra red pegs.',
      'train.s2.goal': 'Move 2: one colour in the right place, one right colour in the wrong place. Now ◐ comes into play.',
      'train.s2.read': '● sits in slot 2. ◐ means: same colour, other place — red is in slot 1, not slot 3. The crosses: there is only one blue, and slot 3 is not red.',
      'train.s3.goal': 'Move 3: the complete code.',
      'train.s3.read': 'Four ●: all four colours sit in the right place. Solved.',
      'train.hintBtn': 'Give me a hint',
      'train.hintIdle': 'The coach deduces from your moves what is certain — and tells you what is still open.',
      'train.hintFirst': 'Put a different colour in every slot. That way you test several colours at once.',
      'train.hintPos': 'Slot {n} is {color}.',
      'train.hintAbsent': '{color} does not occur.',
      'train.hintPresent': '{color} occurs.',
      'train.hintCount': '{color} occurs exactly {k} times.',
      'train.hintOpen': '{color} is still possible.',
      'train.hintMore': '{n} combinations are still possible.',
      'train.hintOne': 'Exactly one combination is still possible.',
      'train.hintSolution': 'The only possible combination: {code}.',
      'footer.tagline': 'a modern take on the colour guessing game', 'footer.about': 'About the game',
      'status.guess': 'Move {n} of {max}',
      'status.exact1': '{n} right colour, right place',
      'status.exactN': '{n} right colours, right place',
      'status.near1': '{n} right colour, wrong place',
      'status.nearN': '{n} right colours, wrong place',
      'status.wrong1': '{n} colour does not occur',
      'status.wrongN': '{n} colours do not occur',
      'status.win': 'Solved!', 'status.winSub': 'You found the combination in {n} moves.',
      'status.lose': 'Out of moves.', 'status.loseSub': 'The combination was {code}.',
      'announce.guess': 'Move {n}. {detail}',
      'announce.win': 'Solved in {n} moves.',
      'announce.lose': 'Out of moves. The combination was {code}.',
      'announce.incomplete': 'Fill every slot first.',
      'announce.handover': 'The code is set. Hand the device over.',
      'slot.empty': 'Slot {n}: empty',
      'slot.filled': 'Slot {n}: {color}, {shape}',
      'guess.summary': 'Move {n}: {colors} — {detail}',
      'color.red': 'Red', 'color.blue': 'Blue', 'color.yellow': 'Yellow',
      'color.green': 'Green', 'color.purple': 'Purple', 'color.cyan': 'Cyan',
      'shape.circle': 'circle', 'shape.square': 'square', 'shape.triangle': 'triangle',
      'shape.diamond': 'diamond', 'shape.pentagon': 'pentagon', 'shape.hexagon': 'hexagon',
    },
  };

  const STORE = { lang: 'farbcode.lang', settings: 'farbcode.settings', daily: 'farbcode.daily', game: 'farbcode.game', train: 'farbcode.train' };

  // --------------------------------------------------------------- state ---

  const state = {
    lang: 'de',
    mode: 'daily',
    phase: 'guess',        // 'setup' | 'handover' | 'guess' (duo only)
    code: [],
    guesses: [],           // { guess: number[], exact: number, near: number }
    current: [],
    slot: 0,
    over: false,
    won: false,
    settings: { pegs: 4, colors: 6, guesses: 12 },
    date: todayISO(),
    // Trainer: a scripted round that explains the markers, plus a logic hint
    // that is derived from the moves the player has already made.
    train: { step: 0, returnTo: null },
    hintIndex: 0,
    hintFor: -1,
    hintSeen: [],
    hintText: '',
  };

  // -------------------------------------------------------------- helpers ---

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function t(key, vars) {
    let s = (I18N[state.lang] && I18N[state.lang][key]) || I18N.de[key] || key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll('{' + k + '}', String(v));
    return s;
  }

  function todayISO(d) {
    const now = d || new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let x = a;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function b64urlEncode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64urlDecode(s) {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function codeHash(code) {
    return fnv1a(code.join('-')).toString(36).toUpperCase().padStart(6, '0').slice(-4);
  }

  // ----------------------------------------------------------- game rules ---

  /** Mastermind scoring: exact = right colour right place, near = right colour wrong place. */
  function score(guess, code) {
    let exact = 0;
    const pool = new Map();
    for (let i = 0; i < code.length; i++) {
      if (guess[i] === code[i]) exact++;
      else pool.set(code[i], (pool.get(code[i]) || 0) + 1);
    }
    let near = 0;
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === code[i]) continue;
      const have = pool.get(guess[i]) || 0;
      if (have > 0) { near++; pool.set(guess[i], have - 1); }
    }
    return { exact, near };
  }

  function dailyCode(dateStr, pegs, colorCount) {
    const rnd = mulberry32(fnv1a('farbcode:' + dateStr));
    const code = [];
    for (let i = 0; i < pegs; i++) code.push(Math.floor(rnd() * colorCount));
    return code;
  }

  function randomCode(pegs, colorCount) {
    const code = [];
    for (let i = 0; i < pegs; i++) code.push(Math.floor(Math.random() * colorCount));
    return code;
  }

  function newGame(mode, opts = {}) {
    state.mode = mode;
    state.phase = 'guess';
    state.over = false;
    state.won = false;
    state.guesses = [];
    state.date = todayISO();

    if (mode === 'daily') {
      state.settings = { pegs: 4, colors: 6, guesses: 12 };
      state.code = dailyCode(state.date, 4, 6);
    } else if (mode === 'solo') {
      state.settings = { ...state.settings };
      state.code = randomCode(state.settings.pegs, state.settings.colors);
    } else {
      state.settings = { ...state.settings };
      state.code = [];
      state.phase = 'setup';
    }
    state.current = new Array(state.settings.pegs).fill(null);
    state.slot = 0;
    if (mode !== 'daily') saveSettings();
    state.hintText = '';
    render();
    saveGame();
  }

  // --------------------------------------------------------------- trainer ---

  // The guided round uses a fixed code and three scripted moves. Each move
  // teaches one thing beginners get wrong: a cross does not mean "this colour
  // is absent", it means "there is no second peg of it".
  const TRAIN_CODE = [0, 1, 2, 3];                 // red, blue, yellow, green
  const TRAIN_STEPS = [
    { guess: [0, 0, 0, 0], goal: 'train.s1.goal', read: 'train.s1.read' },
    { guess: [1, 1, 0, 0], goal: 'train.s2.goal', read: 'train.s2.read' },
    { guess: [0, 1, 2, 3], goal: 'train.s3.goal', read: 'train.s3.read' },
  ];

  function snapshotGame() {
    return {
      mode: state.mode, phase: state.phase, code: state.code.slice(),
      guesses: state.guesses.map((g) => ({ guess: g.guess.slice(), exact: g.exact, near: g.near })),
      current: state.current.slice(), slot: state.slot, over: state.over, won: state.won,
      settings: { ...state.settings }, date: state.date,
    };
  }

  function restoreGame(snap) {
    state.mode = snap.mode;
    state.phase = snap.phase || 'guess';
    state.code = (snap.code || []).slice();
    state.guesses = (snap.guesses || []).map((g) => ({ guess: g.guess.slice(), exact: g.exact, near: g.near }));
    state.settings = { ...(snap.settings || state.settings) };
    state.current = (snap.current || []).slice(0, state.settings.pegs);
    while (state.current.length < state.settings.pegs) state.current.push(null);
    state.slot = snap.slot || 0;
    state.over = !!snap.over;
    state.won = !!snap.won;
    state.date = snap.date || todayISO();
  }

  function saveTrain() {
    saveJson(STORE.train, { step: state.train.step, returnTo: state.train.returnTo });
  }

  function clearStore(key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }

  /* The training runs beside the real game instead of over it: the running
     game is snapshotted and restored afterwards, so a detour into the trainer
     never costs a move. */
  function startTraining() {
    state.train.returnTo = snapshotGame();
    state.train.step = 0;
    state.mode = 'train';
    state.phase = 'guess';
    state.code = TRAIN_CODE.slice();
    state.guesses = [];
    state.current = new Array(TRAIN_CODE.length).fill(null);
    state.slot = 0;
    state.over = false;
    state.won = false;
    state.settings = { pegs: TRAIN_CODE.length, colors: 6, guesses: 12 };
    state.date = todayISO();
    state.hintIndex = 0;
    state.hintText = '';
    saveTrain();
    render();
  }

  function leaveTraining() {
    if (state.mode !== 'train') return;
    const snap = state.train.returnTo;
    state.train.step = 0;
    state.train.returnTo = null;
    clearStore(STORE.train);
    if (snap) {
      restoreGame(snap);
    } else {
      state.mode = 'daily';
      state.code = dailyCode(state.date, 4, 6);
      state.guesses = [];
      state.current = new Array(4).fill(null);
      state.slot = 0;
      state.over = false;
      state.won = false;
    }
  }

  function exitTraining() {
    leaveTraining();
    saveGame();
    render();
  }

  function trainNext() {
    const step = TRAIN_STEPS[state.train.step];
    if (!step) return;
    const { exact, near } = score(step.guess, state.code);
    state.guesses.push({ guess: step.guess.slice(), exact, near });
    state.train.step += 1;
    if (exact === state.code.length) { state.over = true; state.won = true; }
    saveTrain();
    // The explanation is the whole point of the training — it has to be
    // announced, not only printed.
    announce(t(TRAIN_STEPS[state.train.step - 1].read));
    render();
  }

  /* The hint is a deduction, not a guess: every combination that still fits
     the feedback the player has seen is enumerated, and only what all of them
     agree on gets reported. */
  function codeFromNumber(n, pegs, colors) {
    const out = new Array(pegs);
    for (let i = pegs - 1; i >= 0; i--) { out[i] = n % colors; n = Math.floor(n / colors); }
    return out;
  }

  function scoreFast(guess, code) {
    let exact = 0;
    const used = new Array(code.length).fill(false);
    for (let i = 0; i < code.length; i++) {
      if (guess[i] === code[i]) { exact++; used[i] = true; }
    }
    let near = 0;
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === code[i]) continue;
      for (let j = 0; j < code.length; j++) {
        if (!used[j] && code[j] === guess[i]) { near++; used[j] = true; break; }
      }
    }
    return { exact, near };
  }

  function candidateCodes() {
    const { pegs, colors } = state.settings;
    const out = [];
    const total = Math.pow(colors, pegs);
    for (let n = 0; n < total; n++) {
      const cand = codeFromNumber(n, pegs, colors);
      let fits = true;
      for (const g of state.guesses) {
        const s = scoreFast(g.guess, cand);
        if (s.exact !== g.exact || s.near !== g.near) { fits = false; break; }
      }
      if (fits) out.push(cand);
    }
    return out;
  }

  function analyze() {
    const cands = candidateCodes();
    const { pegs, colors } = state.settings;
    const facts = [];
    if (cands.length) {
      for (let p = 0; p < pegs; p++) {
        const v = cands[0][p];
        if (cands.every((c) => c[p] === v)) facts.push({ type: 'pos', p, color: v });
      }
      for (let c = 0; c < colors; c++) {
        let min = Infinity, max = 0;
        for (const cand of cands) {
          let k = 0;
          for (const x of cand) if (x === c) k++;
          if (k < min) min = k;
          if (k > max) max = k;
        }
        if (max === 0) facts.push({ type: 'absent', color: c });
        else if (min === max) facts.push({ type: 'count', color: c, k: min });
        else if (min > 0) facts.push({ type: 'present', color: c });
        else facts.push({ type: 'open', color: c });
      }
    }
    return { cands, facts };
  }

  function buildHints() {
    if (!state.guesses.length) return [t('train.hintFirst')];
    const { cands, facts } = analyze();
    const order = { pos: 0, count: 1, absent: 2, present: 3, open: 4 };
    const hints = [];
    if (cands.length === 1) {
      hints.push(t('train.hintSolution', { code: cands[0].map(colorName).join(' ') }));
    }
    for (const f of facts.slice().sort((a, b) => order[a.type] - order[b.type])) {
      if (f.type === 'pos') hints.push(t('train.hintPos', { n: f.p + 1, color: colorName(f.color) }));
      else if (f.type === 'absent') hints.push(t('train.hintAbsent', { color: colorName(f.color) }));
      else if (f.type === 'present') hints.push(t('train.hintPresent', { color: colorName(f.color) }));
      else if (f.type === 'count') hints.push(t('train.hintCount', { color: colorName(f.color), k: f.k }));
      else if (f.type === 'open') hints.push(t('train.hintOpen', { color: colorName(f.color) }));
    }
    hints.push(cands.length === 1 ? t('train.hintOne') : t('train.hintMore', { n: cands.length }));
    return hints;
  }

  function showNextHint() {
    // Every new move changes the facts — the hint starts over with the most
    // valuable one instead of continuing somewhere in the middle.
    if (state.hintFor !== state.guesses.length) {
      state.hintFor = state.guesses.length;
      state.hintIndex = 0;
      state.hintSeen = [];
    }
    const hints = buildHints();
    if (!hints.length) return;
    // A fact that has not been shown for this history comes first; once every
    // fact has been mentioned, the list starts again from the top.
    let idx = hints.findIndex((h) => !state.hintSeen.includes(h));
    if (idx === -1) idx = state.hintIndex % hints.length;
    state.hintText = hints[idx];
    state.hintSeen.push(hints[idx]);
    state.hintIndex = idx + 1;
    announce(state.hintText);
    renderTrainer();
    syncModeTabs();
  }

  function renderTrainer() {
    const train = state.mode === 'train';
    $('#trainer-start').classList.toggle('hidden', train);
    $('#trainer-hint').classList.toggle('hidden', train);
    $('#trainer-next').classList.toggle('hidden', !train || state.over);
    $('#trainer-back').classList.toggle('hidden', !train);
    const text = $('#trainer-text');
    if (train) {
      text.textContent = state.train.step === 0
        ? t('train.intro')
        : t(TRAIN_STEPS[state.train.step - 1].read);
    } else {
      text.textContent = state.hintText || t('train.hintIdle');
    }
  }

  // ------------------------------------------------------------ rendering ---

  function pegSvg(index) {
    const c = COLORS[index];
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="${c.hex}" stroke="rgba(20,23,30,.22)" stroke-width="1.2" stroke-linejoin="round">${SHAPES[c.shape]}</g></svg>`;
  }

  function fbSvg(kind) {
    if (kind === 'exact') return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.8"/></svg>`;
    if (kind === 'near') return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3.2 A8.8 8.8 0 0 0 12 20.8 Z"/><circle cx="12" cy="12" r="8.8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
    // A cross, not an empty circle: "nothing here" was impossible to read.
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7.5 7.5 L16.5 16.5 M16.5 7.5 L7.5 16.5"/></svg>`;
  }

  function feedbackMarkers(exact, near, total) {
    const out = [];
    for (let i = 0; i < exact; i++) out.push(`<span class="fb fb-exact">${fbSvg('exact')}</span>`);
    for (let i = 0; i < near; i++) out.push(`<span class="fb fb-near">${fbSvg('near')}</span>`);
    for (let i = 0; i < total - exact - near; i++) out.push(`<span class="fb fb-wrong">${fbSvg('wrong')}</span>`);
    return out.join('');
  }

  function colorName(i) { return t('color.' + COLORS[i].id); }
  function shapeName(i) { return t('shape.' + COLORS[i].shape); }

  /* Dates are formatted for the reader, not for the machine: the ISO string
     stays the identifier of the daily puzzle, the display uses the locale. */
  function formatDate(dateStr) {
    const [y, m, d] = String(dateStr).split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    try {
      return new Intl.DateTimeFormat(state.lang === 'de' ? 'de-DE' : 'en-GB',
        { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(y, m - 1, d));
    } catch {
      return dateStr;
    }
  }

  function plural(key, n) {
    return t(n === 1 ? key + '1' : key + 'N', { n });
  }

  function describe(guess, exact, near) {
    const total = guess.length;
    const parts = [];
    if (exact) parts.push(plural('status.exact', exact));
    if (near) parts.push(plural('status.near', near));
    const wrong = total - exact - near;
    if (wrong) parts.push(plural('status.wrong', wrong));
    return parts.join(', ');
  }

  function renderBoard() {
    const board = $('#board');
    const rows = [];
    state.guesses.forEach((g, idx) => {
      const pegs = g.guess.map((c) => `<span class="peg">${pegSvg(c)}</span>`).join('');
      const fb = feedbackMarkers(g.exact, g.near, g.guess.length);
      const wrong = g.guess.length - g.exact - g.near;
      const count = `${g.exact}● ${g.near}◐ ${wrong}✗`;
      const colors = g.guess.map(colorName).join(', ');
      rows.push(
        `<li class="guess-row${state.won && idx === state.guesses.length - 1 ? ' win' : ''}">
           <span class="guess-pegs">${pegs}</span>
           <span class="guess-feedback">${fb}<span class="guess-count">${count}</span></span>
           <span class="sr-only">${t('guess.summary', { n: idx + 1, colors, detail: describe(g.guess, g.exact, g.near) })}</span>
         </li>`);
    });

    // The row the player is filling in. The remaining budget is stated once,
    // in the move counter — ghost rows for every remaining move would only
    // push the page down.
    // The training has its own controls, so it gets no input row.
    if (!state.over && state.mode !== 'train') {
      rows.push(
        `<li class="guess-row current">
           <span class="guess-pegs" id="current-slots" role="group" aria-label="Eingabe"></span>
           <span class="guess-feedback">
             <button type="button" id="submit-guess" class="primary-btn">${t('action.submit')}</button>
           </span>
         </li>`);
    }

    board.innerHTML = rows.join('');
  }

  function renderSlots(container, editable) {
    const slots = [];
    for (let i = 0; i < state.settings.pegs; i++) {
      const c = state.current[i];
      const cls = ['slot'];
      if (c !== null && c !== undefined) cls.push('filled');
      if (editable && i === state.slot) cls.push('active');
      const label = c === null || c === undefined
        ? t('slot.empty', { n: i + 1 })
        : t('slot.filled', { n: i + 1, color: colorName(c), shape: shapeName(c) });
      const inner = (c === null || c === undefined) ? '' : `<span class="peg">${pegSvg(c)}</span>`;
      slots.push(`<button type="button" class="${cls.join(' ')}" data-index="${i}" aria-label="${escapeAttr(label)}">${inner}</button>`);
    }
    container.innerHTML = slots.join('');
  }

  function renderPalette() {
    const wrap = $('#palette');
    const n = state.settings.colors;
    const btns = [];
    for (let i = 0; i < n; i++) {
      const label = `${colorName(i)}, ${shapeName(i)}, Taste ${i + 1}`;
      btns.push(`<button type="button" class="palette-btn" data-color="${i}" aria-label="${escapeAttr(label)}"><span class="peg">${pegSvg(i)}</span></button>`);
    }
    wrap.innerHTML = btns.join('');
  }

  function renderSettings() {
    const set = (id, options, current) => {
      const el = $(id);
      el.innerHTML = options.map((o) =>
        `<button type="button" data-value="${o}" aria-pressed="${o === current}">${o}</button>`).join('');
    };
    set('#set-pegs', [4, 5, 6], state.settings.pegs);
    set('#set-colors', [5, 6], state.settings.colors);
    set('#set-guesses', [8, 10, 12, 15], state.settings.guesses);
  }

  function renderLegend() {
    const legend = $('#legend');
    const items = [
      ['exact', 'legend.exact'],
      ['near', 'legend.near'],
      ['wrong', 'legend.wrong'],
    ];
    legend.innerHTML = items.map(([kind, key]) =>
      `<span class="legend-item"><span class="fb fb-${kind}">${fbSvg(kind)}</span><span data-i18n="${key}">${t(key)}</span></span>`).join('');
  }

  function renderHeader() {
    const isDaily = state.mode === 'daily';
    const title = $('#round-title');
    const sub = $('#round-sub');

    if (state.mode === 'train') {
      title.textContent = `${t('train.title')} · ${t('train.step', { n: Math.min(state.train.step + 1, TRAIN_STEPS.length), max: TRAIN_STEPS.length })}`;
      sub.textContent = state.train.step < TRAIN_STEPS.length
        ? t(TRAIN_STEPS[state.train.step].goal)
        : t('train.done');
      $('#move-count').hidden = true;
      $('#streak-wrap').hidden = true;
      return;
    }

    if (isDaily) title.textContent = `${t('daily.title')} · ${formatDate(state.date)}`;
    else if (state.mode === 'solo') title.textContent = t('solo.title');
    else title.textContent = t('duo.guessTitle');

    // The plain-language result of the last move is the single most important
    // piece of feedback — it must be readable without decoding the markers.
    const last = state.guesses[state.guesses.length - 1];
    if (state.over) {
      sub.textContent = '';
    } else if (last) {
      sub.textContent = describe(last.guess, last.exact, last.near);
    } else {
      sub.textContent = t('status.guess', { n: state.guesses.length + 1, max: state.settings.guesses });
    }

    $('#move-count').hidden = false;
    $('#move-count').textContent = state.over
      ? t('status.guess', { n: state.guesses.length, max: state.settings.guesses })
      : t('status.guess', { n: state.guesses.length + 1, max: state.settings.guesses });

    const streakWrap = $('#streak-wrap');
    if (isDaily) {
      const rec = loadDaily();
      streakWrap.hidden = false;
      $('#streak-value').textContent = String(rec.streak || 0);
    } else {
      streakWrap.hidden = true;
    }
  }

  function render() {
    // Keep the keyboard focus on the slot the player is editing: every render
    // replaces the buttons, so without this the focus would drop to the body.
    const focused = document.activeElement;
    const focusIndex = focused && focused.dataset && focused.dataset.index !== undefined
      ? Number(focused.dataset.index) : null;

    const isDuo = state.mode === 'duo';
    const setup = $('#duo-setup');
    const handover = $('#duo-handover');
    const game = $('#game');

    setup.classList.toggle('hidden', !(isDuo && state.phase === 'setup'));
    handover.classList.toggle('hidden', !(isDuo && state.phase === 'handover'));
    game.classList.toggle('hidden', isDuo && state.phase !== 'guess');
    $('#settings-panel').classList.toggle('hidden', state.mode !== 'solo' || state.over);

    if (isDuo && state.phase === 'setup') {
      renderSlots($('#duo-slots'), true);
    }

    if (!game.classList.contains('hidden')) {
      renderHeader();
      renderBoard();
      if (!state.over && state.mode !== 'train') {
        renderSlots($('#current-slots'), true);
        const submit = $('#submit-guess');
        if (submit) submit.disabled = state.current.some((c) => c === null);
      }
      renderPalette();
      renderSettings();
      $('#palette-panel').classList.toggle('hidden', state.mode === 'train');
      $('#result-panel').classList.toggle('hidden', !state.over);
      $('#result-share').classList.toggle('hidden', state.mode === 'train');
      if (state.over) renderResult();
    }

    renderTrainer();

    if (focusIndex !== null) {
      const scope = (isDuo && state.phase === 'setup') ? '#duo-slots' : '#current-slots';
      const el = $(`${scope} [data-index="${focusIndex}"]`);
      if (el) el.focus();
    }
  }

  function renderResult() {
    const title = $('#result-title');
    const text = $('#result-text');
    if (state.won) {
      title.textContent = t('status.win');
      text.textContent = t('status.winSub', { n: state.guesses.length });
    } else {
      title.textContent = t('status.lose');
      text.textContent = t('status.loseSub', { code: state.code.map(colorName).join(' ') });
    }
    $('#result-code').innerHTML = state.code.map((c) => `<span class="peg">${pegSvg(c)}</span>`).join('');
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  // --------------------------------------------------------------- actions ---

  function announce(text) { $('#live').textContent = text; }

  function setColor(slotIndex, colorIndex, advance = true) {
    if (state.over) return;
    if (colorIndex < 0 || colorIndex >= state.settings.colors) return;
    state.current[slotIndex] = colorIndex;
    // Choosing a colour moves on to the next slot; cycling with the arrow
    // keys must not, or the cursor would run away from the field being edited.
    if (advance) state.slot = Math.min(slotIndex + 1, state.settings.pegs - 1);
    render();
    saveGame();
  }

  function clearSlot(slotIndex) {
    if (state.over) return;
    state.current[slotIndex] = null;
    state.slot = slotIndex;
    render();
    saveGame();
  }

  function submitGuess() {
    if (state.over) return;
    if (state.current.some((c) => c === null)) { announce(t('announce.incomplete')); return; }
    const guess = state.current.slice();
    const { exact, near } = score(guess, state.code);
    state.guesses.push({ guess, exact, near });
    // The facts the coach can deduce change with every move.
    state.hintText = '';
    const detail = describe(guess, exact, near);
    announce(t('announce.guess', { n: state.guesses.length, detail }));

    if (exact === state.settings.pegs) {
      state.over = true;
      state.won = true;
      announce(t('announce.win', { n: state.guesses.length }));
      if (state.mode === 'daily') recordDailyWin();
    } else if (state.guesses.length >= state.settings.guesses) {
      state.over = true;
      state.won = false;
      announce(t('announce.lose', { code: state.code.map(colorName).join(' ') }));
    } else {
      state.current = new Array(state.settings.pegs).fill(null);
      state.slot = 0;
    }
    render();
    saveGame();
  }

  // ------------------------------------------------------------ persistence ---

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }

  function saveJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
  }

  function saveSettings() { saveJson(STORE.settings, state.settings); }
  function loadSettings() {
    const s = loadJson(STORE.settings, null);
    if (s && s.pegs && s.colors && s.guesses) state.settings = s;
  }

  function loadDaily() { return loadJson(STORE.daily, { streak: 0, last: null }); }

  function recordDailyWin() {
    const rec = loadDaily();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = todayISO(yesterday);
    rec.streak = rec.last === y ? (rec.streak || 0) + 1 : 1;
    rec.last = state.date;
    saveJson(STORE.daily, rec);
  }

  /* The whole game is kept in localStorage. Losing the tab, a reload or a
     detour to the README must never cost the player their move. */
  function saveGame() {
    saveJson(STORE.game, {
      mode: state.mode, phase: state.phase, code: state.code, guesses: state.guesses,
      current: state.current, slot: state.slot, over: state.over, won: state.won,
      settings: state.settings, date: state.date, ts: Date.now(),
    });
  }

  function loadGame() {
    const g = loadJson(STORE.game, null);
    return g && g.mode ? g : null;
  }

  // ----------------------------------------------------------------- share ---

  function shareText() {
    const head = state.mode === 'daily'
      ? `Farbcode ${state.date}`
      : `Farbcode ${state.mode === 'duo' ? 'two players' : 'free play'}`;
    const rows = state.guesses.map((g) => {
      const marks = '●'.repeat(g.exact) + '◐'.repeat(g.near) + '○'.repeat(g.guess.length - g.exact - g.near);
      return marks;
    });
    const tail = state.won ? `${state.guesses.length}/${state.settings.guesses}` : `X/${state.settings.guesses}`;
    return [head, `…${tail}… #${codeHash(state.code)}`, ...rows].join('\n');
  }

  function shareLink() {
    const payload = {
      m: state.mode,
      c: state.code,
      g: state.guesses.map((g) => [g.guess, g.exact, g.near]),
      d: state.date,
      p: state.settings.pegs,
      n: state.settings.colors,
      t: state.settings.guesses,
    };
    const base = location.origin + location.pathname;
    return `${base}#g=${b64urlEncode(JSON.stringify(payload))}`;
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
  }

  async function doShare(kind) {
    const out = $('#share-output');
    if (kind === 'result') {
      out.textContent = shareText();
    } else {
      out.textContent = shareLink();
    }
    out.hidden = false;
    const ok = await copyToClipboard(out.textContent);
    // The confirmation has to reach a screen reader too — a hidden span
    // appended to the body is invisible to it.
    announce(ok ? t('share.copied') : t('share.failed'));
  }

  // ---------------------------------------------------------- hash restore ---

  function restoreFromHash() {
    const hash = location.hash;
    if (!hash.startsWith('#g=')) return false;
    try {
      const data = JSON.parse(b64urlDecode(hash.slice(3)));
      if (!data || !Array.isArray(data.c)) return false;
      state.mode = data.m || 'solo';
      state.code = data.c;
      state.guesses = (data.g || []).map(([g, e, n]) => ({ guess: g, exact: e, near: n }));
      state.date = data.d || todayISO();
      state.settings = { pegs: data.p || 4, colors: data.n || 6, guesses: data.t || 12 };
      state.current = new Array(state.settings.pegs).fill(null);
      state.slot = 0;
      state.phase = 'guess';
      state.over = state.guesses.length >= state.settings.guesses;
      state.won = state.over && state.guesses.some((g) => g.exact === state.settings.pegs);
      return true;
    } catch {
      return false;
    }
  }

  // -------------------------------------------------------------- language ---

  function applyLanguage() {
    document.documentElement.lang = state.lang;
    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $('#lang-label').textContent = state.lang === 'de' ? 'EN' : 'DE';
    render();
  }

  // ----------------------------------------------------------------- events ---

  function bind() {
    $('#lang-toggle').addEventListener('click', () => {
      state.lang = state.lang === 'de' ? 'en' : 'de';
      try { localStorage.setItem(STORE.lang, state.lang); } catch { /* ignore */ }
      applyLanguage();
    });

    $$('.mode-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        leaveTraining();
        if (mode === 'duo') {
          state.mode = 'duo';
          state.phase = 'setup';
          state.code = [];
          state.guesses = [];
          state.current = new Array(state.settings.pegs).fill(null);
          state.slot = 0;
          state.over = false;
          state.won = false;
          render();
          saveGame();
        } else {
          newGame(mode);
        }
        syncModeTabs();
      });
    });


    $('#duo-confirm').addEventListener('click', () => {
      if (state.current.some((c) => c === null)) { announce(t('announce.incomplete')); return; }
      state.code = state.current.slice();
      state.phase = 'handover';
      announce(t('announce.handover'));
      render();
      saveGame();
    });

    $('#duo-handover-cta').addEventListener('click', () => {
      state.phase = 'guess';
      state.current = new Array(state.settings.pegs).fill(null);
      state.slot = 0;
      render();
      saveGame();
    });

    $('#result-new').addEventListener('click', () => {
      if (state.mode === 'train') { leaveTraining(); newGame('daily'); }
      else if (state.mode === 'daily') newGame('daily');
      else if (state.mode === 'solo') newGame('solo');
      else { state.phase = 'setup'; state.code = []; state.guesses = []; state.current = new Array(state.settings.pegs).fill(null); state.slot = 0; state.over = false; render(); }
    });

    $('#palette').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-color]');
      if (!btn) return;
      setColor(state.slot, Number(btn.dataset.color));
    });

    // The board is re-rendered on every move, so its buttons are new elements
    // each time — the listeners live on the static container, not on the button.
    $('#board').addEventListener('click', (e) => {
      if (e.target.closest('#submit-guess')) { submitGuess(); return; }
      const btn = e.target.closest('#current-slots [data-index]');
      if (!btn) return;
      state.slot = Number(btn.dataset.index);
      render();
      focusSlot(state.slot);
    });

    $('#duo-slots').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-index]');
      if (!btn) return;
      state.slot = Number(btn.dataset.index);
      render();
    });

    $('#share-result').addEventListener('click', () => doShare('result'));
    $('#result-share').addEventListener('click', () => doShare('result'));
    $('#share-puzzle').addEventListener('click', () => doShare('puzzle'));

    $('#trainer-start').addEventListener('click', startTraining);
    $('#trainer-next').addEventListener('click', trainNext);
    $('#trainer-back').addEventListener('click', exitTraining);
    $('#trainer-hint').addEventListener('click', showNextHint);

    $('#apply-settings').addEventListener('click', () => {
      const pegs = Number($('#set-pegs [aria-pressed="true"]').dataset.value);
      const colors = Number($('#set-colors [aria-pressed="true"]').dataset.value);
      const guesses = Number($('#set-guesses [aria-pressed="true"]').dataset.value);
      state.settings = { pegs, colors, guesses };
      saveSettings();
      newGame('solo');
    });

    [['#set-pegs', 'pegs'], ['#set-colors', 'colors'], ['#set-guesses', 'guesses']].forEach(([sel, key]) => {
      $(sel).addEventListener('click', (e) => {
        const btn = e.target.closest('[data-value]');
        if (!btn) return;
        state.settings[key] = Number(btn.dataset.value);
        renderSettings();
      });
    });

    document.addEventListener('keydown', onKeydown);
  }

  function onKeydown(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target;
    const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
    if (typing) return;

    const key = e.key;
    const inDuoSetup = state.mode === 'duo' && state.phase === 'setup';
    const canPlay = state.mode !== 'duo' || state.phase === 'guess';
    if (!canPlay) return;

    if (key >= '1' && key <= '9') {
      const idx = Number(key) - 1;
      if (idx < state.settings.colors) {
        e.preventDefault();
        const slot = inDuoSetup ? state.slot : state.slot;
        setColor(slot, idx);
        focusSlot(slot);
      }
      return;
    }

    if (key === 'ArrowRight' || key === 'ArrowLeft') {
      e.preventDefault();
      const delta = key === 'ArrowRight' ? 1 : -1;
      state.slot = (state.slot + delta + state.settings.pegs) % state.settings.pegs;
      render();
      focusSlot(state.slot);
      return;
    }

    if (key === 'ArrowUp' || key === 'ArrowDown') {
      e.preventDefault();
      const cur = state.current[state.slot];
      const base = cur === null ? -1 : cur;
      const next = (base + (key === 'ArrowUp' ? 1 : -1) + state.settings.colors + 1) % state.settings.colors;
      setColor(state.slot, next, false);
      focusSlot(state.slot);
      return;
    }

    if (key === 'Backspace' || key === 'Delete') {
      e.preventDefault();
      clearSlot(state.slot);
      focusSlot(state.slot);
      return;
    }

    if (key === 'Enter') {
      e.preventDefault();
      if (inDuoSetup) $('#duo-confirm').click();
      else submitGuess();
    }
  }

  function focusSlot(index) {
    const scope = (state.mode === 'duo' && state.phase === 'setup') ? '#duo-slots' : '#current-slots';
    const el = $(`${scope} [data-index="${index}"]`);
    if (el) el.focus();
  }

  function syncModeTabs() {
    $$('.mode-tab').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
  }

  // ------------------------------------------------------------------ init ---

  // Debug hook: lets tests (and curious players) inspect the pure game rules
  // without touching the DOM. Everything here is already visible in the page
  // source — this is a convenience, not a secret.
  window.farbcode = {
    get state() { return state; },
    score,
    scoreFast,
    dailyCode,
    randomCode,
    codeHash,
    candidateCodes,
    analyze,
    buildHints,
    render,
    COLORS,
    TRAIN_CODE,
    TRAIN_STEPS,
  };

  function init() {
    const stored = (() => { try { return localStorage.getItem(STORE.lang); } catch { return null; } })();
    state.lang = stored === 'en' || stored === 'de' ? stored : (navigator.language || '').startsWith('de') ? 'de' : 'en';
    loadSettings();

    const restored = restoreFromHash();
    if (!restored) {
      // A saved game wins over a fresh one — the player may only be looking
      // around (README, another tab) and must not lose their move.
      const saved = loadGame();
      const today = todayISO();
      const usable = saved && (saved.mode === 'daily' ? saved.date === today : !saved.over);
      if (usable) {
        state.mode = saved.mode;
        state.phase = saved.phase || 'guess';
        state.code = saved.code || [];
        state.guesses = saved.guesses || [];
        state.settings = saved.settings || state.settings;
        state.current = (saved.current || []).slice(0, state.settings.pegs);
        while (state.current.length < state.settings.pegs) state.current.push(null);
        state.slot = saved.slot || 0;
        state.over = !!saved.over;
        state.won = !!saved.won;
        state.date = saved.date || today;
      } else {
        state.date = todayISO();
        state.mode = 'daily';
        state.settings = { pegs: 4, colors: 6, guesses: 12 };
        state.code = dailyCode(state.date, 4, 6);
        state.current = new Array(4).fill(null);
      }
    }

    // A training in progress is resumed before a fresh game — the running
    // game it was started from is still stored untouched underneath it.
    if (!restored) {
      const train = loadJson(STORE.train, null);
      if (train && train.returnTo) {
        state.train.step = train.step || 0;
        state.train.returnTo = train.returnTo;
        state.mode = 'train';
        state.phase = 'guess';
        state.code = TRAIN_CODE.slice();
        state.settings = { pegs: TRAIN_CODE.length, colors: 6, guesses: 12 };
        state.guesses = TRAIN_STEPS.slice(0, state.train.step).map((s) => {
          const { exact, near } = score(s.guess, TRAIN_CODE);
          return { guess: s.guess.slice(), exact, near };
        });
        state.current = new Array(TRAIN_CODE.length).fill(null);
        state.slot = 0;
        state.over = state.train.step >= TRAIN_STEPS.length;
        state.won = state.over;
      }
    }

    // inline feedback legend in the "how to play" list
    $$('[data-fb]').forEach((el) => {
      const kind = el.dataset.fb;
      el.innerHTML = `<span class="fb fb-${kind}">${fbSvg(kind)}</span>`;
    });

    applyLanguage();
    renderLegend();
    syncModeTabs();
    bind();
    render();

    // The game is stored from the first second on — closing the tab before
    // the first move must not cost anything either. A resumed training keeps
    // the stored game untouched; it belongs to the game underneath.
    if (state.mode !== 'train') saveGame();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
