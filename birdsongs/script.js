import WaveSurfer from 'https://cdn.jsdelivr.net/npm/wavesurfer.js@8.0.0-beta.4/dist/wavesurfer.esm.js';

document.addEventListener('DOMContentLoaded', () => {

const dialog = document.getElementById('birdDialog');
const nameEl = document.getElementById('dialogName');
const scientificDialogEl = document.getElementById('dialogScientific');
const imageEl = document.getElementById('dialogImage');
const descEl = document.getElementById('dialogDescription');

const footer = document.querySelector('.footer');
const commonEl = document.getElementById('currentCommon');
const scientificEl = document.getElementById('currentScientific');
const playPauseBtn = document.getElementById('playPause');

// Settings
const SPEED = 0.7;               // overall drift speed
const NODE_PADDING = 40;       // keeps nodes off the map edges
const DIALOG_OFFSET = 48;      // gap between a bird and its pop-up
const SHOW_NODE_LINES = true;  // lines between every pair of birds
const SCROLL_PER_SCENE = 100;  // vh of scrolling between one scene and the next
const HOLD = 0.3;              // 0 = always blending, 0.4 = long pause on each image
const FADE = 0.5;     // how many scenes of scrolling a fade takes
let scenePos = 0;     // current position in scene units, set by updateScene()

// shared helpers
const map = document.querySelector('.bird-map');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// creates one general audio element to keep audio playing once it starts
const audio = new Audio();
audio.loop = true; // remove for no loops!!

// WaveSurfer
const wavesurfer = WaveSurfer.create({
  container: '#wave',
  media: audio,
  height: 56,
  waveColor: 'rgba(255, 255, 255, 0.6)',
  progressColor: 'yellow',
  cursorWidth: 0,
  barWidth: 2,
  barGap: 1,
  normalize: true,
});

let activeBtn = null;

/* POP - UP PLACEMENT */

//stops pop ups from overlapping w header / footer bars
function getPopupZone() {
  const m = map.getBoundingClientRect();
  return {
    left: m.left,
    right: m.right,
    top: m.top,
    bottom: Math.min(m.bottom, footer.getBoundingClientRect().top),
  };
}

// dialog pop-up position
function positionDialog() {
  if (!activeBtn) return;

  const rect = activeBtn.getBoundingClientRect();
  const zone = getPopupZone();
  const margin = 8;

  // adds scroll function to pop-up so that content stays within the box
  dialog.style.maxHeight = `${Math.max(0, zone.bottom - zone.top - margin * 2)}px`;
  const { width, height } = dialog.getBoundingClientRect();

  // preferred default position
  let left = rect.right + DIALOG_OFFSET;
  let top = rect.bottom + DIALOG_OFFSET;

  // Flips to the other side of the node if it gets too close to the edge
  if (left + width > zone.right - margin) left = rect.left - DIALOG_OFFSET - width;
  if (top + height > zone.bottom - margin) top = rect.top - DIALOG_OFFSET - height;

  // Final safety clamp into the zone
  left = clamp(left, zone.left + margin, zone.right - width - margin);
  top = clamp(top, zone.top + margin, zone.bottom - height - margin);

  dialog.style.position = 'fixed';
  dialog.style.margin = '0';
  dialog.style.right = 'auto';
  dialog.style.bottom = 'auto';
  dialog.style.left = `${left}px`;
  dialog.style.top = `${top}px`;
}

/* BACKGROUND SCROLL FUNCTION */

const STARBASE_FROM = '2025-10-28';   // will affect scenes on/after 2025

const SCENES = [
  { date: '2011-01-22', image: 'assets/img/boca+chica_2011.png', blurb: 'A lush coast located between the Rio Grande and Gulf of Mexico.'  },
  { date: '2014-01-14', image: 'assets/img/boca+chica_2014.png', blurb: 'SpaceX announces they have selected Boca Chica as their new rocket launch testing site.'  },
  { date: '2015-01-20', image: 'assets/img/boca+chica_2015.png', blurb: 'SpaceX begins soil stabilization and earthwork at Boca Chica to prepare for construction.'  },
  { date: '2016-01-22', image: 'assets/img/boca+chica_2016.png', blurb: 'Major SpaceX site development begins.'  },
  { date: '2018-01-30', image: 'assets/img/boca+chica_2017.png', blurb: 'SpaceX construction shifts from a standard launch site to a major Starship manufacturing center.' },
  { date: '2020-06-04', image: 'assets/img/boca+chica_2020.png', blurb: 'SpaceX begins high-altitude testing, up to 12.5km.'  },
  { date: '2021-06-16', image: 'assets/img/boca+chica_2021.png', blurb: 'A CBBEP analysis reveals that the Piping Plover population has decreased by 54% due to SpaceX activity.'  },
  { date: '2022-03-25', image: 'assets/img/boca+chica_2022.png', blurb: 'A Programmatic Environmental Assessment by the FAA (falsely) clears SpaceX of any environmental impact reponsibilty. '  },
  { date: '2023-01-13', image: 'assets/img/boca+chica_2023a.png', blurb: 'A failed SpaceX launch significantly damages surrounding wildlife refuge land.' },
  { date: '2023-06-26', image: 'assets/img/boca+chica_2023b.png', blurb: 'Multiple environmental groups file lawsults against the FAA and SpaceX to address the continued environmental damage in Boca Chica.' },
  { date: '2024-03-11', image: 'assets/img/boca+chica_2024a.png', blurb: 'Founder Elon Musk announces that SpaceX will now be headquartered in Boca Chica.' },
  { date: '2024-12-12', image: 'assets/img/boca+chica_2024b.png', blurb: 'SpaceX files a request to Cameron County to turn Boca Chica Village and the neighboring coast into a new city: Starbase.' },
  { date: '2025-05-03', image: 'assets/img/boca+chica_2025.png', blurb: 'Now a company town, SpaceX recieves permission to increase their annual launches from the stardard 5 to 25.'  },
  { date: '2026-04-28', image: 'assets/img/boca+chica_2026.png', blurb: 'Starbase petitions the FAA for permission to launch its rockets up to 456 times a year, a 1,724% increase.'  },
].sort((a, b) => (a.date < b.date ? -1 : 1)); // automatically sets them in chronological order just in case

const placeName = (scene) =>
  scene.place ?? (scene.date >= STARBASE_FROM ? 'Starbase, TX' : 'Boca Chica Beach, TX');

const formatDate = (iso) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${iso}T00:00:00Z`));

const bgEl = document.getElementById('bg');
const track = document.getElementById('scroll-track');
const scrollCue = document.getElementById('scroll-cue');
const placeEl = document.getElementById('placeName');
const blurbEl = document.getElementById('sceneBlurb');
const dateEl = document.getElementById('dateText');
const sceneText = [placeEl, blurbEl, dateEl];

// One background layer per scene, stacked in chronological order
const layers = SCENES.map((scene) => {
  const layer = document.createElement('div');
  layer.className = 'bg-layer';
  layer.style.backgroundImage = `url("${scene.image}")`;
  bgEl.append(layer);
  return layer;
});

// Total scroll distance = one SCROLL_PER_SCENE per transition
track.style.height = `calc(100vh + ${(SCENES.length - 1) * SCROLL_PER_SCENE}vh)`;

let shownScene = -1;
let textTimer = null;

function setSceneText(i, instant) {
  clearTimeout(textTimer);
  const apply = () => {
    placeEl.textContent = placeName(SCENES[i]);
    blurbEl.textContent = SCENES[i].blurb ?? '';
    dateEl.textContent = formatDate(SCENES[i].date);
    sceneText.forEach((el) => { el.style.opacity = 1; });
  };
  if (instant) return apply();
  sceneText.forEach((el) => { el.style.opacity = 0; });   // fade out, swap, fade in
  textTimer = setTimeout(apply, 220);
}

/* DRIFTING NODES + ty cici!!! */
const SVG_NS = 'http://www.w3.org/2000/svg';
const linksSvg = document.getElementById('links');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let hoverIndex = -1;
let focusIndex = -1;
let time = 0;
let lastFrame = 0;

const sceneIndexFor = (value) => SCENES.findIndex((s) => s.date.startsWith(value));

function parseWindows(button) {

  if (button.dataset.year) {
  const start = sceneIndexFor(button.dataset.year);
  if (start === -1) {
    console.warn(`No scene matches data-year="${button.dataset.year}"`, button);
  } else {
    let end = Infinity;
    if (button.dataset.until) {
      const next = SCENES.findIndex((s) => s.date.slice(0, 4) > button.dataset.until);
      if (next !== -1) end = next;
    }
    // The fade starts when the date text swaps (halfway through the background
    // crossfade) and finishes as the new scene settles
    return [[start === 0 ? 0 : start - 0.5, end]];
  }
}

  if (button.dataset.windows) {
    return button.dataset.windows.split(',').map((w) => {
      const [a, b] = w.trim().split('-');
      return [parseFloat(a), b ? parseFloat(b) : Infinity];
    });
  }
  return [[
    parseFloat(button.dataset.from ?? 0),
    button.dataset.to !== undefined ? parseFloat(button.dataset.to) : Infinity,
  ]];
}

// Highest visibility across all of a node's windows
function visibility(windows) {
  return Math.max(...windows.map(([from, to]) => {
    const fadeIn = from <= 0 ? 1 : clamp((scenePos - from) / FADE, 0, 1);
    const fadeOut = clamp((to - scenePos) / FADE, 0, 1);
    return Math.min(fadeIn, fadeOut);
  }));
}

const nodes = [...document.querySelectorAll('.birdBtn')].map((button, i) => {
  button.addEventListener('pointerenter', () => { hoverIndex = i; });
  button.addEventListener('pointerleave', () => { if (hoverIndex === i) hoverIndex = -1; });
  button.addEventListener('focus', () => { if (button.matches(':focus-visible')) focusIndex = i; });
  button.addEventListener('blur', () => { if (focusIndex === i) focusIndex = -1; });

  return {
    button,
    x: Math.random() * map.clientWidth,
    y: Math.random() * map.clientHeight,
    vx: 0,
    vy: 0,
    px: Math.random() * Math.PI * 2,
    py: Math.random() * Math.PI * 2,

    windows: parseWindows(button),
    vis: 1,
  };
});

const edges = [];
if (SHOW_NODE_LINES) {
  for (let a = 0; a < nodes.length; a++) {
    for (let b = a + 1; b < nodes.length; b++) {
      const line = document.createElementNS(SVG_NS, 'line');
      linksSvg.append(line);
      edges.push([a, b, line]);
    }
  }
}

const popupLine = document.createElementNS(SVG_NS, 'line');
popupLine.classList.add('popup-line');
popupLine.style.display = 'none';
linksSvg.append(popupLine);

function stepNodes(dt) {
  const W = map.clientWidth;
  const H = map.clientHeight;
  const roomX = Math.max(0, W / 2 - NODE_PADDING);
  const roomY = Math.max(0, H / 2 - NODE_PADDING);
  const speed = dt * 60;

  nodes.forEach((n, i) => {
    const tx = W / 2 + roomX * (0.79 * Math.sin(time * (0.18 + i * 0.018) + n.px) + 0.21 * Math.sin(time * 0.39 + n.py));
    const ty = H / 2 + roomY * (0.79 * Math.cos(time * (0.22 + i * 0.021) + n.py) + 0.21 * Math.sin(time * 0.46 + n.px));

    n.vx += (tx - n.x) * 0.0037 * speed;
    n.vy += (ty - n.y) * 0.0037 * speed;
    n.vx *= Math.pow(0.94, speed);
    n.vy *= Math.pow(0.94, speed);
    n.x = clamp(n.x + n.vx * speed, NODE_PADDING, W - NODE_PADDING);
    n.y = clamp(n.y + n.vy * speed, NODE_PADDING, H - NODE_PADDING);
  });
}

function renderNodes() {
  const mapRect = map.getBoundingClientRect();

  nodes.forEach((n) => {
  n.vis = visibility(n.windows);

  const on = n.vis > 0.05;
  n.button.style.opacity = n.vis;
  n.button.style.visibility = n.vis > 0 ? 'visible' : 'hidden';
  n.button.style.pointerEvents = on ? '' : 'none';
  n.button.tabIndex = on ? 0 : -1;
});

// Don't stay frozen on a node that has faded away
if (hoverIndex >= 0 && nodes[hoverIndex].vis <= 0.05) hoverIndex = -1;
if (focusIndex >= 0 && nodes[focusIndex].vis <= 0.05) focusIndex = -1;

  nodes.forEach((n) => {
    n.button.style.left = `${n.x}px`;
    n.button.style.top = `${n.y}px`;
  });

  edges.forEach(([a, b, line]) => {
    line.setAttribute('x1', mapRect.left + nodes[a].x);
    line.setAttribute('y1', mapRect.top + nodes[a].y);
    line.setAttribute('x2', mapRect.left + nodes[b].x);
    line.setAttribute('y2', mapRect.top + nodes[b].y);
    line.style.opacity = Math.min(nodes[a].vis, nodes[b].vis);
  });

  const active = nodes.find((n) => n.button === activeBtn);
    if (dialog.open && active && active.vis < 0.3) dialog.close();
    if (dialog.open && active) {
      const d = dialog.getBoundingClientRect();
      const cx = mapRect.left + active.x;
      const cy = mapRect.top + active.y;
      popupLine.setAttribute('x1', cx);
      popupLine.setAttribute('y1', cy);
      popupLine.setAttribute('x2', clamp(cx, d.left, d.right));
      popupLine.setAttribute('y2', clamp(cy, d.top, d.bottom));
      popupLine.style.display = '';
    } else {
      popupLine.style.display = 'none';
    }
}

function frame(now) {
  const dt = Math.min((now - (lastFrame || now)) / 1000, 0.033);
  lastFrame = now;

  const frozen = hoverIndex >= 0 || focusIndex >= 0 || dialog.open || reduceMotion;
  if (!frozen) {
    time += dt * SPEED;
    stepNodes(dt);
  }

  renderNodes();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);



/* MENU */
const menuBtn = document.getElementById('menuBtn');
const closeMenuBtn = document.getElementById('closeMenu');
const sideMenu = document.getElementById('sideMenu');
const sceneList = document.getElementById('sceneList');

function scrollToScene(i) {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const top = SCENES.length > 1 ? (i / (SCENES.length - 1)) * maxScroll : 0;
  window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function setMenu(open) {
  sideMenu.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  (open ? closeMenuBtn : menuBtn).focus();
}

// One button per scene, already in chronological order
const menuItems = SCENES.map((scene, i) => {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = formatDate(scene.date);
  b.addEventListener('click', () => {
    scrollToScene(i);
    setMenu(false);
  });
  li.append(b);
  sceneList.append(li);
  return b;
});

menuBtn.addEventListener('click', () => setMenu(!sideMenu.classList.contains('open')));
closeMenuBtn.addEventListener('click', () => setMenu(false));

// Click outside the menu to close it
document.addEventListener('click', (e) => {
  if (sideMenu.classList.contains('open') && !sideMenu.contains(e.target) && !menuBtn.contains(e.target)) {
    setMenu(false);
  }
});

function updateScene() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;
  const pos = progress * (SCENES.length - 1);          // e.g. 1.4 = 40% of the way from scene 1 to 2
  scenePos = pos;
  const i = Math.min(Math.floor(pos), SCENES.length - 1);
  const frac = pos - i;
  scrollCue.classList.toggle('hidden', window.scrollY > 40);

  // Smoothstep with a hold: the image rests for HOLD of each stretch, then fades
  const t = clamp((frac - HOLD) / (1 - 2 * HOLD), 0, 1);
  const blend = t * t * (3 - 2 * t);

  layers.forEach((layer, n) => {
    layer.style.opacity = n === i ? 1 : n === i + 1 ? blend : 0;
  });

  // Swap the text when the image is more than halfway to the next one
  const nearest = clamp(Math.round(pos), 0, SCENES.length - 1);
  if (nearest !== shownScene) {
    setSceneText(nearest, shownScene === -1);
    shownScene = nearest;

    menuItems.forEach((b, n) => {
      b.classList.toggle('current', n === nearest);
      b.toggleAttribute('aria-current', n === nearest);
});
  }
}

window.addEventListener('scroll', updateScene, { passive: true });
window.addEventListener('resize', updateScene);
updateScene();

/* BIRD BUTTONS  */
document.querySelectorAll('.birdBtn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (dialog.open && activeBtn === btn) {
      dialog.close();
      return;
    }

    wavesurfer
      .load(btn.dataset.sound)
      .then(() => wavesurfer.play())
      .catch((err) => console.error('Audio failed:', err));

    commonEl.textContent = btn.dataset.name;
    scientificEl.textContent = btn.dataset.scientific;
    playPauseBtn.disabled = false;

    if (activeBtn) activeBtn.classList.remove('active');
    activeBtn = btn;
    activeBtn.classList.add('active');
    nameEl.textContent = btn.dataset.name;
    scientificDialogEl.textContent = btn.dataset.scientific;
    imageEl.src = btn.dataset.image;
    imageEl.alt = btn.dataset.name;
    descEl.textContent = btn.dataset.description;
    dialog.show();
    positionDialog();
  });
});

/* keeps audio playing even if pop-up closes */
dialog.addEventListener('close', () => {
  if (activeBtn) activeBtn.classList.remove('active');
  activeBtn = null;
});

document.addEventListener('click', (e) => {
  if (dialog.open && !dialog.contains(e.target) && !e.target.closest('.birdBtn')) {
    dialog.close();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (sideMenu.classList.contains('open')) setMenu(false);
  else if (dialog.open) dialog.close();
});

imageEl.addEventListener('load', positionDialog);
window.addEventListener('resize', positionDialog);

/* PLAY / PAUSE BUTTON */
playPauseBtn.addEventListener('click', () => wavesurfer.playPause());

audio.addEventListener('play', () => {
  footer.classList.add('playing');
  playPauseBtn.textContent = '⏸';
  playPauseBtn.setAttribute('aria-label', 'Pause');
});

audio.addEventListener('pause', () => {
  footer.classList.remove('playing');
  playPauseBtn.textContent = '▶';
  playPauseBtn.setAttribute('aria-label', 'Play');
});

});