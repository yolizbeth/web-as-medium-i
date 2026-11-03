import WaveSurfer from 'https://cdn.jsdelivr.net/npm/wavesurfer.js@8.0.0-beta.4/dist/wavesurfer.esm.js';

const dialog = document.getElementById('birdDialog');
const nameEl = document.getElementById('dialogName');
const scientificDialogEl = document.getElementById('dialogScientific');
const imageEl = document.getElementById('dialogImage');
const descEl = document.getElementById('dialogDescription');

const footer = document.querySelector('.footer');
const commonEl = document.getElementById('currentCommon');
const scientificEl = document.getElementById('currentScientific');
const playPauseBtn = document.getElementById('playPause');

// creates one general audio element so that audio keeps playing even if pop-up is closed
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

// Places the pop-up to bottom right of active birdBtn
function positionDialog() {
  if (!activeBtn) return;

  const rect = activeBtn.getBoundingClientRect();
  const margin = 8;
  const { width, height } = dialog.getBoundingClientRect();

  let left = rect.right;
  let top = rect.bottom;

  // Only shifts the pop-up if it would run off the screen?? test
  if (left + width > window.innerWidth - margin) {
    left = window.innerWidth - width - margin;
  }
  if (top + height > window.innerHeight - margin) {
    top = window.innerHeight - height - margin;
  }

  dialog.style.position = 'fixed';
  dialog.style.margin = '0';
  dialog.style.right = 'auto';
  dialog.style.bottom = 'auto';
  dialog.style.left = `${Math.max(margin, left)}px`;
  dialog.style.top = `${Math.max(margin, top)}px`;
}

/* ---------- Bird buttons ---------- */
document.querySelectorAll('.birdBtn').forEach((btn) => {
  btn.addEventListener('click', () => {
    // Clicking the bird whose pop-up is already open closes it
    if (dialog.open && activeBtn === btn) {
      dialog.close();
      return;
    }

    // Load the song (WaveSurfer decodes the waveform), then play it
    wavesurfer
      .load(btn.dataset.sound)
      .then(() => wavesurfer.play())
      .catch((err) => console.error('Audio failed:', err));

    // Update the footer to match
    commonEl.textContent = btn.dataset.name;
    scientificEl.textContent = btn.dataset.scientific;
    playPauseBtn.disabled = false;

    // Fill in and open the pop-up
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

/* ---------- Pop-up closing (audio keeps playing) ---------- */
dialog.addEventListener('close', () => {
  if (activeBtn) activeBtn.classList.remove('active');
  activeBtn = null;
});

// Click anywhere outside the pop-up (and not on a bird) to close it
document.addEventListener('click', (e) => {
  if (dialog.open && !dialog.contains(e.target) && !e.target.closest('.birdBtn')) {
    dialog.close();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && dialog.open) dialog.close();
});

imageEl.addEventListener('load', positionDialog);
window.addEventListener('resize', positionDialog);

/* ---------- Play / pause button ---------- */
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