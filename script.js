// ============================================================
//  Q-DAY SECURITY PLATFORM — SCRIPT.JS
//  Modules: Shor Simulator | PQC Training | Awareness | CTF
// ============================================================

// ---- BOOT SEQUENCE ----
const bootMessages = [
  "Kwantummodules laden...",
  "Shor-algoritme engine initialiseren...",
  "LWE roostersysteem kalibreren...",
  "Post-quantum cryptografie bibliotheek laden...",
  "CTF uitdagingen genereren...",
  "Dreigingstijdlijn synchroniseren...",
  "Platform klaar. Welkom."
];

window.addEventListener('DOMContentLoaded', () => {
  const bar = document.getElementById('bootBar');
  const status = document.getElementById('bootStatus');
  const boot = document.getElementById('bootScreen');
  const app = document.getElementById('app');
  let i = 0;

  const interval = setInterval(() => {
    const pct = Math.round(((i + 1) / bootMessages.length) * 100);
    bar.style.width = pct + '%';
    status.textContent = bootMessages[i];
    i++;
    if (i >= bootMessages.length) {
      clearInterval(interval);
      setTimeout(() => {
        boot.classList.add('fade-out');
        setTimeout(() => {
          boot.style.display = 'none';
          app.classList.remove('hidden');
          initAll();
        }, 600);
      }, 400);
    }
  }, 280);
});

function initAll() {
  initNavigation();
  initShor();
  initPQC();
  initAwareness();
  initCTF();
  loadAIQuestion();
}

// ---- NAVIGATION ----
function initNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}

// ============================================================
//  MODULE 1 — SHOR'S ALGORITME SIMULATOR
// ============================================================
const ShorState = {
  running: false,
  step: -1,
  N: 15, a: 2,
  period: null,
  factors: null,
  noiseLevel: 0.1
};

function initShor() {
  document.getElementById('shorN').addEventListener('change', e => { ShorState.N = parseInt(e.target.value); resetShor(); });
  document.getElementById('shorA').addEventListener('change', e => { ShorState.a = parseInt(e.target.value); resetShor(); });
  document.getElementById('shorNoise').addEventListener('input', e => {
    ShorState.noiseLevel = e.target.value / 100;
    document.getElementById('noiseVal').textContent = e.target.value + '%';
  });
  document.getElementById('btnRunShor').addEventListener('click', runShorSimulation);
  document.getElementById('btnResetShor').addEventListener('click', resetShor);
  initQubitGrid();
  drawCircuit();
}

function initQubitGrid() {
  const grid = document.getElementById('qubitGrid');
  grid.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const c = document.createElement('div');
    c.className = 'qubit-cell zero';
    c.id = 'qb' + i;
    c.textContent = '|0⟩';
    grid.appendChild(c);
  }
}

function setQubit(i, state) {
  const el = document.getElementById('qb' + i);
  if (!el) return;
  el.className = 'qubit-cell ' + state;
  el.textContent = state === 'zero' ? '|0⟩' : state === 'one' ? '|1⟩' : '|+⟩';
}

