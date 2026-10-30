/* El Forn a Casa — configurador de caixa amb guant animat */

// Preus d'exemple PER UNITAT: canvia'ls aquí.
// `unitats`: on va cada unitat dins la caixa (x, y = centre i w = amplada, en % de la caixa; rot en graus).
// `gir`: graus que s'ha girat la imatge de la caixa respecte a la de la safata.
const PRODUCTES = [
  { id: 'panets', nom: 'Panets artesans', preu: 2.80, gir: 90,
    unitats: [{ x: 33.1, y: 13.3, w: 42, rot: -3 }, { x: 33.6, y: 25.1, w: 42, rot: -1 }] },
  { id: 'croissants', nom: 'Croissants', preu: 3.20, gir: 0,
    unitats: [{ x: 19.4, y: 46.7, w: 27, rot: -6 }, { x: 46.6, y: 47.3, w: 27, rot: 4 }] },
  { id: 'oli', nom: 'Oli del molí', preu: 7.50, gir: 0,
    unitats: [{ x: 13.1, y: 81.1, w: 5.8, rot: -2 }, { x: 18.7, y: 81.5, w: 5.8, rot: 2 }] },
  { id: 'tomaquet', nom: 'Tomàquet de sucar', preu: 2.40, gir: 0,
    unitats: [{ x: 25.4, y: 74.9, w: 10.5, rot: -10 }, { x: 26.4, y: 90.0, w: 10.5, rot: 14 }] },
  { id: 'poma', nom: 'Poma', preu: 0.90, gir: 0,
    unitats: [{ x: 38.4, y: 80.2, w: 15, rot: 0 }, { x: 53.3, y: 83.3, w: 15, rot: 8 }] },
  { id: 'pernil', nom: 'Pernil', preu: 9.90, gir: 90,
    unitats: [{ x: 79.1, y: 27.8, w: 31, rot: 1 }] },
  { id: 'suc-pinya', nom: 'Suc de pinya', preu: 1.60, gir: 0,
    unitats: [{ x: 71.6, y: 76.7, w: 9.6, rot: -1 }] },
  { id: 'suc-pressec', nom: 'Suc de préssec', preu: 1.60, gir: 0,
    unitats: [{ x: 84.3, y: 76.7, w: 9.6, rot: 1 }] },
];
PRODUCTES.forEach((p) => {
  p.img = `assets/img/${p.id}.png`;           // safata (vertical, amb marge)
  p.imgCaixa = `assets/img/${p.id}-caixa.png`; // dins la caixa (retallada i girada)
  p.total = p.preu * p.unitats.length;
});
const PREU_CAIXA = 4.00;
const PREU_ENVIAMENT = 4.50;

const $ = (s) => document.querySelector(s);
const estada = $('#estada'), caixa = $('#caixa'), items = $('#items'), tapa = $('#tapa');
const guant = $('#guant'), llista = $('#llista'), safates = $('#safates');
const btnComenca = $('#comenca'), btnComanda = $('#comanda'), finalEl = $('#final');

const euros = (n) => n.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR' });
const colocats = new Map();           // id producte -> índex de forat
let estat = 'tancada';                // tancada | oberta | acabada
let ocupat = false;

if (matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.globalTimeline.timeScale(8);

/* ---------- Geometria (tot relatiu a #estada) ---------- */
function centre(el) {
  const r = el.getBoundingClientRect(), s = estada.getBoundingClientRect();
  return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2, w: r.width, h: r.height };
}
function puntUnitat(u) {
  const b = centre(caixa);
  return { x: b.x - b.w / 2 + b.w * u.x / 100, y: b.y - b.h / 2 + b.h * u.y / 100, w: b.w * u.w / 100 };
}
function reposo() {
  const b = centre(caixa), s = estada.getBoundingClientRect();
  return s.width > 1000
    ? { x: b.x - b.w / 2 + 60, y: b.y + b.h / 2 + 85 }
    : { x: b.x - b.w / 2 + 40, y: b.y - b.h / 2 - 50 };
}
function foraEscena() {
  const s = estada.getBoundingClientRect();
  return { x: s.width + 120, y: s.height * 0.8 };
}

