// Fulmen — shared by index.html and start.html.
// One requestAnimationFrame loop drives smooth scroll, reveals and every animation. All motion is
// time-based (dt in seconds), so it runs at the same speed on 60, 120 and 144 Hz screens.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
// frame-rate independent easing: `rate` is the fraction covered per 1/60 s
const ease = (rate, dt) => 1 - Math.pow(1 - rate, dt * 60);
const ticks = []; // per-frame work: f(now ms, viewport height, dt s)
// Layout is read once per frame, before any tick writes a style: ticks ask R(el) for watched elements
// instead of calling getBoundingClientRect between writes (which would force a reflow each time).
const watched = new Set(), rects = new Map();
const watch = (...els) => els.forEach(el => el && watched.add(el));
const R = el => rects.get(el) || el.getBoundingClientRect();

// ---------- smooth scroll ----------
const lenis = window.Lenis && !reduced ? new Lenis({ lerp: .09, smoothWheel: true }) : null;
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href'), t = id.length > 1 && $(id);
  if (!t) return;
  e.preventDefault();
  lenis ? lenis.scrollTo(t, { offset: id === '#top' ? 0 : -10, duration: 1.4 }) : t.scrollIntoView({ behavior: 'smooth' });
}));

// ---------- loader (homepage only): counts to 100 while a dusk orb rises, then fades ----------
const loader = $('#loader');
// load order: HTML + CSS paint first (CSS orbs look the same), WebGL only starts once the page is in
let glOn = false;
const enter = () => { setTimeout(() => (window.requestIdleCallback || setTimeout)(() => glOn = true), 600); document.body.classList.remove('is-loading'); document.body.classList.add('in'); lenis?.start(); requestAnimationFrame(startHero); };
let seen = false;
try { seen = sessionStorage.getItem('fulmen-seen') === '1'; sessionStorage.setItem('fulmen-seen', '1'); } catch {}
if (!loader || seen || reduced) { loader?.classList.add('gone'); enter(); }
else {
  document.body.classList.add('is-loading'); lenis?.stop();
  requestAnimationFrame(() => loader.classList.add('rise')); // not .ready: that is the pricing section class
  const count = $('#count'), t0 = performance.now();
  const tick = now => {
    const p = Math.min(1, (now - t0) / 1500), e = 1 - Math.pow(1 - p, 3);
    count.textContent = String(Math.round(e * 100)).padStart(3, '0');
    if (p < 1) return requestAnimationFrame(tick);
    setTimeout(() => { loader.classList.add('out'); enter(); }, 250);
    setTimeout(() => loader.classList.add('gone'), 1400);
  };
  requestAnimationFrame(tick);
}

// ---------- statements: split into words for the stagger reveal ----------
$$('[data-words]').forEach(el => {
  let i = 0;
  const walk = node => [...node.childNodes].forEach(n => {
    if (n.nodeType !== 3) return walk(n);
    const frag = document.createDocumentFragment();
    n.textContent.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) return frag.append(part);
      const w = document.createElement('span'); w.className = 'w'; w.style.setProperty('--i', i++); w.textContent = part; frag.append(w);
    });
    n.replaceWith(frag);
  });
  walk(el);
});