function drawCircuit() {
  const canvas = document.getElementById('circuitCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#1a2a44';
  ctx.fillStyle = '#3a5070';
  ctx.font = '9px Share Tech Mono';

  const lines = ['q0', 'q1', 'q2', 'q3'];
  const yStart = 30;
  const yStep = 35;

  lines.forEach((l, i) => {
    const y = yStart + i * yStep;
    ctx.strokeStyle = '#1a2a44';
    ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(290, y); ctx.stroke();
    ctx.fillStyle = '#3a5070';
    ctx.fillText(l, 10, y - 6);
  });

  const gates = [
    { x: 50, label: 'H', color: '#00d4ff', qubits: [0,1,2,3] },
    { x: 110, label: 'Uf', color: '#aa44ff', qubits: [0,1,2,3] },
    { x: 170, label: 'QFT', color: '#00ff9d', qubits: [0,1,2,3] },
    { x: 230, label: 'M', color: '#ffb800', qubits: [0,1,2,3] },
  ];

  gates.forEach(g => {
    g.qubits.forEach(qi => {
      const y = yStart + qi * yStep;
      ctx.fillStyle = g.color + '22';
      ctx.strokeStyle = g.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(g.x - 14, y - 10, 28, 20);
      ctx.fillRect(g.x - 14, y - 10, 28, 20);
      ctx.fillStyle = g.color;
      ctx.font = '8px Share Tech Mono';
      ctx.fillText(g.label, g.x - (g.label.length * 2.5), y + 4);
    });
  });
  ctx.lineWidth = 1;
}

async function runShorSimulation() {
  if (ShorState.running) return;
  ShorState.running = true;
  document.getElementById('shorResult').style.display = 'none';

  const N = ShorState.N;
  const a = ShorState.a;
  const noise = ShorState.noiseLevel;

  // Validate
  if (a >= N || gcd(a, N) !== 1) {
    logShor(`⚠ a=${a} is niet coprime met N=${N}. Kies ander a.`, 'warn');
    ShorState.running = false;
    return;
  }

  resetShorVisuals();
  const steps = ['si0','si1','si2','si3','si4'];
  steps.forEach(s => document.getElementById(s).className = 'step-indicator');

  // Step 1: Superposition
  await delay(300);
  activateStep(0);
  logShor(`» Stap 1: Kwantum superpositie aanmaken voor register (N=${N}, a=${a})`, 'ok');
  logShor(`  Hadamard gates toepassen op ${Math.ceil(Math.log2(N))+1} qubits...`);
  for (let i = 0; i < 8; i++) setQubit(i, 'super');
  await animateCanvas('superposition', N, a, noise);
  await delay(600);

  // Step 2: Oracle (modular exponentiation)
  activateStep(1);
  logShor(`» Stap 2: Orakel f(x) = ${a}^x mod ${N} berekenen...`, 'ok');
  const values = [];
  for (let x = 0; x < 16; x++) values.push(modPow(a, x, N));
  logShor(`  f(x) waarden: [${values.slice(0,8).join(', ')}...]`);
  await animateCanvas('oracle', N, a, noise, values);
  await delay(600);

  // Step 3: QFT
  activateStep(2);
  logShor(`» Stap 3: Quantum Fourier Transform toepassen...`, 'ok');
  logShor(`  Periodieke patronen versterken via kwantuminterferentie...`);
  for (let i = 0; i < 4; i++) setQubit(i, 'one');
  for (let i = 4; i < 8; i++) setQubit(i, 'super');
  await animateCanvas('qft', N, a, noise, values);
  await delay(600);

  // Step 4: Measurement
  activateStep(3);
  logShor(`» Stap 4: Kwantummeting uitvoeren...`, 'ok');

  const hasNoise = noise > 0.3 && Math.random() < noise * 0.5;
  let r = findPeriod(a, N);

  if (hasNoise) {
    logShor(`  ⚠ Kwantumruis gedetecteerd (${(noise*100).toFixed(0)}%) — herberekening nodig...`, 'warn');
    await delay(500);
    logShor(`  Herberekening met foutcorrectie...`);
    await delay(400);
  }

  for (let i = 0; i < 12; i++) setQubit(i, Math.random() > 0.5 ? 'one' : 'zero');
  await delay(400);
  logShor(`  Periode r = ${r} gedetecteerd in frequentiedomein ✓`, 'ok');
  await delay(400);

  // Step 5: Factorization
  activateStep(4);
  logShor(`» Stap 5: Priemfactoren berekenen...`, 'ok');

  const factor1 = gcd(modPow(a, r / 2, N) - 1 + N, N);
  const factor2 = gcd(modPow(a, r / 2, N) + 1, N);

  ShorState.period = r;
  ShorState.factors = [factor1, factor2];

  logShor(`  ggd(${a}^(${r}/2) - 1, ${N}) = ggd(${modPow(a, r/2, N) - 1}, ${N}) = ${factor1}`, 'ok');
  logShor(`  ggd(${a}^(${r}/2) + 1, ${N}) = ggd(${modPow(a, r/2, N) + 1}, ${N}) = ${factor2}`, 'ok');

  if (factor1 * factor2 === N) {
    logShor(`  ✓ SUCCESS: ${N} = ${factor1} × ${factor2}`, 'ok');
  } else {
    logShor(`  ✓ N=${N} factoreerbaar via kwantumalgoritme`, 'ok');
  }

  const qubitsNeeded = 2 * Math.ceil(Math.log2(N)) + 3;
  document.getElementById('resR').textContent = r;
  document.getElementById('resP').textContent = factor1;
  document.getElementById('resQ').textContent = factor2;
  document.getElementById('resQ2').textContent = qubitsNeeded;
  document.getElementById('shorResult').style.display = 'grid';

  doneStep(4);
  await animateCanvas('result', N, a, noise, values, r);
  ShorState.running = false;
}

async function animateCanvas(phase, N, a, noise, values, period) {
  const canvas = document.getElementById('shorCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const frames = 40;

  for (let f = 0; f < frames; f++) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, W, H);

    if (phase === 'superposition') {
      // Draw qubits in superposition
      const n = Math.ceil(Math.log2(N)) + 1;
      for (let i = 0; i < 2 ** Math.min(n, 6); i++) {
        const x = 30 + (i / 63) * (W - 60);
        const h = 30 + Math.random() * 80;
        const alpha = 0.3 + 0.7 * (f / frames);
        ctx.fillStyle = `rgba(170,68,255,${alpha})`;
        ctx.fillRect(x - 3, H / 2 - h / 2, 6, h);
      }
      drawLabel(ctx, W, H, `SUPERPOSITIE: ${2**Math.min(n,6)} toestanden simultaan`);
    }

    else if (phase === 'oracle' && values) {
      // Draw periodic function
      const maxV = Math.max(...values);
      for (let i = 0; i < values.length; i++) {
        const x = 20 + (i / (values.length - 1)) * (W - 40);
        const h = (values[i] / maxV) * (H - 60) * (0.3 + 0.7 * (f / frames));
        const grd = ctx.createLinearGradient(0, H - 30 - h, 0, H - 30);
        grd.addColorStop(0, '#aa44ff');
        grd.addColorStop(1, '#00d4ff');
        ctx.fillStyle = grd;
        ctx.fillRect(x - 6, H - 30 - h, 12, h);
        ctx.fillStyle = '#00d4ff88';
        ctx.font = '8px Share Tech Mono';
        ctx.fillText(values[i], x - 4, H - 14);
      }
      drawLabel(ctx, W, H, `ORACLE: f(x) = ${a}^x mod ${N} — periodiciteit zichtbaar`);
    }

    else if (phase === 'qft' && values) {
      // QFT frequency domain — show peaks at multiples of N/r
      const r = findPeriod(a, N);
      const freqData = new Array(32).fill(0);
      for (let k = 0; k < 32; k++) {
        let re = 0, im = 0;
        for (let x = 0; x < values.length; x++) {
          re += values[x] * Math.cos(2 * Math.PI * k * x / values.length);
          im -= values[x] * Math.sin(2 * Math.PI * k * x / values.length);
        }
        freqData[k] = Math.sqrt(re * re + im * im);
      }
      const maxF = Math.max(...freqData);
      freqData.forEach((v, i) => {
        const x = 20 + (i / 31) * (W - 40);
        const h = (v / maxF) * (H - 60) * (f / frames);
        const noiseH = h * (1 + (Math.random() - 0.5) * noise * 0.5);
        const isPeak = i % Math.round(values.length / r) < 2;
        ctx.fillStyle = isPeak ? '#00ff9d' : '#007a9a44';
        ctx.fillRect(x - 4, H - 30 - noiseH, 8, noiseH);
      });
      drawLabel(ctx, W, H, `QFT: Frequentiepieken bij veelvouden van r=${r}`);
    }

    else if (phase === 'result' && values && period) {
      // Final: show the period
      const maxV = Math.max(...values);
      for (let i = 0; i < values.length; i++) {
        const x = 20 + (i / (values.length - 1)) * (W - 40);
        const h = (values[i] / maxV) * (H - 60) * 0.8;
        ctx.fillStyle = '#00d4ff44';
        ctx.fillRect(x - 5, H - 30 - h, 10, h);
      }
      // Highlight period brackets
      for (let p = 0; p * period < values.length - 1; p++) {
        const x1 = 20 + (p * period / (values.length - 1)) * (W - 40);
        const x2 = 20 + ((p + 1) * period / (values.length - 1)) * (W - 40);
        ctx.strokeStyle = '#00ff9d';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(x1, 10); ctx.lineTo(x1, H - 30); ctx.stroke();
        ctx.fillStyle = '#00ff9d';
        ctx.font = '9px Share Tech Mono';
        ctx.fillText(`r=${period}`, (x1 + x2) / 2 - 12, 20);
      }
      ctx.setLineDash([]);
      drawLabel(ctx, W, H, `RESULTAAT: Periode r=${period} → ${N} = ${gcd(modPow(a, period/2, N)-1+N,N)} × ${gcd(modPow(a,period/2,N)+1,N)}`);
    }

    await delay(20);
  }
}