/* ---------- Guant ---------- */
const dits = gsap.utils.toArray('.guant .f');
function posaDits(pose, dur = 0) {
  return gsap.to(dits, {
    rotation: (i, el) => +el.dataset[pose],
    scaleY: pose === 'agafa' ? 0.62 : 1,
    svgOrigin: (i, el) => `${el.dataset.bx} ${el.dataset.by}`,
    duration: dur,
    ease: 'power2.out',
  });
}
gsap.set(guant, { xPercent: -50, yPercent: -55, x: -300, y: -300 });
posaDits('obert');

function moureGuant(p, dur, rot = 0, ease = 'power2.inOut') {
  return gsap.to(guant, { x: p.x, y: p.y, rotation: rot, duration: dur, ease });
}
const acabat = (tl) => new Promise((ok) => tl.eventCallback('onComplete', ok));

/* ---------- Safates i tiquet ---------- */
PRODUCTES.forEach((p) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'safata';
  b.dataset.id = p.id;
  b.setAttribute('aria-pressed', 'false');
  b.innerHTML = `<span class="marca-ok" aria-hidden="true">✓</span>
    <img src="${p.img}" alt="" draggable="false">
    <span class="nom">${p.nom}</span><span class="preu">${p.unitats.length > 1 ? p.unitats.length + ' × ' : ''}${euros(p.preu)}</span>`;
  b.addEventListener('click', () => clicProducte(p));
  llista.appendChild(b);
});
$('#preu-enviament').textContent = '+' + euros(PREU_ENVIAMENT);
document.querySelectorAll('input[name="entrega"]').forEach((r) => r.addEventListener('change', pintaTiquet));

const safata = (id) => llista.querySelector(`[data-id="${id}"]`);
const producte = (id) => PRODUCTES.find((p) => p.id === id);
const enviament = () => document.querySelector('input[name="entrega"]:checked').value === 'enviament';

function pintaTiquet() {
  const ul = $('#linies');
  ul.innerHTML = '';
  let total = 0;
  if (colocats.size) {
    const base = document.createElement('li');
    base.innerHTML = `<span>Caixa regal</span><span>${euros(PREU_CAIXA)}</span>`;
    ul.appendChild(base);
    total += PREU_CAIXA;
    colocats.forEach((_, id) => {
      const p = producte(id);
      const li = document.createElement('li');
      const n = p.unitats.length;
      li.innerHTML = `<span>${p.nom}${n > 1 ? ' ×' + n : ''}</span><span>${euros(p.total)}</span>`;
      ul.appendChild(li);
      total += p.total;
    });
  } else {
    ul.innerHTML = '<li class="buida">Encara no hi ha res</li>';
  }
  if (enviament() && colocats.size) total += PREU_ENVIAMENT;
  $('#total').textContent = euros(total);
  btnComanda.disabled = !colocats.size || estat !== 'oberta' || ocupat;
}
pintaTiquet();

let avisTemps;
function avis(text) {
  const a = $('#avis');
  a.textContent = text;
  a.classList.add('is-visible');
  clearTimeout(avisTemps);
  avisTemps = setTimeout(() => a.classList.remove('is-visible'), 2200);
}

/* ---------- Obrir la caixa ---------- */
// Desplaçament de la tapa quan el guant l'aixeca i l'aparta.
const APARTA = () => {
  const b = centre(caixa);
  return { x: -b.w * 0.55, y: -b.h * 0.42, rot: -9 };
};