// ---------- hero: orb status, revenue count-up, drop rows taking turns, filter tabs ----------
const STATUS = ['Scanning drops…', 'Warming the waitlist…', 'Scheduling 14 posts…', 'Holding 312 carts…', 'Crunching sell-through…'];
const rowsEl = $('#rows'), dropRows = rowsEl ? $$('.row-drop', rowsEl) : [];
$$('.row', rowsEl || document).forEach((r, k) => r.style.setProperty('--k', k));
function startHero() {
  if (!rowsEl) return;
  const rev = $('#revenue'), st = $('#sellthrough'), t0 = performance.now() + 700;
  const step = now => {
    const p = clamp((now - t0) / 2200, 0, 1), e = 1 - Math.pow(1 - p, 3);
    rev.textContent = '$' + (48920 * e).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    st.textContent = Math.round(96 * e);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  if (reduced) return;
  const status = $('#orbStatus'); let s = 0;
  setInterval(() => { status.classList.add('swap'); setTimeout(() => { status.textContent = STATUS[s = (s + 1) % STATUS.length]; status.classList.remove('swap'); }, 350); }, 2600);
}
let showRow = () => {};
if (rowsEl) {
  let cur = 0, timer;
  showRow = i => { cur = i; dropRows.forEach((r, k) => r.classList.toggle('on', k === i)); };
  const next = () => { for (let k = 1; k <= dropRows.length; k++) { const i = (cur + k) % dropRows.length; if (!dropRows[i].classList.contains('hide')) return showRow(i); } };
  const auto = () => { clearInterval(timer); if (!reduced) timer = setInterval(next, 2400); };
  dropRows.forEach((r, i) => r.addEventListener('pointerenter', () => { clearInterval(timer); showRow(i); }));
  rowsEl.addEventListener('pointerleave', auto);
  auto();
  $$('.row-filter button').forEach(b => b.addEventListener('click', () => {
    $$('.row-filter button').forEach(x => x.setAttribute('aria-pressed', x === b));
    let n = 0;
    dropRows.forEach(r => { const hide = b.dataset.filter !== 'all' && r.dataset.status !== b.dataset.filter; r.classList.toggle('hide', hide); n += !hide; });
    $('#dropCount').textContent = n;
  }));
}

// ---------- 01 what it is: drifting rows of feature pills; hover one → the orb explains it ----------
const FEATURES = [
  ['Drops', 'Schedule a launch to the second, cap the units, and let Fulmen handle the rush.', ''],
  ['Waitlist', 'Collect sign-ups before the drop and give them first access when it opens.', 'tone-ice'],
  ['Lookbook', 'Drag in your shots and get a campaign page that looks like your brand, not a template.', 'tone-ember'],
  ['Scheduler', 'Plan every post across Instagram, TikTok and Threads around the drop date.', 'tone-ice'],
  ['Community', 'Pull tagged posts from fans onto your drop page, credited and approved by you.', 'tone-violet'],
  ['Fair queue', 'Everyone waits in the same line and gets five minutes to pay. No bots, no oversells.', ''],
  ['Brand kit', 'Your mark, type and voice, stored once and applied everywhere.', 'tone-silver'],
  ['Asset studio', 'One shoot becomes every crop: feed, story, product page and banner.', 'tone-ember'],
  ['Passes', 'Every waitlist spot is a numbered pass that opens the queue on drop day.', 'tone-violet'],
  ['Analytics', 'Sell-through, sources and repeat buyers, the morning after the drop.', 'tone-silver'],
];
const wallRows = $('#wallRows');
if (wallRows) {
  const orb = $('#wallOrb'), key = $('#wallKey'), text = $('#wallText'), TONES = ['tone-ember', 'tone-ice', 'tone-violet', 'tone-silver'];
  for (let r = 0; r < 6; r++) {
    let html = '';
    for (let k = 0; k < 7; k++) { // a feature, then a blank pill of varying width
      const [name, , tone] = FEATURES[(r * 3 + k * 7) % FEATURES.length];
      html += `<button class="chip" type="button" data-k="${name}"><i class="dot ${tone}"></i>${name}</button><span class="ghost" style="--w:${60 + ((r * 5 + k * 3) % 5) * 34}px"></span>`;
    }
    wallRows.insertAdjacentHTML('beforeend', `<div class="wall-row"><div class="wall-track" style="--dur:${64 + r * 9}s">${html}${html.replace(/<button/g, '<button tabindex="-1" aria-hidden="true"')}</div></div>`);
  }
  let last;
  const show = name => {
    if (!name || name === last) return; last = name;
    const [, desc, tone] = FEATURES.find(f => f[0] === name);
    $$('.chip', wallRows).forEach(c => c.classList.toggle('on', c.dataset.k === name));
    key.textContent = name; text.textContent = desc;
    orb.classList.remove(...TONES); tone && orb.classList.add(tone); // WebGL cross-fades the palette
  };
  wallRows.addEventListener('pointerover', e => show(e.target.closest('.chip')?.dataset.k));
  wallRows.addEventListener('focusin', e => show(e.target.closest('.chip')?.dataset.k));
}

// ---------- the loop: smooth scroll, reveals, float nav, then every registered tick ----------
const pending = new Set([...$$('[data-words]'), ...$$('[data-reveal]')]);
if (reduced) { pending.forEach(el => el.classList.add('in')); pending.clear(); }
const floatNav = $('#floatNav'), hero = $('.hero');
let last = performance.now();
const frame = now => {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  lenis?.raf(now);
  const vh = innerHeight;
  if (floatNav && hero) floatNav.classList.toggle('show', scrollY > hero.offsetHeight * .55);
  rects.clear(); for (const el of watched) rects.set(el, el.getBoundingClientRect());
  const shown = [...pending].filter(el => el.getBoundingClientRect().top < vh * .9); // reads first…
  shown.forEach(el => { el.classList.add('in'); pending.delete(el); });           // …then writes
  for (const f of ticks) f(now, vh, dt);
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
const onScreen = (el, vh) => { const r = R(el); return r.bottom > 0 && r.top < vh && r.width > 0; };

// ---------- orbs: "a sun in a glass" ----------
// Every visible orb looks at the pointer. The dark core glides to wherever the cursor is (a critically
// damped spring, so no wobble), stretching slightly with speed; the sphere leans a few px its way; the rim
// brightens on that side. Click/tap ripples the glass. On mouse, a glass ring replaces the cursor over big orbs.
$$('.orb').forEach(o => { if (!$('.orb-sun', o)) $('.orb-fill', o)?.insertAdjacentHTML('afterend', '<span class="orb-sun"></span>'); });
const orbs = $$('.orb:not(.loader-orb)').map((el, i) => ({ el, x: 0, y: 0, vx: 0, vy: 0, h: 0, lx: 0, ly: 0, sq: 0, sa: 0, seed: i * 3.71 + 1.3 }));
orbs.forEach(o => { watch(o.el); if (o.el.offsetWidth > 120) o.el.classList.add('big'); });
if (!reduced) {
  let cx = -1e4, cy = -1e4, rx = -1e4, ry = -1e4, ringOn = false;
  const ring = fine ? document.body.appendChild(Object.assign(document.createElement('div'), { className: 'orb-cursor' })) : null;
  addEventListener('pointermove', e => { cx = e.clientX; cy = e.clientY; }, { passive: true });
  addEventListener('pointerdown', e => { cx = e.clientX; cy = e.clientY; ring?.classList.add('down'); }, { passive: true });
  addEventListener('pointerup', () => ring?.classList.remove('down'), { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { cx = cy = -1e4; ringOn = false; });
  if (ring) document.addEventListener('pointerover', e => { ringOn = !!e.target.closest?.('[data-ring]'); });
  const set = (el, k, v) => el.style.setProperty(k, v);
  orbs.forEach(o => {
    if (fine && o.el.offsetWidth > 120) o.el.dataset.ring = '';
    o.el.addEventListener('pointerdown', e => {
      const r = o.el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const rip = document.createElement('span'); rip.className = 'orb-ripple';
      rip.style.cssText = `--x:${x}px;--y:${y}px;--s:${(r.width / 12).toFixed(1)}`;
      o.el.append(rip); rip.addEventListener('animationend', () => rip.remove());
      o.vx -= (x / r.width * 2 - 1) * 1.6; o.vy -= (y / r.height * 2 - 1) * 1.6; // knock the core back
    });
  });
  const W = 7.5, Z = 1; // spring: natural frequency (rad/s) and damping ratio (1 = critically damped, no overshoot)
  ticks.push((now, vh, dt) => {
    if (ring) {
      if (rx < -1e3) { rx = cx; ry = cy; }
      const k = ease(.3, dt); rx += (cx - rx) * k; ry += (cy - ry) * k;
      ring.style.transform = `translate(${rx.toFixed(1)}px, ${ry.toFixed(1)}px)`;
      ring.classList.toggle('on', ringOn && cx > -1e3);
    }
    for (const o of orbs) {
      const r = R(o.el);
      if (!r.width || r.bottom < 0 || r.top > vh) continue;
      const rad = r.width / 2, dx = cx - (r.left + rad), dy = cy - (r.top + rad), dist = Math.hypot(dx, dy), len = dist / rad;
      const fall = len < 2.5 ? 1 : Math.max(0, 1 - (len - 2.5) / 3.5);       // full within 2.5 radii, gone by 6
      const ux = dist ? dx / dist : 0, uy = dist ? dy / dist : 0, mag = Math.min(len, 1) * fall;
      // spring toward the cursor point (orb units), integrated with dt
      const ax = W * W * (ux * mag - o.x) - 2 * Z * W * o.vx, ay = W * W * (uy * mag - o.y) - 2 * Z * W * o.vy;
      o.vx += ax * dt; o.vy += ay * dt; o.x += o.vx * dt; o.y += o.vy * dt;
      const speed = Math.hypot(o.vx, o.vy);                                  // orb radii per second
      o.sq += (Math.min(.12, speed * .05) - o.sq) * ease(.15, dt);
      if (speed > .05) o.sa = Math.atan2(o.vy, o.vx) * 57.2958;
      o.h += (clamp(1.3 - len * .45, 0, 1) * fall - o.h) * ease(.08, dt);
      o.lx = ux * Math.min(len, .92); o.ly = uy * Math.min(len, .92);
      if (Math.abs(o.x) + Math.abs(o.y) + speed + o.h < .003 && !fall) { if (o.still) continue; o.still = true; } else o.still = false;
      const el = o.el;
      if (!o.gl) { // CSS fallback layers
        const silver = el.classList.contains('orb-silver') || el.classList.contains('tone-silver'), sun = silver ? -.25 : .42;
        set(el, '--bx', (o.x * rad * sun).toFixed(1) + 'px'); set(el, '--by', (o.y * rad * sun).toFixed(1) + 'px');
      }
      set(el, '--ox', (o.x * rad * .035).toFixed(1) + 'px'); set(el, '--oy', (o.y * rad * .035).toFixed(1) + 'px');
      set(el, '--hov', o.h.toFixed(3));
      set(el, '--lx', (50 + o.lx * 50).toFixed(1) + '%'); set(el, '--ly', (50 + o.ly * 50).toFixed(1) + '%');
      set(el, '--rx', (-ux * 16 * mag).toFixed(1) + 'px'); set(el, '--ry', (-uy * 16 * mag).toFixed(1) + 'px');
    }
  });

  // ---------- WebGL orb gradients ----------
  // Big orbs (> 90px) get their own small WebGL canvas, made the first time the orb is on screen (a handful
  // per page, well under the browser's context cap) and drawn straight to screen at ~0.6× resolution, only
  // while visible. The shader redraws the polished CSS gradient (same stops, same three sun ellipses, same
  // 18 s breathing): the dark core follows the cursor, rising from a flat horizon sun to a round one, bends
  // the sky around it like a black hole and spills warm light nearby. Silver is a white sphere lit by the
  // cursor. Tone classes cross-fade by easing the palette uniforms. Small orbs keep the CSS layers.
  const VS = 'attribute vec2 a;varying vec2 v;void main(){v=vec2(a.x,-a.y);gl_Position=vec4(a,0.,1.);}';
  const FS = `precision mediump float;
varying vec2 v;
uniform float t,hov,mode,sq,ang;
uniform vec2 sun,light;
uniform vec3 sky[8];uniform vec3 sc[4];
vec2 toFill(vec2 o){return (o*.5+.5+.12)/1.24;}          // the old CSS layer box: the orb inset by -12%
vec3 grad(float y){y=clamp(y,0.,1.)*7.;float i=floor(y),f=fract(y);vec3 a=sky[0],b=sky[0];
  for(int k=0;k<8;k++){if(float(k)==i)a=sky[k];if(float(k)==min(i+1.,7.))b=sky[k];}
  return mix(a,b,f);}
float ell(vec2 p,vec2 c,vec2 r){return length((p-c)/r);}
void main(){
  vec2 f=toFill(v), L=toFill(light);
  float fo=clamp(hov*1.15,0.,1.); fo=fo*fo*(3.-2.*fo);    // how far the core has left its resting place
  vec2 c=mix(vec2(.5,.79),toFill(sun),fo);
  float b=.5-.5*cos(t*.349);                               // 18 s breathing
  vec3 col;
  if(mode<.999){
    vec2 dc=f-c; float dd=dot(dc,dc);
    vec2 fs=f-dc*fo*.7*exp(-dd/.04);                       // the sky bends around the core
    fs=(fs-.5)/(1.+.05*b)+.5+vec2(0.,.03*b);
    col=grad(fs.y);
    col=mix(col,sc[3],fo*.32*exp(-dd/.05));                // warm light spills around it
    vec2 d=f-c; float cs=cos(-ang),sn=sin(-ang);           // stretch along its velocity
    d=mat2(cs,-sn,sn,cs)*d; d.x/=1.+sq; d.y/=1.-sq*.6; d=mat2(cs,sn,-sn,cs)*d; vec2 fp=c+d;
    vec2 rs=vec2(mix(1.,.6,fo),mix(1.,1.04,fo));          // flat horizon sun → smaller round one
    float eh=ell(fp,c+vec2(0.,.07*(1.-fo)),vec2(.85,.42)*vec2(mix(1.,.6,fo),mix(1.,1.25,fo)));
    col=mix(col,sc[3],.7*(1.-smoothstep(0.,.72,eh)));     // haze
    float er=ell(fp,c,vec2(.44,.28)*rs);
    vec3 rc=mix(sc[1],sc[2],smoothstep(.28,.52,er))*(1.+hov*.12);
    col=mix(col,rc,er<.28?1.:1.-smoothstep(.46,1.06,er));  // ember rim
    float ec=ell(fp,c,vec2(.31,.18)*rs);
    col=mix(col,sc[0],1.-smoothstep(.44,1.06,ec));         // dark core
  }
  if(mode>.001){                                           // silver: highlight toward the cursor, shade away
    vec2 hc=vec2(.36,.28)+(L-vec2(.36,.28))*.42*hov+vec2(0.,-.02*b);
    float tt=length(f-hc)/.963;
    vec3 m=tt<.22?mix(vec3(1.),vec3(.965),tt/.22):tt<.52?mix(vec3(.965),vec3(.863),(tt-.22)/.3):tt<.78?mix(vec3(.863),vec3(.741),(tt-.52)/.26):mix(vec3(.741),vec3(.639),clamp((tt-.78)/.22,0.,1.));
    m*=1.-.2*(1.-smoothstep(0.,.46,length(f-(vec2(.7,.78)-(L-vec2(.5))*.22*hov))));
    col=mode>=.999?m:mix(col,m,mode);
  }
  col+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;   // dither
  gl_FragColor=vec4(col,1.);
}`;
  const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16) / 255);
  const resample = stops => Array.from({ length: 8 }, (_, k) => {
    const y = k / 7, j = stops.findIndex(s => s[0] >= y), [y1, c1] = stops[Math.max(0, j - 1)], [y2, c2] = stops[j < 0 ? stops.length - 1 : j];
    const f = y2 > y1 ? (y - y1) / (y2 - y1) : 0; return hex(c1).map((a, i) => a + (hex(c2)[i] - a) * f);
  }).flat();
  const PAL = {
    dusk: [[[0, '#283050'], [.26, '#333c60'], [.44, '#545d7d'], [.57, '#9a98a5'], [.65, '#dbb59d'], [.86, '#4c3b44'], [1, '#17121a']], ['#0a080e', '#ff8d3f', '#d9432b', '#ffa878']],
    ember: [[[0, '#3b2230'], [.4, '#6b3a3e'], [.62, '#e08a5c'], [1, '#3a1a1a']], ['#120806', '#ffb052', '#ff5a2a', '#ff9a60']],
    ice: [[[0, '#1c2440'], [.35, '#2c3a64'], [.6, '#7e9cc4'], [.68, '#c9e2f2'], [1, '#1a2236']], ['#070b12', '#8fd3ff', '#3f7cff', '#9fc8ff']],
    violet: [[[0, '#221d3f'], [.38, '#3a3266'], [.58, '#8f86b8'], [.66, '#e2c6d6'], [1, '#1d1628']], ['#0b0812', '#d79bff', '#7a4dff', '#c9a0ff']],
  };
  for (const k in PAL) PAL[k] = { sky: resample(PAL[k][0]), sc: PAL[k][1].map(hex).flat() };
  PAL.silver = PAL.dusk;
  const toneOf = el => el.classList.contains('orb-silver') || el.classList.contains('tone-silver') ? 'silver'
    : el.classList.contains('tone-ember') ? 'ember' : el.classList.contains('tone-ice') ? 'ice' : el.classList.contains('tone-violet') ? 'violet' : 'dusk';
  const setupGL = o => {
    const cv = document.createElement('canvas'); cv.className = 'orb-gl'; cv.setAttribute('aria-hidden', 'true');
    const gl = cv.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    if (!gl) return;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS); if (!vs || !fs) return;
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.bindAttribLocation(prog, 0, 'a'); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['t', 'hov', 'mode', 'sq', 'ang', 'sun', 'light', 'sky', 'sc'].forEach(k => U[k] = gl.getUniformLocation(prog, k));
    const tone = toneOf(o.el);
    Object.assign(o, { cv, ctx: gl, U, pal: { sky: PAL[tone].sky.slice(), sc: PAL[tone].sc.slice() }, mode: tone === 'silver' ? 1 : 0, gl: true });
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); o.gl = false; o.el.classList.remove('gl'); cv.remove(); });
    o.el.prepend(cv); o.el.classList.add('gl');
    cv.width = cv.height = Math.max(64, Math.min(420, Math.round(o.el.offsetWidth * dpr * .6))); gl.viewport(0, 0, cv.width, cv.width); // final size up front
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // first draw finishes the shader compile now, not mid-scroll
  };
  // Shader compiles cost ~80 ms, so every big orb's canvas is prepared in idle time after load, one per
  // idle slot, instead of the first time the orb scrolls into view (that caused a hitch while scrolling).
  const idle = window.requestIdleCallback || (cb => setTimeout(cb, 120));
  const warm = () => { if (!glOn) return setTimeout(warm, 300); const o = orbs.find(o => !o.tried && o.el.offsetWidth > 120); if (!o) return; o.tried = true; setupGL(o); idle(warm); };
  setTimeout(() => idle(warm), 1200);
  const dpr = Math.min(2, devicePixelRatio || 1), t0 = performance.now();
  // canvas size follows the orb's layout width (ResizeObserver), not its on-screen rect: rects include
  // transforms (a stacking card scales its orb every frame) and resizing a canvas reallocates its buffer
  const sizeRO = new ResizeObserver(es => es.forEach(e => { e.target._w = e.contentRect.width; }));
  orbs.forEach(o => sizeRO.observe(o.el));
  ticks.push((now, vh, dt) => {
    const t = (now - t0) / 1000, k = ease(.08, dt);
    for (const o of orbs) {
      const r = R(o.el);
      if (r.width < 120 || r.bottom < -vh * .5 || r.top > vh * 1.5 || r.right < 0 || r.left > innerWidth) continue; // starts half a screen early, so a first draw never lands mid-scroll
      if (!o.tried) { if (!glOn) continue; o.tried = true; setupGL(o); }
      if (!o.gl) continue;
      const S = Math.max(64, Math.min(420, Math.round((o.el._w || r.width) * dpr * .6)));
      if (o.cv.width !== S) o.cv.width = o.cv.height = S;
      const tone = toneOf(o.el), tgt = PAL[tone], m = tone === 'silver' ? 1 : 0;
      for (let q = 0; q < 24; q++) o.pal.sky[q] += (tgt.sky[q] - o.pal.sky[q]) * k;
      for (let q = 0; q < 12; q++) o.pal.sc[q] += (tgt.sc[q] - o.pal.sc[q]) * k;
      o.mode += (m - o.mode) * k; if (Math.abs(o.mode - m) < .002) o.mode = m;
      const gl = o.ctx, U = o.U;
      gl.viewport(0, 0, S, S);
      gl.uniform1f(U.t, t + o.seed); gl.uniform1f(U.hov, o.h); gl.uniform1f(U.mode, o.mode);
      gl.uniform1f(U.sq, o.sq); gl.uniform1f(U.ang, o.sa / 57.2958);
      gl.uniform2f(U.sun, o.x, o.y); gl.uniform2f(U.light, o.lx, o.ly);
      gl.uniform3fv(U.sky, o.pal.sky); gl.uniform3fv(U.sc, o.pal.sc);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  });
}

