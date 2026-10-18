import { spaceAudio } from './audio/spaceAudio';
import { SpaceEngine } from './physics/spaceEngine';
import { SpaceView3D } from './renderer/spaceView3D';

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
const shieldText = document.getElementById('shieldText') as HTMLElement;
const shieldBar = document.getElementById('shieldBar') as HTMLElement;
const btnAssist = document.getElementById('btnAssist') as HTMLButtonElement;
const assistText = document.getElementById('assistText') as HTMLElement;
const btnBlackbox = document.getElementById('btnBlackbox') as HTMLButtonElement;
const intelCount = document.getElementById('intelCount') as HTMLElement;
const modalBlackbox = document.getElementById('modalBlackbox') as HTMLElement;
const btnBlackboxDismiss = document.getElementById('btnBlackboxDismiss') as HTMLButtonElement;
const blackboxLogList = document.getElementById('blackboxLogList') as HTMLElement;

const radioCommBox = document.getElementById('radioCommBox') as HTMLElement;
const radioCallsign = document.getElementById('radioCallsign') as HTMLElement;
const radioText = document.getElementById('radioText') as HTMLElement;

const radarMiniCanvas = document.getElementById('radarMiniCanvas') as HTMLCanvasElement | null;
const radarCtx = radarMiniCanvas?.getContext('2d');
const hazardWarningBanner = document.getElementById('hazardWarningBanner') as HTMLElement | null;
let lastHazardAlarmTime = 0;

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
const view = new SpaceView3D(canvas);

let isGameRunning = false;
let isPaused = false;
const keys: Record<string, boolean> = {};

function syncMissionUI(): void {
  const mission = engine.getCurrentMission();
  const idx = engine.getMissionIndex();

  missionBadge.textContent = `MISSION ${idx + 1} / ${engine.getTotalMissions()}`;
  missionDescShort.textContent = mission.name.replace(/MISSION \d+: /, '');
  briefTitle.textContent = mission.name;
  briefDescription.innerHTML = `<strong>${mission.subtitle}</strong><br><br>${mission.description}<br><br><span style="color: #64748b; font-size: 11px;">[SECTOR INTEL] ${mission.sectorLore}</span>`;

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

  // Toggle Flight Assist / Dampeners
  if (e.key === 'x' || e.key === 'X') {
    e.preventDefault();
    toggleAssist();
    return;
  }

  // Toggle Blackbox Manifest Logs
  if (e.key === 'l' || e.key === 'L') {
    e.preventDefault();
    toggleBlackbox();
    return;
  }

  // Quick mission jump [1]..[5]
  if (e.key >= '1' && e.key <= '5') {
    const idx = parseInt(e.key, 10) - 1;
    if (idx < engine.getTotalMissions()) {
      e.preventDefault();
      engine.loadMission(idx);
      modalBrief.classList.add('hidden');
      modalWin.classList.add('hidden');
      modalDefeat.classList.add('hidden');
      modalAllComplete.classList.add('hidden');
      isGameRunning = true;
      syncMissionUI();
      return;
    }
  }

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
    const mission = engine.getCurrentMission();
    const comm = mission.radioComms?.find(c => c.trigger === 'TETHER');
    if (comm) {
      showRadioComm(`${comm.callsign} // ${comm.sender}`, comm.text);
    }
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

function toggleAssist(): void {
  const assist = engine.toggleFlightAssist();
  assistText.textContent = assist ? 'ASSIST: ON' : 'ASSIST: OFF';
  btnAssist.style.borderColor = assist ? '#00e5ff' : '#64748b';
  spaceAudio.ensureAudio();
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
  const mission = engine.getCurrentMission();
  const comm = mission.radioComms?.find(c => c.trigger === 'START');
  if (comm) {
    showRadioComm(`${comm.callsign} // ${comm.sender}`, comm.text);
  }
});

btnBriefing.addEventListener('click', () => {
  modalBrief.classList.toggle('hidden');
});

