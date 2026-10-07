// start.html — three-step sign-up with a live preview. Demo only: nothing is sent anywhere.
// Uses $, $$ and `reduced` from main.js (loaded first).
(() => {
  const form = $('#startForm'), steps = $$('.step', form), progress = $('#progress'), count = $('#stepCount');
  let step = 1;

  // ---------- prefill: email from the homepage form (session only), plan from ?plan= ----------
  try { const e = sessionStorage.getItem('fulmen-email'); if (e) $('#fEmail').value = e; } catch {}
  const plan = new URLSearchParams(location.search).get('plan');
  if (['studio', 'label', 'house'].includes(plan)) $(`input[name="plan"][value="${plan}"]`).checked = true;

  // ---------- drop date defaults to next Thursday ----------
  const d = new Date(); d.setDate(d.getDate() + ((4 - d.getDay() + 7) % 7 || 7));
  const iso = x => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  $('#fDate').value = iso(d); $('#fDate').min = iso(new Date());

  // ---------- live preview ----------
  const pv = { orb: $('#pvOrb'), pass: $('#pvPass'), label: $('#pvLabel'), passLabel: $('#pvPassLabel'), holder: $('#pvHolder'), opens: $('#pvOpens'), line: $('#pvDropLine'), url: $('#pvUrl') };
  const slug = s => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').slice(0, 24) || 'your-label';
  const when = () => {
    const v = $('#fDate').value, t = $('#fTime').value || '18:00';
    if (!v) return '—';
    const [y, m, dd] = v.split('-').map(Number), x = new Date(y, m - 1, dd);
    return `${x.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${t}`;
  };
  const units = () => +$('#units').value;
  const render = () => {
    const name = $('#fName').value.trim(), label = $('#fLabel').value.trim(), drop = $('#fDrop').value.trim();
    pv.label.textContent = pv.passLabel.textContent = label || 'Your label';
    pv.holder.textContent = name ? name.split(/\s+/).map((w, i) => i ? w[0] + '.' : w).join(' ') : 'Your name';
    pv.opens.textContent = when();
    pv.line.textContent = drop ? `${drop} · ${units()} units` : 'First drop · coming soon';
    pv.url.textContent = `fulmen.app/${slug(label)}`;
  };
  form.addEventListener('input', e => { render(); e.target.closest('.field')?.classList.remove('bad'); if (e.target.id === 'fPass') strength(); });
  $('#units').value = 300;

  // ---------- brand colour: the preview orb and the pass take the chosen sky ----------
  const TONES = ['tone-ember', 'tone-ice', 'tone-violet', 'tone-silver'];
  $$('.swatches button').forEach(b => b.addEventListener('click', () => {
    $$('.swatches button').forEach(x => x.setAttribute('aria-checked', x === b));
    [pv.orb, pv.pass].forEach(el => { el.classList.remove(...TONES, 'orb-silver'); b.dataset.tone && el.classList.add(b.dataset.tone); });
  }));

  // ---------- small controls ----------
  $$('.chips button').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true')));
  $$('.stepper button').forEach(b => b.addEventListener('click', () => {
    $('#units').value = Math.min(10000, Math.max(50, units() + +b.dataset.stepBy)); render();
  }));
  const peek = $('.peek'), pass = $('#fPass');
  peek.addEventListener('click', () => {
    const show = pass.type === 'password'; pass.type = show ? 'text' : 'password';
    peek.setAttribute('aria-pressed', show); peek.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });
  const strength = () => { // 0–4: length, length 12+, mixed case, digit or symbol
    const v = pass.value, score = !v ? 0 : (v.length >= 8) + (v.length >= 12) + (/[a-z]/.test(v) && /[A-Z]/.test(v)) + /[\d\W]/.test(v);
    $('#strengthBar').style.setProperty('--s', (score / 4 * 100) + '%');
    $('#strengthText').textContent = !v ? '8+ characters' : v.length < 8 ? 'Too short' : ['Too short', 'Okay', 'Good', 'Strong', 'Great'][score];
  };

  // ---------- steps ----------
  const valid = n => { // native checks, shown our way
    let ok = true;
    $$('input[required]', steps[n - 1]).forEach(i => {
      const bad = !i.checkValidity() || (i.type !== 'date' && !i.value.trim());
      i.closest('.field').classList.toggle('bad', bad);
      if (bad && ok) { i.focus(); ok = false; }
    });
    return ok;
  };
  const go = n => {
    step = n;
    steps.forEach(s => s.hidden = +s.dataset.step !== n);
    const shown = Math.min(n, 3);
    progress.style.setProperty('--p', (n > 3 ? 100 : shown / 3 * 100) + '%');
    progress.setAttribute('aria-valuenow', shown);
    count.textContent = n > 3 ? 'All set' : `Step ${shown} of 3`;
    const first = $('input, button', steps[n - 1]);
    (n > 3 ? steps[3] : first)?.focus({ preventScroll: true });
    scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!valid(step)) return;
    if (step < 3) return go(step + 1);
    // done
    const name = $('#fName').value.trim().split(/\s+/)[0], email = $('#fEmail').value.trim(), label = $('#fLabel').value.trim(), drop = $('#fDrop').value.trim();
    $('#doneTitle').textContent = `You're in, ${name}.`;
    $('#doneText').textContent = `${label}'s first drop, ${drop}, opens ${when()}. ${units()} units, waitlist open from today.`;
    $('#doneUrl').textContent = `fulmen.app/${slug(label)}`;
    $('#doneEmail').textContent = email;
    pv.orb.classList.add('done'); $('#pvNote').textContent = 'Live. Share the link and the passes start numbering.';
    try { sessionStorage.removeItem('fulmen-email'); } catch {}
    go(4);
  });
  $$('[data-back]', form).forEach(b => b.addEventListener('click', () => go(step - 1)));
  $('#restart').addEventListener('click', () => { form.reset(); $('#fDate').value = iso(d); $('#units').value = 300; pv.orb.classList.remove('done'); $('#pvNote').textContent = 'Everything updates as you type.'; strength(); render(); go(1); });

  render(); strength();
})();