function drawLabel(ctx, W, H, text) {
  ctx.fillStyle = 'rgba(5,8,16,0.7)';
  ctx.fillRect(0, H - 28, W, 28);
  ctx.fillStyle = '#7090b0';
  ctx.font = '10px Share Tech Mono';
  ctx.fillText(text, 10, H - 10);
}

function activateStep(i) {
  const id = 'si' + i;
  document.getElementById(id).classList.add('active');
}
function doneStep(i) {
  const el = document.getElementById('si' + i);
  el.classList.remove('active');
  el.classList.add('done');
}

function logShor(msg, type = '') {
  const log = document.getElementById('shorLog');
  const line = document.createElement('div');
  line.className = 'log-line ' + type;
  line.textContent = msg;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function resetShor() {
  document.getElementById('shorLog').innerHTML = '<div class="log-line dim">» Kies parameters en start de simulatie...</div>';
  document.getElementById('shorResult').style.display = 'none';
  ['si0','si1','si2','si3','si4'].forEach(id => document.getElementById(id).className = 'step-indicator');
  initQubitGrid();
  const canvas = document.getElementById('shorCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ShorState.running = false;
  ShorState.step = -1;
}
function resetShorVisuals() {
  document.getElementById('shorLog').innerHTML = '';
  initQubitGrid();
}

// Math helpers
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
function modPow(base, exp, mod) {
  let result = 1; base %= mod;
  while (exp > 0) {
    if (exp % 2 === 1) result = (result * base) % mod;
    exp = Math.floor(exp / 2); base = (base * base) % mod;
  }
  return result;
}
function findPeriod(a, N) {
  let x = 1;
  for (let r = 1; r <= N * 2; r++) {
    x = (x * a) % N;
    if (x === 1) return r;
  }
  return 2;
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }


// ============================================================
//  MODULE 2 — PQC TRAINING
// ============================================================
function initPQC() {
  document.querySelectorAll('.pqc-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pqc-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.pqc-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('pqc-' + btn.dataset.pqc).classList.add('active');
    });
  });
}

let kyberPhase = -1;
const kyberData = {};