let radioTimer: number | null = null;
function showRadioComm(callsign: string, text: string): void {
  radioCallsign.textContent = callsign;
  radioText.textContent = text;
  radioCommBox.classList.remove('hidden');
  spaceAudio.ensureAudio();
  if (radioTimer) clearTimeout(radioTimer);
  radioTimer = window.setTimeout(() => {
    radioCommBox.classList.add('hidden');
  }, 6000);
}

const recoveredLogs: { name: string; ship: string; log: string; bounty: number }[] = [];

function recordSalvageLore(item: any): void {
  if (recoveredLogs.some(l => l.name === item.name)) return;
  recoveredLogs.push({
    name: item.name,
    ship: item.derelictShip || 'Unregistered Derelict',
    log: item.loreLog || 'Telemetry damaged during orbit decay.',
    bounty: item.bountyCredits || (item.scoreValue * 25)
  });
  intelCount.textContent = `LOGS: ${recoveredLogs.length}`;
  renderBlackboxList();
}

function renderBlackboxList(): void {
  if (recoveredLogs.length === 0) {
    blackboxLogList.innerHTML = '<div style="color: #64748b; font-size: 12px; text-align: center; padding: 24px;">NO BLACKBOX RECORDERS RETRIEVED YET. DOCK DERELICT CARGO TO RECOVER FLIGHT LOGS.</div>';
    return;
  }
  blackboxLogList.innerHTML = recoveredLogs.map(l => `
    <div class="blackbox-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h4>${l.name}</h4>
        <span style="color: #00ffaa; font-weight: 700; font-size: 11px;">+${l.bounty.toLocaleString()} CR</span>
      </div>
      <div class="blackbox-ship">ORIGIN: ${l.ship}</div>
      <div class="blackbox-log">"${l.log}"</div>
    </div>
  `).join('');
}

function toggleBlackbox(): void {
  modalBlackbox.classList.toggle('hidden');
  renderBlackboxList();
}

btnBlackbox.addEventListener('click', toggleBlackbox);
btnBlackboxDismiss.addEventListener('click', toggleBlackbox);

btnRestart.addEventListener('click', handleReset);
btnAssist.addEventListener('click', toggleAssist);
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

  // Shield bar
  shieldText.textContent = `${Math.round(state.shield)}%`;
  shieldBar.style.width = `${Math.max(0, state.shield)}%`;
  if (state.shield < 25) {
    shieldBar.style.background = '#ff4444';
  } else if (state.shield < 60) {
    shieldBar.style.background = '#00bcd4';
  } else {
    shieldBar.style.background = '#00e5ff';
  }

  // Assist status sync
  assistText.textContent = state.flightAssist ? 'ASSIST: ON' : 'ASSIST: OFF';
  btnAssist.style.borderColor = state.flightAssist ? '#00e5ff' : '#64748b';

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