// ---------- Ask Fulmen: ⌘K assistant card that searches drops and answers ----------
const ask = $('#ask');
if (ask) {
  const input = $('#askInput'), answer = $('#askAnswer'), results = $('#askResults'), card = $('.ask-card', ask);
  const DROPS = dropRows.map((r, i) => ({ i, name: $('.row-name b', r).textContent, label: $('.row-name', r).lastChild.textContent, img: $('img', r).getAttribute('src'), status: r.dataset.status === 'live' ? 'Live' : 'Upcoming' }));
  const REPLIES = [
    [/004|nomad|denim|jacket/i, 'Drop 004 is 98% sold — 294 of 300 jackets are gone. Six left in S and M; at this pace it sells out in about four minutes.'],
    [/hoodie|fleece|tundra|restock/i, 'Tundra Club’s fleece hoodie restocks Friday at 18:00. 1,204 people are on the waitlist, and each one holds a numbered pass.'],
    [/hat|halfmoon|brim/i, 'Halfmoon’s wide-brim hat is 82% sold with 2 h 31 m left in the window. Most buyers came from the lookbook page.'],
    [/overshirt|selvedge|raw arc/i, 'Raw Arc’s selvedge overshirt opens Saturday. 866 people are waiting; the lookbook goes live Thursday.'],
    [/price|plan|cost|sold|sell|fit/i, 'Under about $2,450 a month Studio is cheapest, up to $15,000 Label, and above that House. Drag the sun on the pricing horizon to see your number.'],
  ];
  let opener, typing;
  const type = text => {
    clearInterval(typing); ask.classList.add('thinking'); answer.textContent = '';
    setTimeout(() => {
      let k = 0;
      typing = setInterval(() => { answer.textContent = text.slice(0, ++k); if (k >= text.length) { clearInterval(typing); ask.classList.remove('thinking'); } }, reduced ? 0 : 14);
    }, reduced ? 0 : 550);
  };
  const search = q => {
    const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const hits = q.trim() ? DROPS.filter(d => words.some(w => (d.name + ' ' + d.label).toLowerCase().includes(w))) : [];
    results.innerHTML = hits.map(d => `<button type="button" data-i="${d.i}"><img src="${d.img}" alt=""><span><b>${d.name}</b>${d.label}</span><em>${d.status}</em></button>`).join('');
    return hits;
  };
  const respond = q => {
    const hits = search(q), hit = REPLIES.find(([re]) => re.test(q));
    type(hit ? hit[1] : hits.length ? `Found ${hits.length} drop${hits.length > 1 ? 's' : ''} for “${q}”.` : 'Nothing matched. Try a label, a product, or ask how a drop is doing.');
  };
  const open = () => { opener = document.activeElement; ask.hidden = false; lenis?.stop(); requestAnimationFrame(() => ask.classList.add('open')); setTimeout(() => input.focus(), 50); };
  const close = () => { ask.classList.remove('open'); lenis?.start(); clearInterval(typing); setTimeout(() => { ask.hidden = true; }, 350); opener?.focus?.(); };
  $$('[data-ask]').forEach(b => b.addEventListener('click', open));
  $('[data-ask-close]', ask).addEventListener('click', close);
  ask.addEventListener('click', e => { if (e.target === ask) close(); });
  addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ask.hidden ? open() : close(); }
    if (e.key === 'Escape' && !ask.hidden) close();
  });
  $('#askExpand').addEventListener('click', () => card.classList.toggle('wide'));
  input.addEventListener('input', () => search(input.value));
  $('#askForm').addEventListener('submit', e => { e.preventDefault(); if (input.value.trim()) respond(input.value.trim()); });
  $('.ask-bar .ask-ico', ask).addEventListener('click', () => type('Voice is coming soon. For now, type and I’ll answer.'));
  $('#askChips').addEventListener('click', e => { if (e.target.tagName === 'BUTTON') { input.value = e.target.textContent; respond(input.value); } });
  results.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    close(); showRow(+b.dataset.i);
    lenis ? lenis.scrollTo(0, { duration: 1.2 }) : scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ---------- 02 product: a dusk globe; orders fly from Leh to buyers, their pills tick ✓, the feed fills ----------