async function obreCaixa() {
  if (ocupat || estat !== 'tancada') return;
  ocupat = true;
  gsap.to(btnComenca, { autoAlpha: 0, scale: .85, duration: .25 });

  const t = centre(tapa), a = APARTA();
  const agafa = { x: t.x - t.w * 0.42, y: t.y + t.h * 0.12 };
  const e = foraEscena();
  gsap.set(guant, { x: e.x, y: e.y, rotation: 25, autoAlpha: 1 });

  const tl = gsap.timeline();
  tl.add(moureGuant(agafa, 1, -8, 'power3.out'))
    .add(posaDits('agafa', .25))
    // aixeca la tapa
    .to(tapa, { scale: 1.07, y: -14, rotation: -1.5, duration: .35, ease: 'power2.out' }, '>')
    .to(guant, { y: agafa.y - 14, duration: .35, ease: 'power2.out' }, '<')
    // l'aparta cap amunt i s'esvaeix
    .to(tapa, { x: a.x, y: a.y, rotation: a.rot, duration: .95, ease: 'power2.inOut' }, '>')
    .to(guant, { x: agafa.x + a.x, y: agafa.y + a.y, rotation: -20, duration: .95, ease: 'power2.inOut' }, '<')
    .to(tapa, { autoAlpha: 0, duration: .45, ease: 'none' }, '<.5')
    // deixa anar i es retira
    .add(posaDits('obert', .25))
    .add(moureGuant(reposo(), .8, 8), '>');

  await acabat(tl);
  estat = 'oberta';
  ocupat = false;
  safates.classList.remove('is-bloquejat');
  pintaTiquet();
}

/* ---------- Posar / treure productes ---------- */
// Carrega les imatges de la caixa per saber-ne la mida natural.
PRODUCTES.forEach((p) => { p.mida = new Image(); p.mida.src = p.imgCaixa; });

function clicProducte(p) {
  if (ocupat || estat !== 'oberta') return;
  colocats.has(p.id) ? treuProducte(p) : posaProducte(p);
}

function creaItem(p, u) {
  const img = document.createElement('img');
  img.src = p.imgCaixa;
  img.alt = p.nom;
  img.title = 'Treure ' + p.nom;
  img.className = 'item';
  img.dataset.id = p.id;
  img.draggable = false;
  img.style.cssText = `left:${u.x}%;top:${u.y}%;width:${u.w}%;--r:${u.rot}deg`;
  img.addEventListener('click', () => clicProducte(p));
  items.appendChild(img);
}

// El guant porta UNA unitat de la safata al seu lloc a la caixa.
function portaUnitat(p, u, primera) {
  const bandeja = safata(p.id);
  const imgSafata = bandeja.querySelector('img');
  const r = imgSafata.getBoundingClientRect();
  const des = centre(imgSafata);
  const fins = puntUnitat(u);
  const mira = { x: 38, y: -26 };   // el guant agafa el producte pel costat

  // mida inicial = la que té el producte dins la safata (imatge 500x340, object-fit: contain)
  const escalaSafata = Math.min(r.width / 500, r.height / 340);
  const volant = document.createElement('img');
  volant.src = p.imgCaixa;
  volant.className = 'volant';
  volant.alt = '';
  volant.style.width = fins.w + 'px';
  estada.appendChild(volant);
  const s0 = (p.mida.naturalWidth * escalaSafata) / fins.w;
  gsap.set(volant, { xPercent: -50, yPercent: -50, x: des.x, y: des.y, scale: s0, rotation: p.gir, autoAlpha: 0 });

  const tl = gsap.timeline();
  tl.add(moureGuant({ x: des.x + mira.x, y: des.y + mira.y }, primera ? .65 : .5, -10))
    .add(posaDits('agafa', .2))
    .set(volant, { autoAlpha: 1 })
    .call(() => { bandeja.classList.add('is-triat'); bandeja.setAttribute('aria-pressed', 'true'); })
    // viatge fins al lloc, amb un petit arc
    .addLabel('viatge')
    .to(volant, { scale: 1.12, rotation: u.rot, duration: .45, ease: 'power2.out' }, 'viatge')
    .to(volant, { x: fins.x, y: fins.y, duration: .8, ease: 'power2.inOut' }, 'viatge')
    .to(guant, { x: fins.x + mira.x, y: fins.y + mira.y, rotation: 8, duration: .8, ease: 'power2.inOut' }, 'viatge')
    // el deixa anar
    .add(posaDits('obert', .2), '>-.05')
    .to(volant, { scale: 1, duration: .4, ease: 'bounce.out' }, '<')
    // canvia el volant pel producte definitiu dins la caixa
    .call(() => { creaItem(p, u); volant.remove(); }, null, '>');
  return acabat(tl);
}