function renderCockpitRadar(engine: SpaceEngine): void {
  if (!radarCtx || !radarMiniCanvas) return;
  const ctx = radarCtx;
  const w = radarMiniCanvas.width;
  const h = radarMiniCanvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radarRadius = 52;
  const worldRange = 600;
  const scale = radarRadius / worldRange;

  ctx.clearRect(0, 0, w, h);

  // Background circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radarRadius, 0, Math.PI * 2);
  ctx.clip();

  // Range rings
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.arc(cx, cy, 35, 0, Math.PI * 2);
  ctx.arc(cx, cy, radarRadius - 1, 0, Math.PI * 2);
  ctx.stroke();

  // Crosshairs
  ctx.beginPath();
  ctx.moveTo(cx - radarRadius, cy);
  ctx.lineTo(cx + radarRadius, cy);
  ctx.moveTo(cx, cy - radarRadius);
  ctx.lineTo(cx, cy + radarRadius);
  ctx.stroke();

  // Rotating sweep beam
  const sweepAngle = (performance.now() * 0.002) % (Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 255, 170, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(sweepAngle) * radarRadius, cy + Math.sin(sweepAngle) * radarRadius);
  ctx.stroke();

  const ship = engine.getShipBody();
  if (!ship) {
    ctx.restore();
    return;
  }
  const shipX = ship.position.x;
  const shipY = ship.position.y;

  // Helper to map world to radar coords clamped inside radarRadius
  const toRadar = (wx: number, wy: number) => {
    const dx = (wx - shipX) * scale;
    const dy = (wy - shipY) * scale;
    const d = Math.hypot(dx, dy);
    if (d > radarRadius - 3) {
      return { x: cx + (dx / d) * (radarRadius - 4), y: cy + (dy / d) * (radarRadius - 4) };
    }
    return { x: cx + dx, y: cy + dy };
  };

  // 1. Recovery Bay (Mothership Dock)
  const bay = engine.getRecoveryBay();
  const bayPos = toRadar(bay.x + bay.width / 2, bay.y + bay.height / 2);
  ctx.fillStyle = '#00ffaa';
  ctx.fillRect(bayPos.x - 3, bayPos.y - 3, 6, 6);

  // 2. Salvage Items
  const salvage = engine.getSalvageBodies();
  for (const entry of salvage.values()) {
    if (entry.item.isSalvaged) continue;
    const sPos = toRadar(entry.body.position.x, entry.body.position.y);
    ctx.fillStyle = entry.item.type === 'CORE' ? '#a855f7' : (entry.item.type === 'FUEL_POD' ? '#ffaa00' : '#00e5ff');
    ctx.beginPath();
    ctx.arc(sPos.x, sPos.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Asteroid Hazards
  const asteroids = engine.getAsteroidHazards();
  ctx.fillStyle = '#ef4444';
  let closestHazardDist = Infinity;
  let isNearSingularity = false;

  for (const ast of asteroids) {
    const aDist = Math.hypot(ast.x - shipX, ast.y - shipY);
    if (aDist < closestHazardDist) closestHazardDist = aDist;
    const aPos = toRadar(ast.x, ast.y);
    ctx.beginPath();
    ctx.arc(aPos.x, aPos.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Gravity Wells / Singularity
  const wells = engine.getGravityWells();
  for (const gw of wells) {
    const gDist = Math.hypot(gw.x - shipX, gw.y - shipY);
    if (gDist < gw.radius * 0.75) isNearSingularity = true;
    const gPos = toRadar(gw.x, gw.y);
    ctx.strokeStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(gPos.x, gPos.y, Math.max(3, gw.radius * scale), 0, Math.PI * 2);
    ctx.stroke();
  }

  // 5. Player Ship in Center
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ship.angle + Math.PI / 2);
  ctx.fillStyle = '#00e5ff';
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-4, 4);
  ctx.lineTo(4, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();

  // Proximity Hazard Warning Evaluation
  const speed = Math.hypot(ship.velocity.x, ship.velocity.y);
  const isCollisionThreat = closestHazardDist < 130 && speed > 1.2;

  if (isCollisionThreat || isNearSingularity) {
    if (hazardWarningBanner) {
      hazardWarningBanner.textContent = isNearSingularity ?
        '⚠️ GRAVITATIONAL SHEAR CRITICAL // EVENT HORIZON PROXIMITY' :
        '⚠️ COLLISION WARNING // VELOCITY VECTOR HAZARD';
      hazardWarningBanner.classList.remove('hidden');
    }
    const now = performance.now();
    if (now - lastHazardAlarmTime > 750) {
      spaceAudio.playHazardAlarm();
      lastHazardAlarmTime = now;
    }
  } else if (hazardWarningBanner) {
    hazardWarningBanner.classList.add('hidden');
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
        const salvageMap = engine.getSalvageBodies();
        for (const entry of salvageMap.values()) {
          if (entry.item.isSalvaged) {
            recordSalvageLore(entry.item);
          }
        }
        const mission = engine.getCurrentMission();
        const comm = mission.radioComms?.find(c => c.trigger === 'DOCK');
        if (comm) {
          showRadioComm(`${comm.callsign} // ${comm.sender}`, comm.text);
        }
      } else if (ev.type === 'TETHER_CUT') {
        spaceAudio.playTetherCut();
      }
    }

    updateTelemetry();
    renderCockpitRadar(engine);
  } else {
    spaceAudio.stopThruster();
  }

  view.render(engine);
  requestAnimationFrame(frameLoop);
}

requestAnimationFrame(frameLoop);