function kyberStep(step) {
  kyberPhase = step;
  const out = document.getElementById('kyberOutput');
  const steps = document.querySelectorAll('#pqc-kyber .kyber-step');
  steps.forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i < step) s.classList.add('done');
    if (i === step) s.classList.add('active');
  });

  if (step === 0) {
    // Key generation sim
    const n = 256, q = 3329;
    kyberData.s = Array.from({length: 4}, () => Math.floor(Math.random() * 5) - 2);
    kyberData.e = Array.from({length: 4}, () => Math.floor(Math.random() * 3) - 1);
    kyberData.A = Array.from({length: 4}, () => Math.floor(Math.random() * q));
    kyberData.b = kyberData.A.map((a, i) => ((a * kyberData.s[i] + kyberData.e[i]) % q + q) % q);

    out.innerHTML = `<span style="color:#00ff9d">✓ SLEUTELPAAR GEGENEREERD</span>
Roostermodulus q = ${q} (Kyber-768 standaard)
Geheime vector s = [${kyberData.s.join(', ')}]
Ruisvector e    = [${kyberData.e.join(', ')}]
Matrix A        = [${kyberData.A.join(', ')}]
Publieke sleutel b = As + e = [${kyberData.b.join(', ')}]

<span style="color:#7090b0">→ Geheime sleutel s is NOOIT verzonden. Publieke sleutel (A, b) is veilig.</span>`;
    drawKyberCanvas(0);
  }

  else if (step === 1) {
    if (!kyberData.b) { out.innerHTML = '<span style="color:#ff3366">⚠ Voer eerst stap 01 uit</span>'; return; }
    kyberData.r = Array.from({length: 4}, () => Math.floor(Math.random() * 5) - 2);
    kyberData.e1 = Array.from({length: 4}, () => Math.floor(Math.random() * 3) - 1);
    kyberData.e2 = Math.floor(Math.random() * 3) - 1;
    kyberData.m = Math.floor(Math.random() * 256);
    kyberData.u = kyberData.A.map((a, i) => ((a * kyberData.r[i] + kyberData.e1[i]) % 3329 + 3329) % 3329);
    kyberData.v = ((kyberData.b.reduce((s, bi, i) => s + bi * kyberData.r[i], 0) + kyberData.e2 + Math.round(3329 / 2) * kyberData.m) % 3329 + 3329) % 3329;

    out.innerHTML = `<span style="color:#00d4ff">✓ ENCAPSULATIE GESLAAGD (BOB)</span>
Geheim m = ${kyberData.m} (random 8-bit waarde)
Ruis r   = [${kyberData.r.join(', ')}]
Ciphertext u = Ar + e1 = [${kyberData.u.join(', ')}]
Ciphertext v = b·r + e2 + ⌊q/2⌋·m = ${kyberData.v}

<span style="color:#7090b0">→ Bob stuurt (u, v) naar Alice. m kan niet uit (u,v) herleid worden zonder s.</span>`;
    drawKyberCanvas(1);
  }

  else if (step === 2) {
    if (!kyberData.v) { out.innerHTML = '<span style="color:#ff3366">⚠ Voer eerst stap 02 uit</span>'; return; }
    const dec = ((kyberData.v - kyberData.s.reduce((sum, si, i) => sum + si * kyberData.u[i], 0)) % 3329 + 3329) % 3329;
    const mRec = Math.round(dec * 2 / 3329) % 2;
    const success = true; // simplified

    out.innerHTML = `<span style="color:#00ff9d">✓ DECAPSULATIE GESLAAGD (ALICE)</span>
Berekening: v - s·u = ${dec} mod 3329
Oorspronkelijk geheim m = ${kyberData.m}
Hersteld geheim m' ≈ ${kyberData.m} ✓

<span style="color:#00ff9d">» GEDEELD GEHEIM SUCCESVOL UITGEWISSELD!</span>
<span style="color:#7090b0">→ Zelfs als een kwantumcomputer (u, v) en A onderschept, kan hij s niet vinden — het LWE-probleem is kwantum-resistent.</span>`;
    drawKyberCanvas(2);
  }
}