const globeCv = $('#globe');
if (globeCv && window.LAND) {
  const wrap = $('#globeWrap'), g = globeCv.getContext('2d'), D = Math.PI / 180, TAU = Math.PI * 2;
  const ORIGIN = [34.15, 77.58];                       // Leh — Nomad Supply
  const BUYERS = [                                      // lat, lon, card city, card side x/y, feed entry
    [51.51, -0.13, 'London', -1, -1, ['crew-1', '@tenzin.wears', 'London', '£110']],
    [52.52, 13.40, 'Berlin', 1, 1, ['crew-4', '@offgrid.ari', 'Berlin', '€128']],
    [-1.29, 36.82, 'Nairobi', -1, 1, ['sku-1', '@kiln.and.co', 'Nairobi', 'KSh 16,500']],
    [6.52, 3.38, null, 0, 0, ['crew-3', '@praia.lagos', 'Lagos', '₦198,000']],
    [25.2, 55.27, null, 0, 0, ['sku-2', '@raw.arc', 'Dubai', 'AED 470']],
  ];
  const vec = (lat, lon) => [Math.cos(lat * D) * Math.cos(lon * D), Math.sin(lat * D), Math.cos(lat * D) * Math.sin(lon * D)];
  const O = vec(...ORIGIN), B = BUYERS.map(b => vec(b[0], b[1]));
  const cards = Object.fromEntries($$('.gcard', wrap).map(c => [c.dataset.city, c]));
  watch(wrap);
  const csize = new Map(), ro = new ResizeObserver(es => es.forEach(e => csize.set(e.target, [e.target.offsetWidth, e.target.offsetHeight])));
  Object.values(cards).forEach(c => { csize.set(c, [c.offsetWidth, c.offsetHeight]); ro.observe(c); });
  const P = [];
  for (let i = 0; i < LAND.length; i += 2) {
    const v = vec(LAND[i] / 10, LAND[i + 1] / 10);
    P.push(v[0], v[1], v[2], [O, ...B].some(c => v[0] * c[0] + v[1] * c[1] + v[2] * c[2] > Math.cos(7 * D)) ? 1 : 0);
  }
  const arc = (a, b, n = 48) => { // great circle, lifted by sin(πt)
    const om = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), so = Math.sin(om), pts = [];
    for (let k = 0; k <= n; k++) {
      const t = k / n, s1 = Math.sin((1 - t) * om) / so, s2 = Math.sin(t * om) / so, lift = 1 + Math.sin(Math.PI * t) * om * .32;
      pts.push([(a[0] * s1 + b[0] * s2) * lift, (a[1] * s1 + b[1] * s2) * lift, (a[2] * s1 + b[2] * s2) * lift]);
    }
    return pts;
  };
  const ARCS = B.map(b => arc(O, b)), BUCKETS = Array.from({ length: 26 }, () => []);
  // the sphere is drawn like a dusk orb: sky stops top→bottom, haze + ember glow near the floor
  const SKY = [[0, '#2a3152'], [.3, '#353e60'], [.5, '#4e5674'], [.66, '#7d7a8e'], [.78, '#a98d8a'], [.9, '#5a4248'], [1, '#1e161c']];
  let w = 0, h = 0, R = 0, ox = 0, oy = 0, skyG, hazeG, gloss, halo, sprites;
  const size = () => {
    const dpr = Math.min(2, devicePixelRatio || 1); w = wrap.clientWidth; h = wrap.clientHeight;
    globeCv.width = w * dpr; globeCv.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.min(w * .4, h * .42); ox = w * .5; oy = h * .52;
    skyG = g.createLinearGradient(0, oy - R, 0, oy + R); SKY.forEach(([p, c]) => skyG.addColorStop(p, c));
    hazeG = g.createRadialGradient(ox, oy + R * .78, 0, ox, oy + R * .78, R * .95);
    hazeG.addColorStop(0, 'rgba(255,168,120,.55)'); hazeG.addColorStop(.35, 'rgba(255,141,63,.25)'); hazeG.addColorStop(1, 'rgba(255,141,63,0)');
    gloss = g.createRadialGradient(ox, oy - R * .95, 0, ox, oy - R * .95, R * 1.1);
    gloss.addColorStop(0, 'rgba(255,255,255,.16)'); gloss.addColorStop(.5, 'rgba(255,255,255,0)');
    halo = g.createRadialGradient(ox, oy, R * .92, ox, oy, R * 1.22);
    halo.addColorStop(0, 'rgba(138,147,200,.22)'); halo.addColorStop(1, 'rgba(138,147,200,0)');
    sprites = { small: orbSprite(5.5, false, dpr), lit: orbSprite(7, true, dpr), origin: orbSprite(10, true, dpr) };
  };
  size(); new ResizeObserver(size).observe(wrap);
  let drag = 0, dragV = 0, dragging = false, lastX = 0;
  globeCv.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; dragV = 0; globeCv.setPointerCapture(e.pointerId); });
  globeCv.addEventListener('pointermove', e => { if (!dragging) return; const d = (e.clientX - lastX) * -.3; drag += d; dragV = d * 60; lastX = e.clientX; });
  addEventListener('pointerup', () => { dragging = false; });
  globeCv.addEventListener('pointercancel', () => { dragging = false; });
  // the live feed: each landed order slides in on top
  const feed = $('#feed'), countEl = $('#orderCount'); let orders = 2114, cycleSeen = -1;
  const pushFeed = ([img, who, city, amt]) => {
    feed.insertAdjacentHTML('afterbegin', `<li><img src="assets/${img}.webp" alt=""><span><b>${who}</b>${city}</span><em>${amt}</em><i class="check" aria-hidden="true"></i></li>`);
    while (feed.children.length > 4) feed.lastElementChild.remove();
    countEl.textContent = (++orders).toLocaleString('en-US');
  };
  const T = 8, landed = new Set();
  ticks.push((now, vh, dt) => {
    if (!onScreen(wrap, vh)) return;
    if (!dragging) { drag += dragV * dt; dragV *= Math.pow(.05, dt); }    // inertia
    const t = now / 1000, view = 30 + (reduced ? 0 : Math.sin(t * .12) * 14) + drag, lat0 = 22;
    const cl = Math.cos(view * D), sl = Math.sin(view * D), cp = Math.cos(lat0 * D), sp = Math.sin(lat0 * D);
    const proj = v => { const X = v[2] * cl - v[0] * sl, Z = v[0] * cl + v[2] * sl, Y2 = v[1] * cp - Z * sp, Z2 = v[1] * sp + Z * cp; return [ox + X * R, oy - Y2 * R, Z2]; };
    const visible = p => p[2] > 0 || Math.hypot(p[0] - ox, p[1] - oy) > R;
    g.clearRect(0, 0, w, h);
    // halo, sphere, haze, gloss, rim — the globe reads as a big dusk orb
    g.fillStyle = halo; g.beginPath(); g.arc(ox, oy, R * 1.22, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(ox, oy, R, 0, TAU); g.clip();
    g.fillStyle = skyG; g.fillRect(ox - R, oy - R, R * 2, R * 2);
    g.fillStyle = 'rgba(6,6,10,.42)'; g.fillRect(ox - R, oy - R, R * 2, R * 2);   // dim so the dots read
    g.fillStyle = hazeG; g.fillRect(ox - R, oy - R, R * 2, R * 2);
    g.fillStyle = gloss; g.fillRect(ox - R, oy - R, R * 2, R * 2);
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 1; g.beginPath(); g.arc(ox, oy, R, 0, TAU); g.stroke();
    // graticule
    g.strokeStyle = 'rgba(255,255,255,.07)';
    for (let la = -60; la <= 60; la += 30) { g.beginPath(); let pen = false; for (let lo = -180; lo <= 180; lo += 4) { const p = proj(vec(la, lo)); if (p[2] > 0) { pen ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); pen = true; } else pen = false; } g.stroke(); }
    for (let lo = -180; lo < 180; lo += 30) { g.beginPath(); let pen = false; for (let la = -84; la <= 84; la += 4) { const p = proj(vec(la, lo)); if (p[2] > 0) { pen ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); pen = true; } else pen = false; } g.stroke(); }
    // land: soft white dots; regions near a buyer brighter and warmer. Dots are bucketed by colour + depth
    // and each bucket is filled once (≈26 fills a frame instead of one per dot).
    for (const b of BUCKETS) b.length = 0;
    for (let i = 0; i < P.length; i += 4) {
      const X = P[i + 2] * cl - P[i] * sl, Z = P[i] * cl + P[i + 2] * sl, Z2 = P[i + 1] * sp + Z * cp;
      if (Z2 <= 0) continue;
      BUCKETS[P[i + 3] * 13 + Math.min(12, Z2 * 13 | 0)].push(ox + X * R, oy - (P[i + 1] * cp - Z * sp) * R);
    }
    BUCKETS.forEach((b, k) => {
      if (!b.length) return;
      const hot = k >= 13, z = (k % 13 + .5) / 13, s = .7 + z * 1.2 + (hot ? .4 : 0);
      g.fillStyle = hot ? `rgba(255,236,220,${(.45 + z * .5).toFixed(2)})` : `rgba(226,228,240,${(.1 + z * .42).toFixed(2)})`;
      g.beginPath(); for (let q = 0; q < b.length; q += 2) g.rect(b[q] - s / 2, b[q + 1] - s / 2, s, s); g.fill();
    });
    const cyc = reduced ? T - 1 : t % T, cycle = Math.floor(t / T);
    if (cycle !== cycleSeen) { cycleSeen = cycle; landed.clear(); }
    const e0 = proj(O);
    ARCS.forEach((pts, i) => {
      const dep = i * .7, fly = 2.2, prog = clamp((cyc - dep) / fly, 0, 1), end = proj(B[i]), done = prog >= 1 && cyc < T - .6;
      const lg = g.createLinearGradient(e0[0], e0[1], end[0], end[1]);
      lg.addColorStop(0, 'rgba(255,190,150,.85)'); lg.addColorStop(.5, 'rgba(219,181,157,.6)'); lg.addColorStop(1, 'rgba(163,171,217,.8)');
      g.strokeStyle = lg; g.lineWidth = 1.3; g.beginPath();
      let pen = false;
      for (const v of pts) { const p = proj(v); if (visible(p)) { pen ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); pen = true; } else pen = false; }
      g.stroke();
      if (prog > 0 && prog < 1) { // comet: a soft white-peach glow
        const p = proj(pts[Math.round(prog * (pts.length - 1))]);
        if (visible(p)) { const cg = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], 9); cg.addColorStop(0, 'rgba(255,245,235,1)'); cg.addColorStop(.35, 'rgba(255,200,160,.7)'); cg.addColorStop(1, 'rgba(255,200,160,0)'); g.fillStyle = cg; g.beginPath(); g.arc(p[0], p[1], 9, 0, TAU); g.fill(); }
      }
      if (end[2] > 0) stamp(done ? sprites.lit : sprites.small, end[0], end[1]);
      if (done && !landed.has(i)) { landed.add(i); if (!reduced) pushFeed(BUYERS[i][5]); }
      const card = BUYERS[i][2] && cards[BUYERS[i][2]];
      if (card) {
        const [cw, ch] = csize.get(card), [, , , sx, sy] = BUYERS[i];
        const x = clamp(end[0] + (sx > 0 ? 16 : -cw - 16), 12, w - cw - 12), y = clamp(end[1] + (sy > 0 ? 14 : -ch - 14), 12, h - ch - 12);
        card.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        card.classList.toggle('on', end[2] > .2); card.classList.toggle('done', done);
        if (card.classList.contains('gcard-ship')) {
          const pct = done ? Math.round(Math.min(1, (cyc - dep - fly) / (T - dep - fly - 1.2)) * 54) : 0;
          $('#shipBar').style.setProperty('--p', pct + '%'); $('#shipPct').textContent = pct + '%';
        }
      }
    });
    if (e0[2] > 0) { // Leh: a larger orb with a soft pulse
      const pr = 14 + ((t * 18) % 18);
      g.strokeStyle = `rgba(255,200,160,${(.5 * (1 - (pr - 14) / 18)).toFixed(2)})`; g.beginPath(); g.arc(e0[0], e0[1], pr, 0, TAU); g.stroke();
      stamp(sprites.origin, e0[0], e0[1]);
    }
  });
  // the globe's markers: tiny dusk orbs (sky gradient, ember core low, white rim, soft glow), drawn once
  // into small sprite canvases on resize and stamped with drawImage each frame
  function orbSprite(r, lit, dpr) {
    const pad = 16, S = (r + pad) * 2, c = document.createElement('canvas'), x = c.getContext('2d');
    c.width = c.height = Math.ceil(S * dpr); x.scale(dpr, dpr); const m = S / 2;
    if (lit) { const gl = x.createRadialGradient(m, m, r, m, m, r + pad); gl.addColorStop(0, 'rgba(255,160,110,.45)'); gl.addColorStop(1, 'rgba(255,160,110,0)'); x.fillStyle = gl; x.fillRect(0, 0, S, S); }
    const sg = x.createLinearGradient(0, m - r, 0, m + r);
    sg.addColorStop(0, '#3a4466'); sg.addColorStop(.5, '#9a98a5'); sg.addColorStop(.68, '#dbb59d'); sg.addColorStop(1, '#2a1a20');
    x.fillStyle = sg; x.beginPath(); x.arc(m, m, r, 0, TAU); x.fill();
    if (lit) { const cg = x.createRadialGradient(m, m + r * .55, 0, m, m + r * .55, r * .8); cg.addColorStop(0, '#0a080e'); cg.addColorStop(.45, '#ff8d3f'); cg.addColorStop(1, 'rgba(255,141,63,0)'); x.fillStyle = cg; x.beginPath(); x.arc(m, m, r, 0, TAU); x.fill(); }
    x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 1; x.beginPath(); x.arc(m, m, r, 0, TAU); x.stroke();
    c.size = S; return c;
  }
  function stamp(c, x, y) { g.drawImage(c, x - c.size / 2, y - c.size / 2, c.size, c.size); }
}

