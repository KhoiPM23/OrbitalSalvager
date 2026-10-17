import { spaceAudio } from './audio/spaceAudio';
import { SpaceEngine } from './physics/spaceEngine';
import { SpaceView } from './renderer/spaceView';

// DOM Elements
const canvas = document.getElementById('spaceCanvas') as HTMLCanvasElement;
const fuelText = document.getElementById('fuelText') as HTMLElement;
const fuelBar = document.getElementById('fuelBar') as HTMLElement;
const hullText = document.getElementById('hullText') as HTMLElement;
const hullBar = document.getElementById('hullBar') as HTMLElement;
const tetherStatus = document.getElementById('tetherStatus') as HTMLElement;
const salvageCounter = document.getElementById('salvageCounter') as HTMLElement;
const scoreText = document.getElementById('scoreText') as HTMLElement;

const btnRestart = document.getElementById('btnRestart') as HTMLButtonElement;
const btnHelp = document.getElementById('btnHelp') as HTMLButtonElement;
const modalBrief = document.getElementById('modalBrief') as HTMLElement;
const btnStartGame = document.getElementById('btnStartGame') as HTMLButtonElement;
const modalWin = document.getElementById('modalWin') as HTMLElement;
const winScoreText = document.getElementById('winScoreText') as HTMLElement;
const btnPlayAgain = document.getElementById('btnPlayAgain') as HTMLButtonElement;
const modalDefeat = document.getElementById('modalDefeat') as HTMLElement;
const defeatReason = document.getElementById('defeatReason') as HTMLElement;
const btnRetryDefeat = document.getElementById('btnRetryDefeat') as HTMLButtonElement;

// Initialization
const engine = new SpaceEngine(1200, 800);
const view = new SpaceView(canvas);

let isGameRunning = false;
const keys: Record<string, boolean> = {};

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  spaceAudio.ensureAudio();

  if (e.code === 'Space') {
    e.preventDefault();
    handleTetherToggle();
  }
  if (e.key === 'r' || e.key === 'R') {
    handleReset();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function handleTetherToggle(): void {
  if (!isGameRunning) return;
  const attached = engine.toggleTether();
  if (attached) {
    spaceAudio.playTetherLatch();
  } else {
    spaceAudio.playTetherCut();
  }
}

function handleReset(): void {
  engine.reset();
  modalWin.classList.add('hidden');
  modalDefeat.classList.add('hidden');
  spaceAudio.stopThruster();
}

// Modal controls
btnStartGame.addEventListener('click', () => {
  modalBrief.classList.add('hidden');
  isGameRunning = true;
  spaceAudio.ensureAudio();
});

btnHelp.addEventListener('click', () => {
  modalBrief.classList.remove('hidden');
});

btnRestart.addEventListener('click', () => {
  handleReset();
});

btnPlayAgain.addEventListener('click', () => {
  handleReset();
});

btnRetryDefeat.addEventListener('click', () => {
  handleReset();
});

function updateTelemetry(): void {
  const state = engine.getShipState();
  const status = engine.getGameStatus();

  // Fuel bar
  fuelText.textContent = `${Math.round(state.fuel)}%`;
  fuelBar.style.width = `${Math.max(0, state.fuel)}%`;
  if (state.fuel < 20) {
    fuelBar.style.background = '#ff4444';
  } else if (state.fuel < 40) {
    fuelBar.style.background = '#ffaa00';
  } else {
    fuelBar.style.background = '#ffaa00';
  }

  // Hull bar
  hullText.textContent = `${Math.round(state.hull)}%`;
  hullBar.style.width = `${Math.max(0, state.hull)}%`;
  if (state.hull < 30) {
    hullBar.style.background = '#ff4444';
  } else {
    hullBar.style.background = '#00ffaa';
  }

  // Tether status
  if (state.tetherAttachedToId) {
    const tensionPct = Math.round(state.tetherTension * 100);
    tetherStatus.textContent = `TETHER LOCKED (STRAIN: ${tensionPct}%)`;
    tetherStatus.style.color = state.tetherTension > 0.8 ? '#ff4444' : '#00e5ff';
  } else {
    tetherStatus.textContent = 'DISENGAGED (READY)';
    tetherStatus.style.color = '#64748b';
  }

  // Counter
  const salvageMap = engine.getSalvageBodies();
  const securedCount = Array.from(salvageMap.values()).filter(v => v.item.isSalvaged).length;
  salvageCounter.textContent = `${securedCount} / ${salvageMap.size} SECURED`;

  // Score
  scoreText.textContent = `${state.score} PTS`;

  // Game over check
  if (status === 'WON' && modalWin.classList.contains('hidden')) {
    modalWin.classList.remove('hidden');
    winScoreText.textContent = `FINAL SCORE: ${state.score} PTS`;
    spaceAudio.playSalvageDocked();
  } else if (status === 'DESTROYED' && modalDefeat.classList.contains('hidden')) {
    modalDefeat.classList.remove('hidden');
    defeatReason.textContent = 'HULL INTEGRITY COMPROMISED BY DEBRIS COLLISION';
  } else if (status === 'STRANDED' && modalDefeat.classList.contains('hidden')) {
    modalDefeat.classList.remove('hidden');
    defeatReason.textContent = 'FUEL TANKS EXHAUSTED // LOST IN ORBIT';
  }
}

// 60fps Loop
let lastTime = performance.now();

function frameLoop(time: number): void {
  const dt = Math.min(32, time - lastTime);
  lastTime = time;

  if (isGameRunning && engine.getGameStatus() === 'PLAYING') {
    // Process input continuous forces
    let isThrusting = false;
    if (keys['w'] || keys['arrowup']) {
      engine.applyThrust();
      isThrusting = true;
    }
    if (keys['s'] || keys['arrowdown']) {
      engine.applyBrake();
    }
    if (keys['a'] || keys['arrowleft']) {
      engine.applyTurn(-1);
    }
    if (keys['d'] || keys['arrowright']) {
      engine.applyTurn(1);
    }

    // Audio sync for thruster sound
    if (isThrusting) {
      spaceAudio.startThruster();
    } else {
      spaceAudio.stopThruster();
    }

    engine.update(dt);

    // Process physics events
    const events = engine.pollEvents();
    for (const ev of events) {
      if (ev.type === 'COLLISION_DAMAGE') {
        spaceAudio.playCollision();
      } else if (ev.type === 'SALVAGE_SECURED') {
        spaceAudio.playSalvageDocked();
      } else if (ev.type === 'TETHER_CUT') {
        spaceAudio.playTetherCut();
      }
    }

    updateTelemetry();
  } else {
    spaceAudio.stopThruster();
  }

  view.render(engine);
  requestAnimationFrame(frameLoop);
}

requestAnimationFrame(frameLoop);