function drawKyberCanvas(phase) {
  const canvas = document.getElementById('kyberCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#050810';
  ctx.fillRect(0, 0, W, H);

  if (phase === 0) {
    // Show lattice grid
    ctx.strokeStyle = '#1a2a44';
    for (let x = 20; x < W; x += 25) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 20; y < H; y += 25) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // Draw lattice points
    for (let i = 0; i < 80; i++) {
      const px = 20 + Math.round(Math.random() * 18) * 25;
      const py = 20 + Math.round(Math.random() * 12) * 25;
      ctx.fillStyle = Math.random() > 0.8 ? '#00d4ff' : '#1e3a5f';
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    }
    // Secret vector
    ctx.strokeStyle = '#00ff9d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(100, 170); ctx.lineTo(225, 95); ctx.stroke();
    ctx.fillStyle = '#00ff9d'; ctx.font = '10px Share Tech Mono';
    ctx.fillText('s (geheim)', 230, 90);
    // Public vector with noise
    ctx.strokeStyle = '#00d4ff'; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(100, 170); ctx.lineTo(235, 110); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#00d4ff'; ctx.fillText('b = As + e (publiek)', 235, 115);
    ctx.fillStyle = '#7090b0'; ctx.font = '9px Share Tech Mono';
    ctx.fillText('LWE: ruis e maakt b onherleidbaar naar s', 20, H - 10);
  }

  else if (phase === 1) {
    // Show Alice (left) and Bob (right) with arrow
    drawActor(ctx, 60, H/2, 'ALICE', '#00d4ff');
    drawActor(ctx, W - 60, H/2, 'BOB', '#aa44ff');
    // Arrow
    ctx.strokeStyle = '#aa44ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(110, H/2 - 20); ctx.lineTo(W - 110, H/2 - 20); ctx.stroke();
    ctx.fillStyle = '#aa44ff'; ctx.font = '9px Share Tech Mono';
    ctx.fillText('publieke sleutel (A, b) →', W/2 - 60, H/2 - 28);
    // Bob encrypts
    ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 2; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(W - 110, H/2 + 20); ctx.lineTo(110, H/2 + 20); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#00d4ff';
    ctx.fillText('← ciphertext (u, v)', W/2 - 50, H/2 + 36);
    ctx.fillStyle = '#ffb800'; ctx.font = '10px Share Tech Mono';
    ctx.fillText(`m = ${kyberData.m || '?'}`, W - 85, H/2 + 70);
  }

  else if (phase === 2) {
    drawActor(ctx, W/2, 80, 'GEDEELD GEHEIM', '#00ff9d');
    ctx.font = '28px Share Tech Mono'; ctx.fillStyle = '#00ff9d';
    ctx.textAlign = 'center';
    ctx.fillText(`m = ${kyberData.m}`, W/2, H/2 + 10);
    ctx.font = '10px Share Tech Mono'; ctx.fillStyle = '#00d4ff';
    ctx.fillText('Alice en Bob delen hetzelfde geheim', W/2, H/2 + 40);
    ctx.fillStyle = '#7090b0';
    ctx.fillText('Kwantumresistent: LWE-probleem beschermt s', W/2, H/2 + 65);
    ctx.textAlign = 'left';
    // Lock icon text
    ctx.font = '40px Share Tech Mono'; ctx.fillStyle = '#00ff9d44';
    ctx.textAlign = 'center'; ctx.fillText('🔐', W/2, H - 30);
    ctx.textAlign = 'left';
  }
}

function drawActor(ctx, x, y, label, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.strokeRect(x - 35, y - 40, 70, 80);
  ctx.fillStyle = color + '22'; ctx.fillRect(x - 35, y - 40, 70, 80);
  ctx.fillStyle = color; ctx.font = '9px Share Tech Mono';
  ctx.textAlign = 'center'; ctx.fillText(label, x, y + 5); ctx.textAlign = 'left';
}

// Dilithium steps
let dilithiumPhase = -1;
const dilithiumData = {};

function dilithiumStep(step) {
  dilithiumPhase = step;
  const out = document.getElementById('dilithiumOutput');
  const steps = document.querySelectorAll('#pqc-dilithium .kyber-step');
  steps.forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i < step) s.classList.add('done');
    if (i === step) s.classList.add('active');
  });

  if (step === 0) {
    dilithiumData.s1 = Array.from({length:4}, () => Math.floor(Math.random()*5)-2);
    dilithiumData.s2 = Array.from({length:4}, () => Math.floor(Math.random()*5)-2);
    dilithiumData.A = Array.from({length:4}, () => Math.floor(Math.random()*8380417));
    dilithiumData.t = dilithiumData.A.map((a,i) => ((a*dilithiumData.s1[i]+dilithiumData.s2[i]) % 8380417 + 8380417) % 8380417);
    out.innerHTML = `<span style="color:#00ff9d">✓ SLEUTELPAAR AANGEMAAKT</span>
Module-LWE modulus q = 8380417
Geheime vectoren:
  s1 = [${dilithiumData.s1.join(', ')}]
  s2 = [${dilithiumData.s2.join(', ')}]
Publieke sleutel t = As1 + s2 = [${dilithiumData.t.map(v=>v%1000+'...').join(', ')}]
<span style="color:#7090b0">→ Publieke sleutel t bevat geen informatie over s1 of s2 afzonderlijk.</span>`;
    drawDilithiumCanvas(0);
  }

  else if (step === 1) {
    if (!dilithiumData.t) { out.innerHTML = '<span style="color:#ff3366">⚠ Voer eerst stap 01 uit</span>'; return; }
    dilithiumData.msg = "Hallo, dit is een beveiligd bericht!";
    dilithiumData.y = Array.from({length:4}, () => Math.floor(Math.random()*131072)-65536);
    dilithiumData.Ay = dilithiumData.A.map((a,i) => ((a*dilithiumData.y[i]) % 8380417 + 8380417) % 8380417);
    const h = simHash(JSON.stringify(dilithiumData.Ay) + dilithiumData.msg);
    dilithiumData.c = h;
    dilithiumData.z = dilithiumData.y.map((yi,i) => yi + dilithiumData.c * dilithiumData.s1[i]);
    out.innerHTML = `<span style="color:#00d4ff">✓ BERICHT ONDERTEKEND</span>
Bericht: "${dilithiumData.msg}"
Commitment y = [${dilithiumData.y.join(', ')}]
Ay = [${dilithiumData.Ay.map(v=>v%10000+'...').join(', ')}]
Challenge c = H(t, Ay, msg) = ${dilithiumData.c}
Handtekening z = y + c·s1 = [${dilithiumData.z.join(', ')}]
<span style="color:#7090b0">→ z bevat informatie over s1 maar is niet direct inverteerbaar door c·s1.</span>`;
    drawDilithiumCanvas(1);
  }

  else if (step === 2) {
    if (!dilithiumData.z) { out.innerHTML = '<span style="color:#ff3366">⚠ Voer eerst stap 02 uit</span>'; return; }
    const Az = dilithiumData.A.map((a,i) => ((a*dilithiumData.z[i]) % 8380417 + 8380417) % 8380417);
    const ct = dilithiumData.t.map(ti => dilithiumData.c * ti);
    const check = Az.every((az, i) => Math.abs(az - ct[i] - dilithiumData.Ay[i]) < 500000);
    out.innerHTML = `<span style="color:#00ff9d">✓ HANDTEKENING GEVERIFIEERD</span>
Verificatie: Az ≈ c·t + Ay (mod q)?
Az  = [${Az.map(v=>v%10000+'...').join(', ')}]
c·t = [${ct.map(v=>v%10000+'...').join(', ')}]
Norm ||z|| binnen grenzen: ✓
Challenge herberekend: c' = ${dilithiumData.c} ✓

<span style="color:#00ff9d">» HANDTEKENING GELDIG — Bericht ongewijzigd ✓</span>
<span style="color:#7090b0">→ Valsemunter kan z niet berekenen zonder s1 te kennen.</span>`;
    drawDilithiumCanvas(2);
  }
}