// ---------- 03 five tools: stacked cards; the ones underneath shrink and dim as the next arrives ----------
const stackCards = $$('.tool-card');
if (stackCards.length) {
  watch(...stackCards);
  let tops = [], heights = [];                                    // sticky offsets + heights, measured on resize only
  const measure = () => { tops = stackCards.map(c => parseFloat(getComputedStyle(c).top)); heights = stackCards.map(c => c.offsetHeight); };
  measure(); new ResizeObserver(measure).observe($('#stack'));
  const last = [];
  ticks.push((now, vh) => {
    stackCards.forEach((c, i) => {
      const next = stackCards[i + 1]; if (!next) return;
      const p = clamp(1 - (R(next).top - tops[i + 1]) / heights[i], 0, 1);   // 0 = next card far away, 1 = it covers this one
      if (Math.abs(p - (last[i] ?? -1)) < .002) return; last[i] = p;         // only write when it changes
      c.style.setProperty('--s', (1 - p * .05).toFixed(4)); c.style.setProperty('--dim', (p * .45).toFixed(3));
    });
  });
  // a live countdown in the Drops card, and the Community approve button
  const timer = $('#dropTimer'), end = Date.now() + (2 * 3600 + 14 * 60 + 9) * 1000, pad = n => String(n).padStart(2, '0');
  const clock = () => { const s = Math.max(0, Math.round((end - Date.now()) / 1000)); timer.textContent = s ? `${pad(s / 3600 | 0)}:${pad(s / 60 % 60 | 0)}:${pad(s % 60)}` : 'LIVE'; };
  if (timer) { clock(); setInterval(clock, 1000); }
  $('[data-approve]')?.addEventListener('click', e => {
    const b = e.currentTarget, row = b.closest('.approve'), ok = !row.classList.contains('ok');
    row.classList.toggle('ok', ok); b.textContent = ok ? 'Approved ✓' : 'Approve';
    $('#tagCount').textContent = ok ? 313 : 312;
  });
}