async function posaProducte(p) {
  ocupat = true;
  colocats.set(p.id, true);
  pintaTiquet();

  for (let k = 0; k < p.unitats.length; k++) await portaUnitat(p, p.unitats[k], k === 0);

  await acabat(moureGuant(reposo(), .7, 8));
  ocupat = false;
  pintaTiquet();
}

function treuProducte(p) {
  colocats.delete(p.id);
  const bandeja = safata(p.id);
  bandeja.classList.remove('is-triat');
  bandeja.setAttribute('aria-pressed', 'false');
  pintaTiquet();
  items.querySelectorAll(`[data-id="${p.id}"]`).forEach((el) =>
    gsap.to(el, { scale: .6, autoAlpha: 0, y: -20, duration: .3, ease: 'power2.in', onComplete: () => el.remove() }));
}

/* ---------- Tancar la caixa i fer la comanda ---------- */
async function tancaCaixa() {
  if (ocupat || estat !== 'oberta' || !colocats.size) return;
  ocupat = true;
  pintaTiquet();
  safates.classList.add('is-bloquejat');

  const b = centre(caixa), a = APARTA();
  const w = b.w * 1.06, h = b.h * 1.1;
  const agafa = { x: b.x - w * 0.42, y: b.y + h * 0.12 };

  const tl = gsap.timeline();
  tl.set(tapa, { x: a.x, y: a.y, rotation: a.rot, scale: 1.07, autoAlpha: 0 })
    .add(moureGuant({ x: agafa.x + a.x, y: agafa.y + a.y }, .8, -20))
    .add(posaDits('agafa', .25))
    // porta la tapa fins a la caixa
    .to(tapa, { autoAlpha: 1, duration: .3, ease: 'none' }, '>')
    .to(tapa, { x: 0, y: -14, rotation: -1.5, duration: .9, ease: 'power2.inOut' }, '<')
    .to(guant, { x: agafa.x, y: agafa.y - 14, rotation: -8, duration: .9, ease: 'power2.inOut' }, '<')
    // la baixa i la tanca amb un copet
    .to(tapa, { scale: 1, y: 0, rotation: 0, duration: .35, ease: 'bounce.out' }, '>')
    .to(guant, { y: agafa.y, duration: .35, ease: 'bounce.out' }, '<')
    .add(posaDits('obert', .25))
    .add(moureGuant(foraEscena(), .9, 25, 'power2.in'), '>');

  await acabat(tl);
  gsap.set(guant, { autoAlpha: 0 });
  estat = 'acabada';
  ocupat = false;

  const n = colocats.size;
  const total = $('#total').textContent;
  $('#final-text').textContent =
    `La teva caixa amb ${n} ${n === 1 ? 'producte' : 'productes'} ja està tancada i lligada. ` +
    `Total: ${total} (${enviament() ? 'enviament a casa' : 'recollida a la botiga'}).`;
  finalEl.hidden = false;
  gsap.from('.final-targeta', { y: 30, autoAlpha: 0, duration: .5, ease: 'back.out(1.6)' });
  $('#reinicia').focus();
}

function reinicia() {
  finalEl.hidden = true;
  items.innerHTML = '';
  colocats.clear();
  llista.querySelectorAll('.safata').forEach((s) => { s.classList.remove('is-triat'); s.setAttribute('aria-pressed', 'false'); });
  gsap.set(tapa, { clearProps: 'all' });
  gsap.set(btnComenca, { clearProps: 'all' });
  gsap.set(guant, { autoAlpha: 0 });
  estat = 'tancada';
  safates.classList.add('is-bloquejat');
  pintaTiquet();
}

btnComenca.addEventListener('click', obreCaixa);
btnComanda.addEventListener('click', tancaCaixa);
$('#reinicia').addEventListener('click', reinicia);

// El guant en repòs s'ha de recol·locar si canvia la mida de la finestra.
addEventListener('resize', () => {
  if (!ocupat && estat === 'oberta') gsap.set(guant, { ...reposo() });
});