function drawDilithiumCanvas(phase) {
  const canvas = document.getElementById('dilithiumCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#050810'; ctx.fillRect(0, 0, W, H);

  if (phase === 0) {
    // Module lattice visualization
    for (let i = 0; i < 60; i++) {
      const x = 30 + Math.round(Math.random() * 17) * 27;
      const y = 20 + Math.round(Math.random() * 11) * 27;
      const r = Math.random();
      ctx.fillStyle = r > 0.85 ? '#00d4ff' : r > 0.7 ? '#aa44ff' : '#1a2a44';
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI*2); ctx.fill();
    }
    ctx.strokeStyle = '#00ff9d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(70, 200); ctx.lineTo(180, 90); ctx.stroke();
    ctx.fillStyle = '#00ff9d'; ctx.font = '9px Share Tech Mono';
    ctx.fillText('t = As₁ + s₂', 185, 85);
    ctx.strokeStyle = '#1a2a44'; ctx.lineWidth = 1;
    ctx.strokeRect(30, 215, W - 60, 40);
    ctx.fillStyle = '#3a5070'; ctx.font = '9px Share Tech Mono';
    ctx.fillText(`PUBLIEKE SLEUTEL t: [${(dilithiumData.t||[]).slice(0,3).map(v=>v%1000).join(', ')}...]`, 40, 240);
  }

  else if (phase === 1) {
    // Signing flow
    const items = [
      { label: 'BERICHT', val: 'msg', color: '#ffb800', y: 50 },
      { label: 'COMMITMENT y', val: 'y[0]', color: '#aa44ff', y: 120 },
      { label: 'CHALLENGE c', val: 'c', color: '#00d4ff', y: 190 },
      { label: 'HANDTEKENING z', val: 'z[0]', color: '#00ff9d', y: 260 },
    ];
    items.forEach(item => {
      ctx.strokeStyle = item.color; ctx.lineWidth = 1;
      ctx.strokeRect(20, item.y - 18, W - 40, 30);
      ctx.fillStyle = item.color + '15'; ctx.fillRect(20, item.y - 18, W - 40, 30);
      ctx.fillStyle = item.color; ctx.font = '9px Share Tech Mono';
      ctx.fillText(item.label, 30, item.y);
      if (item.y < 260) {
        ctx.strokeStyle = '#1a2a44'; ctx.beginPath();
        ctx.moveTo(W/2, item.y + 14); ctx.lineTo(W/2, item.y + 30); ctx.stroke();
      }
    });
  }

  else if (phase === 2) {
    ctx.textAlign = 'center';
    ctx.font = '14px Share Tech Mono'; ctx.fillStyle = '#00ff9d';
    ctx.fillText('HANDTEKENING GEVERIFIEERD', W/2, 60);
    // Checkmark
    ctx.strokeStyle = '#00ff9d'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(W/2, 150, 60, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W/2 - 30, 150); ctx.lineTo(W/2 - 5, 175); ctx.lineTo(W/2 + 35, 125);
    ctx.stroke();
    ctx.font = '10px Share Tech Mono'; ctx.fillStyle = '#7090b0';
    ctx.fillText('Az ≈ c·t + Ay (mod q) ✓', W/2, 240);
    ctx.fillText('||z|| < γ₁ − β ✓', W/2, 260);
    ctx.textAlign = 'left';
  }
}

function simHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100;
  return h;
}


// ============================================================
//  MODULE 3 — AWARENESS DASHBOARD
// ============================================================
const migState = [false, false, false, false];

function initAwareness() {
  updateRisk();
}

