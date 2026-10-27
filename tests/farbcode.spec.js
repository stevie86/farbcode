/* Farbcode — Testsuite.
 *
 * Prüft die Spielregeln, die das Spiel narrativ behaupten, gegen das, was der
 * Code tatsächlich tut. Die wichtigste Prüfung ist die Hausregel: jede Farbe
 * kommt höchstens einmal vor — im Code und in jedem Tipp.
 *
 * Starten:  npm install && npx playwright install chromium && npm test
 * Oder direkt: node tests/farbcode.spec.js
 */
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function loadPlaywright() {
  const candidates = [
    'playwright',
    '@playwright/test',
    path.join(process.env.HOME || '', '.local/share/mise/installs/npm-playwright/latest/node_modules/playwright'),
  ];
  for (const c of candidates) {
    try { return require(c); } catch { /* next */ }
  }
  console.error('\nPlaywright nicht gefunden.\n  npm install && npx playwright install chromium\n');
  process.exit(2);
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(fs.readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

let passed = 0;
const failures = [];

async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures.push({ name, err });
    console.log(`  ✗ ${name}\n      ${err.message}`);
  }
}

async function main() {
  const { chromium } = loadPlaywright();
  const { server, port } = await serve();
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const state = () => page.evaluate(() => JSON.parse(JSON.stringify(window.farbcode.state)));
  const reset = async () => {
    await page.goto(`${base}/index.html`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => !!window.farbcode);
    await page.waitForTimeout(120);
  };
  const live = () => page.textContent('#live');

  console.log('\nFarbcode — Hausregel: jede Farbe höchstens einmal\n');

  await check('Tagescode enthält keine Doppelungen (40 Tage)', async () => {
    await reset();
    const codes = await page.evaluate(() => {
      const out = [];
      for (let d = 1; d <= 40; d++) {
        const date = `2026-01-${String(d).padStart(2, '0')}`;
        out.push(window.farbcode.dailyCode(date, 4, 6));
      }
      return out;
    });
    for (const c of codes) {
      assert.strictEqual(new Set(c).size, c.length, `Tagescode mit Doppelung: ${c.join(',')}`);
    }
  });

  await check('Freies Spiel: der Code hat keine Doppelungen (200 Ziehungen)', async () => {
    await reset();
    const codes = await page.evaluate(() => {
      const out = [];
      for (let i = 0; i < 200; i++) out.push(window.farbcode.randomCode(4, 6));
      return out;
    });
    for (const c of codes) {
      assert.strictEqual(new Set(c).size, c.length, `Code mit Doppelung: ${c.join(',')}`);
    }
  });

  await check('Tagescode ist deterministisch (gleiches Datum → gleicher Code)', async () => {
    await reset();
    const same = await page.evaluate(() => {
      const a = window.farbcode.dailyCode('2026-10-27', 4, 6);
      const b = window.farbcode.dailyCode('2026-10-27', 4, 6);
      return a.join() === b.join();
    });
    assert.ok(same, 'gleiches Datum ergab zwei verschiedene Codes');
  });

  await check('Tagescode ist festgenagelt (Seed-Version v2)', async () => {
    await reset();
    // Regression: eine Änderung am Generator darf ein veröffentlichtes
    // Rätsel nicht still verschieben — dafür gibt es die Seed-Version.
    const codes = await page.evaluate(() => ({
      a: window.farbcode.dailyCode('2026-10-27', 4, 6),
      b: window.farbcode.dailyCode('2026-10-28', 4, 6),
    }));
    assert.strictEqual(codes.a.join(), '4,2,3,5', `27.10. war ${codes.a.join()}`);
    assert.strictEqual(codes.b.join(), '1,2,0,5', `28.10. war ${codes.b.join()}`);
  });

  await check('Pfeil runter von der ersten Farbe springt auf die letzte (kein No-op)', async () => {
    await reset();
    await page.keyboard.press('1');            // Feld 0 = Rot, Cursor wandert auf Feld 1
    await page.keyboard.press('ArrowLeft');    // zurück auf Feld 0
    await page.keyboard.press('ArrowDown');    // Runter von Farbe 0
    const s = await state();
    assert.strictEqual(s.current[0], 5, `erwartet Farbe 5, war ${s.current[0]}`);
  });

  await check('Pfeil runter von der letzten Farbe landet auf der vorletzten', async () => {
    await reset();
    await page.keyboard.press('1');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');    // 0 → 5
    await page.keyboard.press('ArrowDown');    // 5 → 4
    const s = await state();
    assert.strictEqual(s.current[0], 4, `erwartet Farbe 4, war ${s.current[0]}`);
  });

  await check('Pfeil hoch von der letzten Farbe läuft auf die erste', async () => {
    await reset();
    await page.keyboard.press('1');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');    // 0 → 5
    await page.keyboard.press('ArrowUp');      // 5 → 0
    const s = await state();
    assert.strictEqual(s.current[0], 0, `erwartet Farbe 0, war ${s.current[0]}`);
  });

  await check('Pfeil auf leerem Feld: hoch = erste Farbe, runter = letzte', async () => {
    await reset();
    await page.keyboard.press('ArrowUp');
    let s = await state();
    assert.strictEqual(s.current[0], 0, `hoch erwartet 0, war ${s.current[0]}`);
    await page.keyboard.press('Backspace');
    await page.keyboard.press('ArrowDown');
    s = await state();
    assert.strictEqual(s.current[0], 5, `runter erwartet 5, war ${s.current[0]}`);
  });

  await check('Klick auf eine bereits benutzte Farbe wird abgelehnt', async () => {
    await reset();
    await page.keyboard.press('1');                    // Feld 0 = Rot
    // force: true, weil die Palette die Farbe als "schon vergeben" markiert
    // (aria-disabled) — der Klick kommt beim Menschen trotzdem an.
    await page.click('#palette [data-color="0"]', { force: true });
    const s = await state();
    assert.strictEqual(s.current[1], null, 'Feld 1 hätte Rot bekommen');
    assert.ok(/schon vergeben|already used/.test(await live()), `keine Ansage: "${await live()}"`);
  });

  await check('Tastatur auf eine bereits benutzte Farbe wird abgelehnt', async () => {
    await reset();
    await page.keyboard.press('1');
    await page.keyboard.press('1');
    const s = await state();
    assert.strictEqual(s.current[1], null, 'Feld 1 hätte Rot bekommen');
  });

  await check('Die Palette markiert benutzte Farben', async () => {
    await reset();
    await page.keyboard.press('1');
    const cls = await page.getAttribute('#palette [data-color="0"]', 'class');
    const aria = await page.getAttribute('#palette [data-color="0"]', 'aria-disabled');
    assert.ok(/is-used/.test(cls), `Klasse: ${cls}`);
    assert.strictEqual(aria, 'true');
  });

  await check('Pfeiltasten überspringen benutzte Farben', async () => {
    await reset();
    await page.keyboard.press('1');            // Feld 0 = Rot, Cursor auf Feld 1
    await page.keyboard.press('ArrowUp');      // von leer: 0 ist belegt → nächste freie
    const s = await state();
    assert.notStrictEqual(s.current[1], 0, 'Rot wurde erneut gesetzt');
    assert.strictEqual(s.current[1], 1, `erwartet Farbe 1, war ${s.current[1]}`);
  });

  await check('Doppelte Farbe im Zug wird nicht angenommen', async () => {
    await reset();
    await page.keyboard.press('1');            // Feld 0 = Rot, Cursor auf Feld 1
    await page.keyboard.press('2');            // Feld 1 = Blau, Cursor auf Feld 2
    await page.keyboard.press('1');            // Rot ist auf Feld 0 vergeben → abgelehnt
    const s = await state();
    assert.strictEqual(s.current[2], null, 'Feld 2 hätte Rot bekommen');
    assert.strictEqual(s.current[0], 0, 'Feld 0 muss Rot behalten');
  });

  await check('Die eigene Farbe des Feldes bleibt setzbar', async () => {
    await reset();
    await page.keyboard.press('1');            // Feld 0 = Rot
    await page.keyboard.press('ArrowLeft');    // zurück auf Feld 0
    await page.keyboard.press('1');            // Rot auf Feld 0 selbst: erlaubt
    const s = await state();
    assert.strictEqual(s.current[0], 0, 'Feld 0 hat seine eigene Farbe verloren');
  });

  await check('Hinweis-Kandidaten sind Permutationen (360 statt 1296)', async () => {
    await reset();
    const info = await page.evaluate(() => {
      const c = window.farbcode.candidateCodes();
      return { count: c.length, allDistinct: c.every((x) => new Set(x).size === x.length) };
    });
    assert.strictEqual(info.count, 360, `erwartet 360, war ${info.count}`);
    assert.ok(info.allDistinct, 'Kandidaten enthalten Doppelungen');
  });

  await check('Der wahre Code bleibt immer unter den Kandidaten', async () => {
    await reset();
    await page.keyboard.press('1');
    await page.keyboard.press('2');
    await page.keyboard.press('3');
    await page.keyboard.press('4');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    const ok = await page.evaluate(() => {
      const f = window.farbcode;
      const c = f.candidateCodes();
      return c.some((x) => x.join() === f.state.code.join());
    });
    assert.ok(ok, 'der wahre Code tauchte nicht unter den Kandidaten auf');
  });

  await check('Altes Spiel ohne Regel-Feld bleibt bei der alten Wertung', async () => {
    await page.goto(`${base}/index.html`);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('farbcode.game', JSON.stringify({
        mode: 'solo', code: [0, 0, 1, 2], guesses: [], current: [null, null, null, null],
        slot: 0, over: false, won: false, settings: { pegs: 4, colors: 6, guesses: 12 },
        date: '2026-01-01',
      }));
    });
    await page.reload();
    await page.waitForFunction(() => !!window.farbcode);
    await page.waitForTimeout(150);
    const s = await state();
    assert.strictEqual(s.rules, 'repeat', `Regel war ${s.rules}`);
    await page.keyboard.press('1');
    await page.keyboard.press('1');
    const s2 = await state();
    assert.strictEqual(s2.current[1], 0, 'im alten Spiel muss Rot doppelt erlaubt sein');
    const consistent = await page.evaluate(() => {
      const f = window.farbcode;
      return f.candidateCodes().some((x) => x.join() === f.state.code.join());
    });
    assert.ok(consistent, 'der alte Code fehlt in der Kandidatenliste');
  });

  await check('Der Trainer läuft und erklärt die neue Regel', async () => {
    await reset();
    await page.click('#trainer-start');
    await page.waitForTimeout(150);
    await page.click('#trainer-next');
    await page.waitForTimeout(150);
    const read = await page.textContent('#trainer-panel');
    assert.ok(/once| einmal/.test(read), `Trainertext: ${read.slice(0, 120)}`);
    const code = await page.evaluate(() => window.farbcode.state.code);
    assert.strictEqual(new Set(code).size, code.length, 'Trainer-Code hat Doppelungen');
  });

  await check('Zu zweit: der Code darf keine Doppelungen enthalten', async () => {
    await reset();
    await page.click('.mode-tab[data-mode="duo"]');
    await page.waitForTimeout(150);
    await page.keyboard.press('1');
    await page.keyboard.press('1');
    const s = await state();
    assert.strictEqual(s.current[1], null, 'im Code-Setup war Rot doppelt erlaubt');
  });

  await check('Einstellungen: mehr Felder als Farben werden angeboten?', async () => {
    await reset();
    await page.click('.mode-tab[data-mode="solo"]');
    await page.waitForTimeout(150);
    await page.click('#set-colors [data-value="5"]');
    const pegs = await page.evaluate(() => Array.from(document.querySelectorAll('#set-pegs button')).map((b) => Number(b.dataset.value)));
    assert.ok(!pegs.includes(6), `6 Felder bei 5 Farben angeboten: ${pegs.join(',')}`);
  });

  console.log('\nFortschrittsanzeige (Minimax)\n');

  await check('Der Minimax-Zug ist nicht schlechter als jeder andere Kandidat', async () => {
    await reset();
    const res = await page.evaluate(() => {
      const f = window.farbcode;
      const cands = f.candidateCodes();
      const chosen = f.bestGuess(cands);
      const worstOf = (g) => {
        const groups = new Map();
        for (const s of cands) {
          const r = f.scoreFast(g, s);
          const key = r.exact * 10 + r.near;
          groups.set(key, (groups.get(key) || 0) + 1);
        }
        let worst = 0;
        for (const n of groups.values()) if (n > worst) worst = n;
        return worst;
      };
      let bestPossible = Infinity;
      for (const g of cands) bestPossible = Math.min(bestPossible, worstOf(g));
      return {
        count: cands.length,
        chosenWorst: chosen.worst,
        bestPossible,
        chosenIsCandidate: cands.some((c) => c.join() === chosen.guess.join()),
        distinct: new Set(chosen.guess).size === chosen.guess.length,
      };
    });
    assert.ok(res.chosenIsCandidate, 'der gewählte Zug ist kein Kandidat');
    assert.ok(res.distinct, 'der gewählte Zug hat eine Farbe doppelt');
    assert.strictEqual(res.chosenWorst, res.bestPossible,
      `schlechtester Fall ${res.chosenWorst}, bestmöglich ${res.bestPossible}`);
  });

  await check('Der Minimax-Zug teilt die Kandidaten auf', async () => {
    await reset();
    const res = await page.evaluate(() => {
      const f = window.farbcode;
      const cands = f.candidateCodes();
      const b = f.bestGuess(cands);
      return { n: cands.length, worst: b.worst, groups: b.groups };
    });
    assert.ok(res.worst < res.n, `schlimmster Fall ${res.worst} bei ${res.n} Kandidaten`);
    assert.ok(res.groups > 1, 'der Zug teilt die Kandidaten nicht auf');
  });

  await check('Die Minimax-Suche ist schnell genug für jeden Zug', async () => {
    await reset();
    const ms = await page.evaluate(() => {
      const t0 = performance.now();
      window.farbcode.bestGuess(window.farbcode.candidateCodes());
      return performance.now() - t0;
    });
    assert.ok(ms < 1500, `Minimax brauchte ${Math.round(ms)} ms`);
  });

  await check('Die Fortschrittsanzeige nennt die Kandidatenzahl', async () => {
    await reset();
    const text = await page.textContent('#progress-count');
    assert.ok(/360/.test(text), `Text: "${text}"`);
    const pct = await page.textContent('#progress-pct');
    assert.strictEqual(pct.trim(), '0%');
  });

  await check('Nach einem Zug sinkt die Kandidatenzahl', async () => {
    await reset();
    const before = await page.textContent('#progress-count');
    await page.keyboard.press('1');
    await page.keyboard.press('2');
    await page.keyboard.press('3');
    await page.keyboard.press('4');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    const after = await page.textContent('#progress-count');
    assert.ok(before !== after, `unverändert: "${after}"`);
    const pct = await page.textContent('#progress-pct');
    assert.ok(pct.trim() !== '0%', `Fortschritt blieb bei ${pct}`);
  });

  await check('Die Kandidaten kommen einzeln: „Weiter" blättert weiter', async () => {
    await reset();
    const first = await page.textContent('#cand-label');
    assert.ok(/Kandidat 1 von|Candidate 1 of/.test(first), `Beschriftung: "${first}"`);
    const pegs1 = await page.innerHTML('#cand-pegs');
    await page.click('#cand-next');
    await page.waitForTimeout(150);
    const second = await page.textContent('#cand-label');
    assert.notStrictEqual(first, second, 'die Beschriftung hat sich nicht bewegt');
    const pegs2 = await page.innerHTML('#cand-pegs');
    assert.notStrictEqual(pegs1, pegs2, 'die Kandidaten haben sich nicht bewegt');
  });

  await check('„Zurück" geht zurück (und um den Anfang herum)', async () => {
    await reset();
    await page.click('#cand-next');
    await page.waitForTimeout(120);
    const after = await page.textContent('#cand-label');
    await page.click('#cand-prev');
    await page.waitForTimeout(120);
    const back = await page.textContent('#cand-label');
    assert.notStrictEqual(after, back, '„Zurück" hat nichts bewegt');
    const first = await page.textContent('#cand-label');
    await page.click('#cand-prev');
    await page.waitForTimeout(120);
    const wrapped = await page.textContent('#cand-label');
    assert.notStrictEqual(back, wrapped, 'der Sprung über den Anfang fehlt');
    assert.strictEqual(first, back, '„Zurück" ist nicht symmetrisch');
  });

  await check('Der stärkste Zug ist unter den Kandidaten markiert', async () => {
    await reset();
    const res = await page.evaluate(() => {
      const f = window.farbcode;
      const best = f.bestGuess(f.candidateCodes());
      const idx = f.candidateCodes().findIndex((c) => c.join() === best.guess.join());
      return { idx, total: f.candidateCodes().length };
    });
    for (let i = 0; i < res.idx; i++) {
      await page.click('#cand-next');
      await page.waitForTimeout(40);
    }
    const note = await page.textContent('#cand-note');
    assert.ok(/stärkste|stärksten|stärkste Zug|strongest/.test(note), `Notiz: "${note}"`);
    const isBest = await page.evaluate(() => document.querySelector('#cand-walk').classList.contains('is-best'));
    assert.ok(isBest, 'der Kandidat ist nicht als bester markiert');
  });

  await check('Der Coach nennt den Minimax-Zug', async () => {
    await reset();
    const hints = await page.evaluate(() => window.farbcode.buildHints());
    // Die Seite läuft je nach Browser-Sprache auf Deutsch oder Englisch —
    // der Hinweis muss in beiden Fassungen den Minimax-Zug nennen.
    assert.ok(hints.some((h) => /stärkste|stärksten|strongest/i.test(h)),
      `Hinweise: ${JSON.stringify(hints).slice(0, 200)}`);
  });

  console.log('\nEigenschaften (Property-Tests)\n');

  /* The old property test ran against the variant without the house rule.
     The distinct variant needs its own — otherwise a bug in the filter
     (the candidate list always full) would stay invisible. */

  await check('Die wahre Lösung bleibt unter den Kandidaten (400 Spiele)', async () => {
    await reset();
    const res = await page.evaluate(() => {
      const f = window.farbcode;
      const s = f.state;
      const bad = [];
      let moves = 0;
      for (let game = 0; game < 400; game++) {
        const code = f.randomCode(4, 6);
        s.code = code;
        s.guesses = [];
        for (let move = 0; move < 6; move++) {
          const guess = f.randomCode(4, 6);
          const { exact, near } = f.score(guess, code);
          s.guesses.push({ guess, exact, near });
          moves++;
          const cands = f.candidateCodes();
          if (!cands.some((c) => c.join() === code.join())) {
            bad.push(`Spiel ${game}, Zug ${move}: ${code.join()} fehlt in ${cands.length} Kandidaten`);
            break;
          }
          if (cands.length === 1) break;
        }
      }
      return { bad, moves };
    });
    assert.strictEqual(res.bad.length, 0, res.bad.slice(0, 3).join(' | '));
    assert.ok(res.moves > 1000, `nur ${res.moves} Züge geprüft`);
  });

  await check('Die Kandidatenzahl sinkt monoton (400 Spiele)', async () => {
    await reset();
    const res = await page.evaluate(() => {
      const f = window.farbcode;
      const s = f.state;
      const bad = [];
      let steps = 0;
      for (let game = 0; game < 400; game++) {
        const code = f.randomCode(4, 6);
        s.code = code;
        s.guesses = [];
        let prev = f.candidateCodes().length;
        for (let move = 0; move < 6; move++) {
          const guess = f.randomCode(4, 6);
          const { exact, near } = f.score(guess, code);
          s.guesses.push({ guess, exact, near });
          steps++;
          const now = f.candidateCodes().length;
          if (now > prev) { bad.push(`Spiel ${game}, Zug ${move}: ${prev} -> ${now}`); break; }
          prev = now;
          if (now === 1) break;
        }
      }
      return { bad, steps };
    });
    assert.strictEqual(res.bad.length, 0, res.bad.slice(0, 3).join(' | '));
    assert.ok(res.steps > 1000, `nur ${res.steps} Züge geprüft`);
  });

  await check('Jede Feststellung gilt für alle Kandidaten (120 Spiele)', async () => {
    await reset();
    const res = await page.evaluate(() => {
      const f = window.farbcode;
      const s = f.state;
      const bad = [];
      const countOf = (cand, color) => cand.filter((x) => x === color).length;
      let factsChecked = 0;
      for (let game = 0; game < 120; game++) {
        const code = f.randomCode(4, 6);
        s.code = code;
        s.guesses = [];
        for (let move = 0; move < 5; move++) {
          const guess = f.randomCode(4, 6);
          const { exact, near } = f.score(guess, code);
          s.guesses.push({ guess, exact, near });
          const { cands, facts } = f.analyze();
          for (const fact of facts) {
            factsChecked++;
            for (const cand of cands) {
              const n = countOf(cand, fact.color);
              let holds;
              if (fact.type === 'pos') holds = cand[fact.p] === fact.color;
              else if (fact.type === 'absent') holds = n === 0;
              else if (fact.type === 'count') holds = n === fact.k;
              else if (fact.type === 'present') holds = n >= 1;
              else holds = n >= 0;                       // 'open' — noch möglich
              if (!holds) {
                bad.push(`Spiel ${game}, Zug ${move}: ${fact.type}(${fact.color}) gilt nicht für ${cand.join()}`);
                break;
              }
            }
            // Die wahre Lösung selbst muss jede Feststellung erfüllen.
            const nTrue = countOf(code, fact.color);
            const trueHolds = fact.type === 'pos' ? code[fact.p] === fact.color
              : fact.type === 'absent' ? nTrue === 0
              : fact.type === 'count' ? nTrue === fact.k
              : fact.type === 'present' ? nTrue >= 1
              : true;
            if (!trueHolds) {
              bad.push(`Spiel ${game}, Zug ${move}: ${fact.type}(${fact.color}) widerspricht der Lösung ${code.join()}`);
              break;
            }
          }
          if (bad.length) break;
          if (cands.length === 1) break;
        }
        if (bad.length) break;
      }
      return { bad, factsChecked };
    });
    assert.strictEqual(res.bad.length, 0, res.bad.slice(0, 3).join(' | '));
    assert.ok(res.factsChecked > 200, `nur ${res.factsChecked} Feststellungen geprüft`);
  });

  await check('Der Altbestand (Wiederholungen erlaubt) besteht die Eigenschaften', async () => {
    await reset();
    const res = await page.evaluate(() => {
      const f = window.farbcode;
      const s = f.state;
      s.rules = 'repeat';
      const bad = [];
      let moves = 0;
      for (let game = 0; game < 60; game++) {
        const code = [];
        for (let i = 0; i < 4; i++) code.push(Math.floor(Math.random() * 6));
        s.code = code;
        s.guesses = [];
        for (let move = 0; move < 5; move++) {
          const guess = [];
          for (let i = 0; i < 4; i++) guess.push(Math.floor(Math.random() * 6));
          const { exact, near } = f.score(guess, code);
          s.guesses.push({ guess, exact, near });
          moves++;
          const cands = f.candidateCodes();
          if (!cands.some((c) => c.join() === code.join())) {
            bad.push(`Spiel ${game}, Zug ${move}: ${code.join()} fehlt`);
            break;
          }
          if (cands.length === 1) break;
        }
      }
      return { bad, moves };
    });
    assert.strictEqual(res.bad.length, 0, res.bad.slice(0, 3).join(' | '));
    assert.ok(res.moves > 100, `nur ${res.moves} Züge geprüft`);
  });

  console.log('\nVersionsanzeige\n');

  await check('Der Footer nennt die Version, die Regel und die Rätsel-Version', async () => {
    await reset();
    const meta = (await page.textContent('#footer-meta')).trim();
    assert.ok(/1\.2\.0/.test(meta), `Footer: "${meta}"`);
    assert.ok(/v2/.test(meta), `Seed-Version fehlt: "${meta}"`);
    assert.ok(/Hausregel|house rule/i.test(meta), `Regel fehlt: "${meta}"`);
  });

  await check('Die Version im Footer stimmt mit package.json überein', async () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    await reset();
    const shown = await page.evaluate(() => window.farbcode.APP_VERSION);
    assert.strictEqual(shown, pkg.version,
      `app.js sagt ${shown}, package.json sagt ${pkg.version}`);
  });

  await check('Die Diagnose nennt die Version', async () => {
    await reset();
    const diag = await page.evaluate(() => window.farbcode.diagnosis());
    assert.ok(/^\d+\.\d+\.\d+$/.test(diag.version), `Version: "${diag.version}"`);
    assert.ok(['distinct', 'repeat'].includes(diag.regeln), `Regeln: "${diag.regeln}"`);
  });

  await browser.close();
  server.close();

  console.log(`\n${passed} bestanden, ${failures.length} fehlgeschlagen\n`);
  if (failures.length) {
    for (const f of failures) console.log(`  ${f.name}\n    ${f.err.stack.split('\n').slice(0, 3).join('\n    ')}\n`);
    process.exit(1);
  }
}

main().catch((err) => { console.error(err); process.exit(2); });