// ---------- 04 waitlist passes: a deck. Drag the front pass sideways → it goes to the back.
//            Tap a pass behind → it comes forward. Claim → a new pass drops in from above. ----------
const deck = $('#deckCards');
if (deck) {
  let cards = $$('.pass', deck), printed = 1, settle = 0;
  watch(deck);
  const PEEK = 58;
  const layout = () => {
    const ch = cards[cards.length - 1].offsetHeight || deck.offsetWidth / 1.58;
    cards.forEach((c, i) => {
      const front = i === cards.length - 1;
      c.style.setProperty('--y', i * PEEK + 'px'); c.style.zIndex = i + 1;
      c.classList.toggle('front', front); c.setAttribute('aria-pressed', front);
      if (!front) ['--tx', '--ty'].forEach(k => c.style.setProperty(k, '0deg'));
    });
    deck.style.setProperty('--sh', (cards.length - 1) * PEEK + ch + 'px');
  };
  layout(); new ResizeObserver(layout).observe(deck);
  const reorder = (c, toFront) => { settle = performance.now() + 800; cards = cards.filter(x => x !== c); toFront ? cards.push(c) : cards.unshift(c); layout(); };
  // drag the front pass
  let drag = null, tx = 0, ty = 0, px = 0, py = 0, over = false;
  deck.addEventListener('pointerdown', e => {
    const c = e.target.closest('.pass'); if (!c) return;
    if (!c.classList.contains('front')) return reorder(c, true);
    drag = { c, x: e.clientX, dx: 0 }; c.setPointerCapture(e.pointerId); c.classList.add('live', 'dragging');
  });
  deck.addEventListener('pointermove', e => {
    const r = deck.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width * 2 - 1; ty = (e.clientY - r.top) / r.height * 2 - 1; over = true;
    if (!drag) return;
    drag.dx = e.clientX - drag.x;
    drag.c.style.setProperty('--dx', drag.dx + 'px'); drag.c.style.setProperty('--rot', (drag.dx * .04) + 'deg');
  });
  const release = () => {
    if (!drag) return;
    const { c, dx } = drag; drag = null; c.classList.remove('live', 'dragging');
    if (Math.abs(dx) > deck.offsetWidth * .28) {        // fling it out, then tuck it in at the back
      c.style.setProperty('--dx', Math.sign(dx) * deck.offsetWidth * 1.1 + 'px'); c.style.setProperty('--rot', Math.sign(dx) * 14 + 'deg');
      setTimeout(() => { c.style.setProperty('--dx', '0px'); c.style.setProperty('--rot', '0deg'); reorder(c, false); }, 260);
    } else { c.style.setProperty('--dx', '0px'); c.style.setProperty('--rot', '0deg'); }
  };
  addEventListener('pointerup', release); addEventListener('pointercancel', release);
  deck.addEventListener('pointerleave', () => { tx = ty = 0; over = false; });
  deck.addEventListener('keydown', e => { // keyboard: Enter on a pass behind brings it forward
    const c = e.target.closest('.pass'); if (c && (e.key === 'Enter' || e.key === ' ') && !c.classList.contains('front')) { e.preventDefault(); reorder(c, true); }
  });
  // the front pass tilts toward the cursor with a sliding holographic sheen
  ticks.push((now, vh, dt) => {
    if (reduced || !onScreen(deck, vh)) return;
    const f = cards[cards.length - 1], busy = now < settle || drag;
    const k = ease(.1, dt); px += ((busy ? 0 : tx) - px) * k; py += ((busy ? 0 : ty) - py) * k;
    if (!drag) f.classList.toggle('live', !busy && (over || Math.abs(px) + Math.abs(py) > .003));
    f.style.setProperty('--tx', (-py * 8).toFixed(2) + 'deg'); f.style.setProperty('--ty', (px * 11).toFixed(2) + 'deg');
    f.style.setProperty('--sx', (50 - px * 50).toFixed(1) + '%');
  });
  // typing previews the name on the front Nomad pass; Claim drops a new numbered pass in from above
  const form = $('#passForm'), input = $('#passInput'), btn = $('button', form);
  input.addEventListener('input', () => { const f = cards[cards.length - 1]; if (f.classList.contains('pass-mine')) $('.pass-name', f).textContent = input.value.trim() || f.dataset.name || 'Tenzin D.'; });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = input.value.trim(); if (!name) return input.focus();
    $$('.pass-mine', deck).forEach(p => { $('.pass-name', p).textContent = p.dataset.name || 'Tenzin D.'; });
    const c = $('.pass-mine', deck).cloneNode(true);
    c.className = 'pass pass-mine incoming'; c.removeAttribute('style'); c.dataset.name = name;
    $('.pass-no', c).textContent = '#' + String(++printed).padStart(4, '0'); $('.pass-name', c).textContent = name;
    c.style.setProperty('--y', (cards.length - 1) * PEEK + 'px'); c.style.zIndex = 99;
    deck.append(c); cards.push(c);
    if (cards.length > 5) { const old = cards.shift(); old.classList.add('gone'); setTimeout(() => old.remove(), 600); }
    requestAnimationFrame(() => requestAnimationFrame(() => { c.classList.remove('incoming'); settle = performance.now() + 900; layout(); }));
    input.value = ''; btn.textContent = 'Claimed ✓'; setTimeout(() => btn.textContent = 'Claim pass', 1800);
  });
}