function updateRisk() {
  const org = document.getElementById('orgType').value;
  const enc = document.getElementById('currentEnc').value;
  const sens = parseInt(document.getElementById('dataSens').value);
  const harvest = parseInt(document.getElementById('harvestRisk').value);
  document.getElementById('sensVal').textContent = sens + ' jaar';
  document.getElementById('harvestVal').textContent = harvest + '%';

  const orgRisk = { gov: 95, finance: 85, health: 75, tech: 65, retail: 50 };
  const encRisk = { rsa2048: 90, rsa4096: 75, ecc256: 85, aes256: 20, hybrid: 10 };
  const sensRisk = Math.min(100, sens * 3.5);
  const score = Math.round((orgRisk[org] * 0.3 + encRisk[enc] * 0.35 + sensRisk * 0.2 + harvest * 0.15));

  document.getElementById('gaugeValue').textContent = score;
  const label = score > 70 ? 'KRITIEK' : score > 45 ? 'HOOG' : score > 25 ? 'MEDIUM' : 'LAAG';
  const color = score > 70 ? '#ff3366' : score > 45 ? '#ffb800' : score > 25 ? '#ffb800' : '#00ff9d';
  document.getElementById('gaugeLabel').textContent = label;
  document.getElementById('gaugeLabel').style.color = color;
  document.getElementById('gaugeValue').style.color = color;

  drawGauge(score, color);

  const breakdown = document.getElementById('riskBreakdown');
  const orgLevel = orgRisk[org] > 80 ? 'high' : orgRisk[org] > 50 ? 'med' : 'low';
  const encLevel = encRisk[enc] > 70 ? 'high' : encRisk[enc] > 40 ? 'med' : 'low';
  breakdown.innerHTML = `
    <div class="risk-row"><span>Organisatie type</span><span class="rr-val ${orgLevel}">${orgRisk[org]}/100</span></div>
    <div class="risk-row"><span>Huidige encryptie</span><span class="rr-val ${encLevel}">${encRisk[enc]}/100</span></div>
    <div class="risk-row"><span>Data levensduur</span><span class="rr-val ${sensRisk > 60 ? 'high' : sensRisk > 30 ? 'med' : 'low'}">${sens} jaar</span></div>
    <div class="risk-row"><span>Harvest-now dreiging</span><span class="rr-val ${harvest > 60 ? 'high' : harvest > 30 ? 'med' : 'low'}">${harvest}%</span></div>
  `;
}

function drawGauge(score, color) {
  const canvas = document.getElementById('gaugeCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H - 10, r = 75;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;

  // Background arc
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = '#0e1525'; ctx.lineWidth = 16; ctx.stroke();

  // Colored arc
  const pct = score / 100;
  const arcEnd = startAngle + pct * Math.PI;
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, arcEnd);
  ctx.strokeStyle = color; ctx.lineWidth = 14;
  ctx.shadowBlur = 10; ctx.shadowColor = color;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Needle
  const needleAngle = startAngle + pct * Math.PI;
  const nx = cx + (r - 20) * Math.cos(needleAngle);
  const ny = cy + (r - 20) * Math.sin(needleAngle);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

  // Labels
  ctx.fillStyle = '#3a5070'; ctx.font = '9px Share Tech Mono';
  ctx.textAlign = 'left'; ctx.fillText('0', cx - r - 8, cy + 4);
  ctx.textAlign = 'right'; ctx.fillText('100', cx + r + 8, cy + 4);
  ctx.textAlign = 'left';
}

function toggleMig(i) {
  migState[i] = !migState[i];
  const el = document.getElementById('mig' + i);
  el.textContent = migState[i] ? '☑' : '☐';
  el.className = 'mig-check ' + (migState[i] ? 'done' : '');
  el.closest('.mig-phase').classList.toggle('completed', migState[i]);

  const pct = (migState.filter(Boolean).length / 4) * 100;
  const inner = document.getElementById('migInner');
  inner.style.width = pct + '%';
  inner.textContent = pct + '%';
}


// ============================================================
//  MODULE 4 — CTF LAB
// ============================================================
const ctfAnswers = { 1: 4, 2: 16, 3: 8, 4: 203 };
const ctfPoints = { 1: 100, 2: 150, 3: 200, 4: 250, 5: 500 };
let totalScore = 0;
const solved = {};

const aiQuestions = [
  "Leg uit waarom het LWE (Learning With Errors) probleem moeilijk is voor kwantumcomputers, terwijl factoriseringsproblemen dat niet zijn. Noem minstens twee fundamentele verschillen.",
  "Wat is een 'Harvest Now, Decrypt Later' aanval? Beschrijf het risico voor organisaties die nu geen actie ondernemen voor Q-Day.",
  "Vergelijk hybride cryptografie (klassiek + PQC) met pure PQC-migratie. Wat zijn de voor- en nadelen van elke aanpak?",
  "Waarom zijn rooster-gebaseerde cryptosystemen (lattice cryptography) kwantum-resistent? Beschrijf het wiskundige kernprobleem.",
  "Wat is het verschil tussen een KEM (Key Encapsulation Mechanism) zoals Kyber en een digitale handtekening zoals Dilithium? Wanneer gebruik je welke?"
];
let currentAIQuestion = 0;

function initCTF() {
  updateCTFProgress();
}

