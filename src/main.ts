import { spaceAudio } from './audio/spaceAudio';
import { SpaceEngine } from './physics/spaceEngine';
import { SpaceView } from './renderer/spaceView';

// DOM Elements
const canvas = document.getElementById('spaceCanvas') as HTMLCanvasElement;
const missionBadge = document.getElementById('missionBadge') as HTMLElement;
const missionDescShort = document.getElementById('missionDescShort') as HTMLElement;
const fuelText = document.getElementById('fuelText') as HTMLElement;
const fuelBar = document.getElementById('fuelBar') as HTMLElement;
const hullText = document.getElementById('hullText') as HTMLElement;
const hullBar = document.getElementById('hullBar') as HTMLElement;
const tetherStatus = document.getElementById('tetherStatus') as HTMLElement;
const salvageCounter = document.getElementById('salvageCounter') as HTMLElement;
const scoreText = document.getElementById('scoreText') as HTMLElement;

const btnRestart = document.getElementById('btnRestart') as HTMLButtonElement;
const btnBriefing = document.getElementById('btnBriefing') as HTMLButtonElement;
const modalBrief = document.getElementById('modalBrief') as HTMLElement;
const btnStartGame = document.getElementById('btnStartGame') as HTMLButtonElement;
const briefTitle = document.getElementById('briefTitle') as HTMLElement;
const briefDescription = document.getElementById('briefDescription') as HTMLElement;

const btnMute = document.getElementById('btnMute') as HTMLButtonElement;
const muteLabel = document.getElementById('muteLabel') as HTMLElement;
const btnPause = document.getElementById('btnPause') as HTMLButtonElement;
const pauseLabel = document.getElementById('pauseLabel') as HTMLElement;
const modalPause = document.getElementById('modalPause') as HTMLElement;
const btnResumeGame = document.getElementById('btnResumeGame') as HTMLButtonElement;

const modalWin = document.getElementById('modalWin') as HTMLElement;
const winTimeVal = document.getElementById('winTimeVal') as HTMLElement;
const winFuelVal = document.getElementById('winFuelVal') as HTMLElement;
const winHullVal = document.getElementById('winHullVal') as HTMLElement;
const winScoreText = document.getElementById('winScoreText') as HTMLElement;
const btnNextMission = document.getElementById('btnNextMission') as HTMLButtonElement;

const modalAllComplete = document.getElementById('modalAllComplete') as HTMLElement;
const grandScoreText = document.getElementById('grandScoreText') as HTMLElement;
const btnReplayAll = document.getElementById('btnReplayAll') as HTMLButtonElement;

const modalDefeat = document.getElementById('modalDefeat') as HTMLElement;
const defeatReason = document.getElementById('defeatReason') as HTMLElement;
const btnRetryDefeat = document.getElementById('btnRetryDefeat') as HTMLButtonElement;

// Initialization
const engine = new SpaceEngine(1200, 700, 0);
const view = new SpaceView(canvas);

let isGameRunning = false;
let isPaused = false;
const keys: Record<string, boolean> = {};