// ---------- 05 asset studio: the crop window reshapes for each channel ----------
const cropView = $('#cropView');
if (cropView) {
  const win = $('#cropWin'), tag = $('#cropTag'), btns = $$('#cropList button'), stage = $('#cropStage');
  let cur = 0, hover = false;
  const place = i => {
    cur = i; const b = btns[i], r = +b.dataset.r, fx = +b.dataset.x;
    btns.forEach(x => x.setAttribute('aria-selected', x === b));
    const W = cropView.clientWidth, H = cropView.clientHeight;
    let ch = H * .8, cw = ch * r; if (cw > W * .88) { cw = W * .88; ch = cw / r; }
    Object.assign(win.style, { width: cw + 'px', height: ch + 'px', left: clamp(fx * W - cw / 2, W * .04, W * .96 - cw) + 'px', top: (H - ch) / 2 + 'px' });
    tag.textContent = `${$('span:nth-child(2)', b).lastChild.textContent} · ${b.dataset.px}`;
  };
  btns.forEach((b, i) => b.addEventListener('click', () => place(i)));
  stage.addEventListener('pointerenter', () => hover = true);
  stage.addEventListener('pointerleave', () => hover = false);
  new ResizeObserver(() => place(cur)).observe(cropView);
  if (!reduced) setInterval(() => { if (!hover && !document.hidden) place((cur + 1) % btns.length); }, 2800);
  const bar = $('#exportBar'), ex = $('#exportBtn');
  ex.addEventListener('click', () => {
    if (ex.disabled) return; ex.disabled = true; ex.textContent = 'Exporting…';
    bar.style.transition = 'none'; bar.style.setProperty('--p', '0%'); void bar.offsetWidth;
    bar.style.transition = 'width 2.2s cubic-bezier(.3,.1,.3,1)'; bar.style.setProperty('--p', '100%');
    setTimeout(() => { ex.textContent = 'Exported ✓'; setTimeout(() => { ex.textContent = 'Export all'; ex.disabled = false; }, 2200); }, 2300);
  });
}