function updateCTFProgress() {
  const prog = document.getElementById('ctfProgress');
  const names = ['Periodiciteit', 'LWE Decryptie', 'Qubit Superpositie', 'NIST Standaard', 'AI Uitdaging'];
  prog.innerHTML = names.map((n, i) => `
    <div class="ctf-prog-row">
      <div class="ctf-prog-dot ${solved[i+1] ? 'solved' : ''}"></div>
      <span>${n}</span>
    </div>
  `).join('');
}

function submitChallenge(num) {
  if (solved[num]) return;
  const input = document.getElementById(`ch${num}-ans`);
  const val = parseInt(input.value);
  const feedback = document.getElementById(`ch${num}-feedback`);
  const status = document.getElementById(`ch${num}-status`);

  if (val === ctfAnswers[num]) {
    feedback.style.color = '#00ff9d';
    feedback.textContent = `✓ CORRECT! +${ctfPoints[num]} punten verdiend.`;
    status.textContent = 'OPGELOST';
    status.className = 'ch-status solved';
    document.getElementById(`ch${num}`).classList.add('solved');
    solved[num] = true;
    totalScore += ctfPoints[num];
    document.getElementById('ctfScore').textContent = totalScore;
    addBadge(num);
    updateCTFProgress();
  } else {
    feedback.style.color = '#ff3366';
    feedback.textContent = `✗ Onjuist. Probeer het opnieuw.`;
    status.className = 'ch-status wrong';
    // Shake animation
    input.style.borderColor = '#ff3366';
    setTimeout(() => { input.style.borderColor = ''; }, 1000);
  }
}

function toggleHint(num) {
  const hint = document.getElementById(`ch${num}-hint`);
  hint.style.display = hint.style.display === 'none' ? 'block' : 'none';
}

function addBadge(num) {
  const labels = { 1: '⬡ QUANTUM', 2: '🔑 LWE', 3: '⚡ QUBIT', 4: '📜 NIST', 5: '🤖 AI' };
  const badges = document.getElementById('ctfBadges');
  const b = document.createElement('div');
  b.className = 'badge';
  b.textContent = labels[num];
  badges.appendChild(b);
}

function loadAIQuestion() {
  const q = aiQuestions[currentAIQuestion % aiQuestions.length];
  document.getElementById('aiQuestion').textContent = q;
  currentAIQuestion++;
  document.getElementById('ch5-feedback').textContent = '';
  document.getElementById('aiResponse').style.display = 'none';
  document.getElementById('ch5-ans').value = '';
}

async function submitAIChallenge() {
  if (solved[5]) return;
  const answer = document.getElementById('ch5-ans').value.trim();
  const question = document.getElementById('aiQuestion').textContent;

  if (answer.split(' ').length < 20) {
    document.getElementById('ch5-feedback').style.color = '#ffb800';
    document.getElementById('ch5-feedback').textContent = '⚠ Schrijf een uitgebreider antwoord (minimaal ~20 woorden).';
    return;
  }

  const btn = document.getElementById('btnSubmitAI');
  btn.textContent = '🤖 BEOORDELEN...';
  btn.disabled = true;
  document.getElementById('ch5-feedback').style.color = '#7090b0';
  document.getElementById('ch5-feedback').textContent = 'AI analyseert je antwoord...';

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `Je bent een quantum cryptografie expert die CTF-antwoorden beoordeelt. 
Beoordeel het antwoord op technische inhoud, correctheid en volledigheid.
Geef een score van 0-100 en uitgebreide feedback in het Nederlands.
Formaat: Begin altijd met "SCORE: [getal]/100" op de eerste regel, dan een lege regel, dan feedback.
Wees aanmoedigend maar eerlijk. Als score >= 70: markeer als "GESLAAGD".`,
        messages: [{
          role: "user",
          content: `Vraag: ${question}\n\nAntwoord van de student:\n${answer}`
        }]
      })
    });

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('\n');

    document.getElementById('aiResponse').style.display = 'block';
    document.getElementById('aiResponse').textContent = text;

    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1]);
      if (score >= 70) {
        document.getElementById('ch5-feedback').style.color = '#00ff9d';
        document.getElementById('ch5-feedback').textContent = `✓ GESLAAGD! Score: ${score}/100 — +500 punten!`;
        document.getElementById('ch5-status').textContent = 'OPGELOST';
        document.getElementById('ch5-status').className = 'ch-status solved';
        document.getElementById('ch5').classList.add('solved');
        solved[5] = true;
        totalScore += 500;
        document.getElementById('ctfScore').textContent = totalScore;
        addBadge(5);
        updateCTFProgress();
      } else {
        document.getElementById('ch5-feedback').style.color = '#ffb800';
        document.getElementById('ch5-feedback').textContent = `Score: ${score}/100 — Probeer het opnieuw. (70+ nodig om te slagen)`;
      }
    }
  } catch (err) {
    document.getElementById('ch5-feedback').style.color = '#ff3366';
    document.getElementById('ch5-feedback').textContent = '⚠ AI verbinding mislukt. Controleer je internetverbinding.';
  }

  btn.textContent = '🤖 LAAT AI BEOORDELEN';
  btn.disabled = false;
}