function syncMissionUI(): void {
  const mission = engine.getCurrentMission();
  const idx = engine.getMissionIndex();

  missionBadge.textContent = `MISSION ${idx + 1} / ${engine.getTotalMissions()}`;
  missionDescShort.textContent = mission.name.replace(/MISSION \d+: /, '');
  briefTitle.textContent = mission.name;
  briefDescription.textContent = mission.description;

  document.querySelectorAll('.btn-mission-item').forEach(el => {
    const mIdx = parseInt(el.getAttribute('data-mission') || '0', 10);
    if (mIdx === idx) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}

syncMissionUI();

// Keyboard input
window.addEventListener('keydown', (e) => {
  spaceAudio.ensureAudio();

  // Pause
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    e.preventDefault();
    togglePause();
    return;
  }

  // Mute
  if (e.key === 'm' || e.key === 'M') {
    e.preventDefault();
    toggleMute();
    return;
  }

  // Reset
  if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    handleReset();
    return;
  }

  if (isPaused) return;

  keys[e.key.toLowerCase()] = true;

  if (e.code === 'Space') {
    e.preventDefault();
    handleTetherToggle();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function handleTetherToggle(): void {
  if (!isGameRunning || engine.getGameStatus() !== 'PLAYING') return;
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
  modalAllComplete.classList.add('hidden');
  modalPause.classList.add('hidden');
  spaceAudio.stopThruster();
  syncMissionUI();
}

function toggleMute(): void {
  const muted = spaceAudio.setMute(!spaceAudio.isAudioMuted());
  muteLabel.textContent = muted ? 'SFX: MUTED' : 'SFX: ON';
}

function togglePause(): void {
  isPaused = !isPaused;
  engine.setPaused(isPaused);
  if (isPaused) {
    modalPause.classList.remove('hidden');
    pauseLabel.textContent = 'RESUME';
    spaceAudio.stopThruster();
  } else {
    modalPause.classList.add('hidden');
    pauseLabel.textContent = 'PAUSE';
  }
}

// Modal controls
btnStartGame.addEventListener('click', () => {
  modalBrief.classList.add('hidden');
  isGameRunning = true;
  spaceAudio.ensureAudio();
});

btnBriefing.addEventListener('click', () => {
  modalBrief.classList.toggle('hidden');
});

btnRestart.addEventListener('click', handleReset);
btnMute.addEventListener('click', toggleMute);
btnPause.addEventListener('click', togglePause);
btnResumeGame.addEventListener('click', togglePause);

btnNextMission.addEventListener('click', () => {
  modalWin.classList.add('hidden');
  const hasNext = engine.nextMission();
  if (hasNext) {
    syncMissionUI();
  }
});

btnReplayAll.addEventListener('click', () => {
  modalAllComplete.classList.add('hidden');
  engine.loadMission(0);
  syncMissionUI();
});

btnRetryDefeat.addEventListener('click', handleReset);

// Mission selection buttons
document.querySelectorAll('.btn-mission-item').forEach(el => {
  el.addEventListener('click', (e) => {
    const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-mission') || '0', 10);
    engine.loadMission(idx);
    modalBrief.classList.add('hidden');
    modalWin.classList.add('hidden');
    modalDefeat.classList.add('hidden');
    modalAllComplete.classList.add('hidden');
    isGameRunning = true;
    syncMissionUI();
  });
});

function updateTelemetry(): void {
  const state = engine.getShipState();
  const status = engine.getGameStatus();

  // Fuel bar
  fuelText.textContent = `${Math.round(state.fuel)}%`;
  fuelBar.style.width = `${Math.max(0, state.fuel)}%`;
  if (state.fuel < 25) {
    fuelBar.style.background = '#ff4444';
  } else if (state.fuel < 45) {
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
    tetherStatus.style.color = state.tetherTension > 0.8 ? '#ff4444' : (state.tetherTension > 0.45 ? '#ffaa00' : '#00e5ff');
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
  if (status === 'WON' && modalWin.classList.contains('hidden') && modalAllComplete.classList.contains('hidden')) {
    const metrics = engine.getMetrics();
    winTimeVal.textContent = `${metrics.timeElapsedSeconds}s`;
    winFuelVal.textContent = `${metrics.fuelRemaining}%`;
    winHullVal.textContent = `${metrics.hullRemaining}%`;
    winScoreText.textContent = `${metrics.score} PTS`;

    if (engine.getMissionIndex() < engine.getTotalMissions() - 1) {
      modalWin.classList.remove('hidden');
    } else {
      modalAllComplete.classList.remove('hidden');
      grandScoreText.textContent = `CUMULATIVE BOUNTY: ${metrics.score} PTS`;
    }
    spaceAudio.playSalvageDocked();
  } else if (status === 'DESTROYED' && modalDefeat.classList.contains('hidden')) {
    modalDefeat.classList.remove('hidden');
    defeatReason.textContent = 'HULL INTEGRITY COMPROMISED BY HIGH-SPEED IMPACT';
  } else if (status === 'STRANDED' && modalDefeat.classList.contains('hidden')) {
    modalDefeat.classList.remove('hidden');
    defeatReason.textContent = 'FUEL TANKS EXHAUSTED // LOST IN DEEP SPACE';
  }
}

// 60fps Loop
let lastTime = performance.now();

function frameLoop(time: number): void {
  const dt = Math.min(32, time - lastTime);
  lastTime = time;

  if (isGameRunning && !isPaused && engine.getGameStatus() === 'PLAYING') {
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
        view.triggerShake(Math.min(18, (ev.intensity || 5) * 1.5));
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