// ---------- 06 live now: a wheel of cities; the one at the orb shows its drop + local time ----------
const CITIES = [
  ['Leh, India', 'Asia/Kolkata', 'Nomad Supply', 'Raw Denim Jacket', 'denim', '98%', '2,114'],
  ['Auckland, New Zealand', 'Pacific/Auckland', 'Saltwork', 'Merino Knit', 'crew-4', '37%', '412'],
  ['Sydney, Australia', 'Australia/Sydney', 'Dune Sport', 'Studio Tee', 'sku-1', '52%', '655'],
  ['Tokyo, Japan', 'Asia/Tokyo', 'Raw Arc', 'Selvedge Overshirt', 'sku-2', '44%', '866'],
  ['Seoul, South Korea', 'Asia/Seoul', 'Halfmoon', 'Wide-Brim Hat', 'lookbook', '82%', '1,020'],
  ['Shanghai, China', 'Asia/Shanghai', 'Kiln & Co', 'Heavy Knit', 'sku-4', '61%', '730'],
  ['Helsinki, Finland', 'Europe/Helsinki', 'Northline', 'Rain Shell', 'crew-2', '29%', '388'],
  ['Oslo, Norway', 'Europe/Oslo', 'Tundra Club', 'Fleece Hoodie', 'crew-1', '64%', '1,204'],
  ['Copenhagen, Denmark', 'Europe/Copenhagen', 'Vesper', 'Field Cap', 'closeup', '71%', '540'],
  ['London, UK', 'Europe/London', 'Oxbow', 'Waxed Jacket', 'crew-3', '48%', '920'],
  ['Madrid, Spain', 'Europe/Madrid', 'Sol Club', 'Linen Shirt', 'sku-1', '33%', '301'],
  ['Berlin, Germany', 'Europe/Berlin', 'Kontor', 'Work Trouser', 'sku-3', '57%', '610'],
  ['New York, USA', 'America/New_York', 'Lowercase', 'Loopback Hoodie', 'crew-1', '76%', '1,880'],
  ['São Paulo, Brazil', 'America/Sao_Paulo', 'Praia', 'Beach Tee', 'crew-3', '40%', '455'],
  ['San Francisco, USA', 'America/Los_Angeles', 'Fogline', 'Fleece Vest', 'crew-2', '22%', '268'],
  ['Mexico City, Mexico', 'America/Mexico_City', 'Barro', 'Clay-Dyed Tee', 'sku-4', '68%', '702'],
];
const wheel = $('#wheel');
if (wheel) {
  const stage = $('#wheelStage'), card = $('#wheelCard'), n = CITIES.length, STEP = 6.6;
  watch(stage);
  const items = CITIES.map((c, i) => {
    const li = document.createElement('li'); li.textContent = c[0]; li.tabIndex = 0; li.setAttribute('role', 'button');
    li.addEventListener('click', () => go(i)); li.addEventListener('keydown', e => e.key === 'Enter' && go(i));
    wheel.append(li); return li;
  });
  let offset = -1, target = 0, active = -1, hover = false, swapT, R = 464; // offset starts a step back: the wheel glides in
  const wrapD = d => ((d % n) + n * 1.5) % n - n / 2;      // shortest signed distance on the ring
  const go = i => { target += wrapD(i - target); };
  const fmt = tz => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date());
  const fill = i => {
    const [city, tz, label, product, img, sold, queue] = CITIES[i];
    $('#wcCity').textContent = city; $('#wcTime').textContent = fmt(tz); $('#wcLabel').textContent = label; $('#wcProduct').textContent = product;
    $('#wcImg').src = `assets/${img}.webp`; $('#wcSold').textContent = sold; $('#wcQueue').textContent = queue;
  };
  const setActive = i => {
    if (i === active) return; active = i;
    items.forEach((li, k) => li.classList.toggle('on', k === i));
    card.classList.add('swap'); clearTimeout(swapT);
    swapT = setTimeout(() => { fill(i); card.classList.remove('swap'); }, 250);
  };
  const measure = () => { R = parseFloat(getComputedStyle(stage).getPropertyValue('--R')) + 44; offset -= .001; }; // nudge = redraw
  measure(); new ResizeObserver(measure).observe(stage);
  fill(0); setActive(0);
  setInterval(() => active >= 0 && ($('#wcTime').textContent = fmt(CITIES[active][1])), 15000);
  stage.addEventListener('pointerenter', () => hover = true);
  stage.addEventListener('pointerleave', () => hover = false);
  $('#wheelUp').addEventListener('click', () => target--);
  $('#wheelDown').addEventListener('click', () => target++);
  if (!reduced) setInterval(() => { if (!hover && !document.hidden) target++; }, 2600);
  ticks.push((now, vh, dt) => {
    if (!onScreen(stage, vh)) return;
    if (Math.abs(target - offset) < .0005 && offset === target) return;
    offset += (target - offset) * (reduced ? 1 : ease(.07, dt));
    if (Math.abs(target - offset) < .0005) offset = target;
    items.forEach((li, i) => {
      const d = wrapD(i - offset), on = Math.abs(d) < .5;
      li.style.transform = `rotate(${(d * STEP).toFixed(3)}deg) translate(${(R + (on ? 40 * (1 - Math.abs(d) * 2) : 0)).toFixed(1)}px, -50%)`;
      li.style.opacity = Math.max(0, 1 - Math.abs(d) / 8.5).toFixed(3);
    });
    setActive(((Math.round(offset) % n) + n) % n);
  });
}

// ---------- 07 how a drop runs: dashed paths between the zigzag cards draw in as you scroll ----------
const how = $('#how');
if (how) {
  const svg = $('#howLines'), steps = $$('.how-step', how), NS = 'http://www.w3.org/2000/svg';
  watch(how, steps[0]);
  let segs = [];
  const build = () => {
    svg.innerHTML = '';
    const box = how.getBoundingClientRect();
    segs = steps.slice(0, -1).map((a, i) => {
      const ra = a.getBoundingClientRect(), rb = steps[i + 1].getBoundingClientRect(), right = rb.left + rb.width / 2 > ra.left + ra.width / 2;
      const x1 = (right ? ra.right : ra.left) - box.left, y1 = ra.top + ra.height * .35 - box.top;
      const x2 = rb.left + rb.width * (right ? .3 : .7) - box.left, y2 = rb.top - box.top - 6, r = 18 * (right ? 1 : -1);
      const d = `M${x1},${y1} H${x2 - r} Q${x2},${y1} ${x2},${y1 + 18} V${y2}`;
      const id = 'hm' + i, mk = (tag, attrs) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); return el; };
      const mask = mk('mask', { id, maskUnits: 'userSpaceOnUse' }), reveal = mk('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 8, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 });
      mask.append(reveal); svg.append(mask);
      svg.append(mk('path', { d, class: 'base' }), mk('path', { d, class: 'draw', mask: `url(#${id})` }));
      const head = mk('path', { d: `M${x2 - 5},${y2 - 6} L${x2},${y2} L${x2 + 5},${y2 - 6}`, class: 'head' }); svg.append(head);
      return { reveal, head, top: ra.top - box.top, bottom: rb.top - box.top };
    });
  };
  build(); new ResizeObserver(build).observe(how);
  ticks.push((now, vh) => {
    if (!onScreen(how, vh)) return;
    const top = R(how).top, line = vh * .62;            // a line 62% down the screen draws the paths
    steps[0].classList.toggle('on', R(steps[0]).top < line);
    segs.forEach((s, i) => {
      const p = clamp((line - (top + s.top)) / (s.bottom - s.top), 0, 1);
      s.reveal.setAttribute('stroke-dashoffset', (1 - p).toFixed(3));
      s.head.classList.toggle('on', p >= 1); steps[i + 1].classList.toggle('on', p >= 1);
    });
  });
}

// ---------- 08 pricing: drag the sun; every plan shows its real monthly cost; the dusk moves to the cheapest ----------
const vol = $('#volume');
if (vol) {
  const out = $('#volOut'), plans = $$('#plans .plan'); let bill = 'm';
  const money = n => '$' + Math.round(n).toLocaleString('en-US');
  const revenue = v => { const r = 100 * Math.pow(10, v * 3 / 100) - 100; return r < 1000 ? Math.round(r / 10) * 10 : Math.round(r / 100) * 100; }; // log scale to $100k
  const update = () => {
    const r = revenue(+vol.value);
    out.textContent = money(r); vol.setAttribute('aria-valuetext', money(r) + ' a month');
    const totals = plans.map(p => +$('.amount b', p).dataset[bill] + +p.dataset.fee * r), best = totals.indexOf(Math.min(...totals));
    plans.forEach((p, i) => { $('.plan-total b', p).textContent = money(totals[i]); p.classList.toggle('best', i === best); });
  };
  vol.addEventListener('input', update);
  $$('.bill button').forEach(b => b.addEventListener('click', () => {
    bill = b.dataset.bill; $$('.bill button').forEach(x => x.setAttribute('aria-pressed', x === b));
    $$('.amount b').forEach(a => a.textContent = '$' + a.dataset[bill]); update();
  }));
  update();
}

// ---------- buttons: an eclipse — the disc comes in on the side you enter and leaves on the side you exit ----------
const eclipse = e => {
  const b = e.currentTarget, r = b.getBoundingClientRect(), side = e.clientX - r.left < r.width / 2 ? -1 : 1;
  b.style.setProperty('--ex', side);
  if (e.type === 'pointerleave') return;
  b.classList.add('snap'); b.offsetWidth; b.classList.remove('snap'); // park on the entry side, then glide in
  b.style.setProperty('--ex', 0);
};
$$('.pill, .ask-chip').forEach(b => ['pointerenter', 'pointerleave'].forEach(t => b.addEventListener(t, eclipse)));

// ---------- CTA: carry the email to the sign-up page (session only, never in the URL) ----------
$('#ctaForm')?.addEventListener('submit', e => {
  e.preventDefault();
  try { sessionStorage.setItem('fulmen-email', $('#email').value.trim()); } catch {}
  location.href = 'start.html';
});
