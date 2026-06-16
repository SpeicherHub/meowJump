import './styles.css';

const canvas = document.querySelector('#gameCanvas');
const ctx = canvas.getContext('2d');
const assetBaseUrl = 'https://meowgame.tos-cn-beijing.volces.com/';
const assetUrl = (path) => `${assetBaseUrl}${path}`;

const ui = {
  score: document.querySelector('#scoreValue'),
  best: document.querySelector('#bestValue'),
  finalScore: document.querySelector('#finalScore'),
  finalRegion: document.querySelector('#finalRegion'),
  finalPraise: document.querySelector('#finalPraise'),
  readyPanel: document.querySelector('#readyPanel'),
  gameOverPanel: document.querySelector('#gameOverPanel'),
  modalBackdrop: document.querySelector('#modalBackdrop'),
  assetError: document.querySelector('#assetError'),
  hud: document.querySelector('.hud'),
  startButton: document.querySelector('#startButton'),
  restartButton: document.querySelector('#restartButton'),
  pauseButton: document.querySelector('#pauseButton'),
  bossHealthCard: document.querySelector('#bossHealthCard'),
  bossHealthFill: document.querySelector('#bossHealthFill'),
  bossPlayerHealth: document.querySelector('#bossPlayerHealth'),
};

const assetManifest = {
  characterIdle: assetUrl('assets/character-idle.png'),
  characterJump: assetUrl('assets/character-jump.png'),
  characterFall: assetUrl('assets/character-fall.png'),
  characterRocket: assetUrl('assets/character-rocket.png'),
  rocketPowerup: assetUrl('assets/rocket-powerup.png'),
  springPowerup: assetUrl('assets/spring-powerup.png'),
  basketballBackground: assetUrl('assets/scenes/basketball-background.png'),
  basketballPlatform: assetUrl('assets/scenes/basketball-platform-normal.png'),
  basketballPlatformFragile: assetUrl('assets/scenes/basketball-platform-fragile.png'),
  candyBackground: assetUrl('assets/scenes/candy-background.png'),
  candyPlatform: assetUrl('assets/scenes/candy-platform-normal.png'),
  candyPlatformFragile: assetUrl('assets/scenes/candy-platform-fragile.png'),
  forestBackground: assetUrl('assets/scenes/forest-background.png'),
  forestPlatform: assetUrl('assets/scenes/forest-platform-normal.png'),
  forestPlatformFragile: assetUrl('assets/scenes/forest-platform-fragile.png'),
  chongqingBackground: assetUrl('assets/scenes/chongqing-background.png'),
  chongqingPlatform: assetUrl('assets/scenes/chongqing-platform-normal.png'),
  chongqingPlatformFragile: assetUrl('assets/scenes/chongqing-platform-fragile.png'),
  spaceBackground: assetUrl('assets/scenes/space-background.png'),
  spacePlatform: assetUrl('assets/scenes/space-platform-normal.png'),
  spacePlatformFragile: assetUrl('assets/scenes/space-platform-fragile.png'),
  basketballBossIdle: assetUrl('assets/bosses/basketballBossIdle.png'),
  basketballBossAttack: assetUrl('assets/bosses/basketballBossAttack.png'),
  basketballBossProjectile: assetUrl('assets/bosses/basketballBossProjectile.png'),
  characterBossIdle: assetUrl('assets/bosses/character-boss-idle.png'),
  characterBossShoot: assetUrl('assets/bosses/character-boss-shoot.png'),
  basketballBossSuccessBanner: assetUrl('assets/bosses/basketballBossSuccessBanner.png'),
};

const sceneTimeline = [
  { id: 'basketball', start: 0, end: 50 },
  { id: 'candy', start: 50, end: 100 },
  { id: 'forest', start: 100, end: 150 },
  { id: 'chongqing', start: 150, end: 200 },
  { id: 'space', start: 200, end: Infinity },
];

const sceneResults = {
  basketball: {
    name: '篮球乐园',
    praise: '小猫热身完成，弹跳手感已经在线！',
  },
  candy: {
    name: '糖果物语',
    praise: '你已经跳进甜甜云层，下一站会更高更闪亮！',
  },
  forest: {
    name: '森林秘境',
    praise: '穿过树梢的风都在给你鼓掌，继续向上冲！',
  },
  chongqing: {
    name: '魔幻重庆',
    praise: '你跳到了山城天际线，喵喵的弹跳力太巴适了！',
  },
  space: {
    name: '宇宙星河',
    praise: '已经飞向宇宙啦，这只小猫简直是星际跳跃冠军！',
  },
};

const platformPreviewMeters = 10;
const backgroundFadeLeadMeters = 5;
const backgroundFadeDurationMs = 1500;

const config = {
  worldWidth: 390,
  minWorldHeight: 720,
  gravity: 1720,
  jumpVelocity: -760,
  moveSpeed: 430,
  platformWidth: 115,
  platformHeight: 31,
  platformDrawHeight: 43,
  platformGapMin: 86,
  platformGapMax: 132,
  doublePlatformChance: 0.1,
  doublePlatformMinGap: 36,
  startingNormalOnlyMeters: 3,
  movingPlatformChance: 0.1,
  movingPlatformSpeedMin: 54,
  movingPlatformSpeedMax: 82,
  playerWidth: 140,
  playerHeight: 151,
  footHitboxWidthRatio: 0.32,
  minFootOverlapRatio: 0.35,
  platformLandingInset: 12,
  meterGridHeight: 100,
  fragilePlatformStartMeters: 1,
  fragilePlatformMidMeters: 20,
  fragilePlatformChance: 0.1,
  fragilePlatformHardMeters: 50,
  fragilePlatformMidChance: 0.2,
  fragilePlatformHardChance: 0.25,
  fragilePlatformExpertMeters: 100,
  fragilePlatformExpertChance: 0.3,
  fragileBreakDuration: 0.65,
  fragileBreakGravity: 980,
  rocketSpawnEveryMeters: 20,
  rocketFirstSpawnMeters: 15,
  rocketSceneTransitionBlockMeters: 15,
  rocketBossExitBlockMeters: 8,
  rocketBoostMeters: 10,
  rocketBoostSpeed: 1200,
  rocketExitVelocity: -520,
  rocketWidth: 42,
  rocketHeight: 58,
  rocketHitboxInsetX: 9,
  rocketHitboxInsetY: 8,
  springStartMeters: 3,
  springHighChanceMeters: 50,
  springLowChance: 0.1,
  springHighChance: 0.15,
  springJumpMultiplier: 1.45,
  springWidth: 42,
  springHeight: 28,
  startPlatformYRatio: 0.78,
  cameraLiftRatio: 0.42,
  bossGateMeters: 50,
  bossGateRadius: 56,
  bossGateAttractDuration: 1.15,
  bossGateScreenTriggerRatio: 0.46,
  bossPlayerWidth: 118,
  bossPlayerHeight: 133,
  bossFloorHeight: 28,
  bossWidth: 188,
  bossHeight: 141,
  bossProjectileSize: 42,
  bossPlayerBulletRadius: 5,
  bossPlayerSpeed: 360,
  bossMaxHp: 20,
  bossPlayerHp: 3,
  bossPlayerFireInterval: 0.35,
  bossFireIntervalMin: 1.1,
  bossFireIntervalMax: 1.4,
  bossAttackWindupMin: 0.18,
  bossAttackWindupMax: 0.22,
  bossProjectileSpeed: 275,
  bossBulletSpeed: 560,
  bossPlayerBillWidth: 24,
  bossPlayerBillHeight: 14,
  bossInvulnerableDuration: 0.75,
  bossPlayerShootPoseDuration: 0.14,
  bossSuccessDuration: 1.6,
};

const basketballBossConfig = {
  sceneId: 'basketball',
  gateMeters: 50,
  nextSceneMeters: 51,
  idleAsset: 'basketballBossIdle',
  attackAsset: 'basketballBossAttack',
  projectileAsset: 'basketballBossProjectile',
};

const input = {
  left: false,
  right: false,
};

let assets = {};
let state = 'ready';
let paused = false;
let rafId = 0;
let lastTime = 0;
let worldHeight = config.minWorldHeight;
let scale = 1;
let bestScore = Number(localStorage.getItem('meow-jump-best') || 0);

const game = {
  score: 0,
  cameraY: 0,
  highestY: 0,
  phase: 'jump',
  player: {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    mode: 'normal',
    rocketTargetY: null,
  },
  platforms: [],
  rocketBuckets: new Set(),
  breakFragments: [],
  clearedBossGates: new Set(),
  bossGate: null,
  bossBattle: null,
  bossSuccess: null,
  backgroundSceneId: sceneTimeline[0].id,
  backgroundTransition: null,
};

ui.best.textContent = formatMeters(bestScore);

function formatMeters(value) {
  return `${Math.max(0, Math.floor(value))}m`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

function setViewportHeight() {
  const viewportHeight = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight;
  document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
}

async function loadAssets() {
  const entries = await Promise.all(
    Object.entries(assetManifest).map(async ([key, src]) => [key, await loadImage(src)]),
  );
  assets = Object.fromEntries(entries);
}

function resizeCanvas() {
  setViewportHeight();
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  scale = rect.width / config.worldWidth;
  worldHeight = Math.max(config.minWorldHeight, rect.height / scale);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function metersFromY(y) {
  return Math.max(0, Math.floor(Math.abs(y) / config.meterGridHeight));
}

function isInStartingNormalZone(y) {
  return y > -config.startingNormalOnlyMeters * config.meterGridHeight;
}

function findSceneIndex(meters) {
  const index = sceneTimeline.findIndex((scene) => meters >= scene.start && meters < scene.end);
  return index === -1 ? sceneTimeline.length - 1 : index;
}

function isBasketballBossCleared() {
  return game.clearedBossGates.has(basketballBossConfig.gateMeters);
}

function getBasketballBossGateY() {
  return -basketballBossConfig.gateMeters * config.meterGridHeight;
}

function clampMetersForLockedBasketballBoss(meters) {
  if (!isBasketballBossCleared() && meters >= basketballBossConfig.gateMeters) {
    return basketballBossConfig.gateMeters - 1;
  }

  return meters;
}

function getBackgroundSceneId(meters) {
  meters = clampMetersForLockedBasketballBoss(meters);
  for (let index = 1; index < sceneTimeline.length; index += 1) {
    const scene = sceneTimeline[index];
    if (!isBasketballBossCleared() && scene.start === basketballBossConfig.gateMeters) continue;
    if (meters >= scene.start - backgroundFadeLeadMeters && meters < scene.start) {
      return scene.id;
    }
  }

  return sceneTimeline[findSceneIndex(meters)].id;
}

function updateBackgroundTransition(meters) {
  const targetSceneId = getBackgroundSceneId(meters);
  const activeToSceneId = game.backgroundTransition?.to;
  if (targetSceneId === game.backgroundSceneId || targetSceneId === activeToSceneId) return;

  game.backgroundTransition = {
    from: game.backgroundSceneId,
    to: targetSceneId,
    startTime: performance.now(),
  };
}

function getBackgroundLayers(meters) {
  updateBackgroundTransition(meters);

  if (!game.backgroundTransition) {
    return [{ id: game.backgroundSceneId, alpha: 1 }];
  }

  const progress = Math.min(1, (performance.now() - game.backgroundTransition.startTime) / backgroundFadeDurationMs);
  const layers = [
    { id: game.backgroundTransition.from, alpha: 1 - progress },
    { id: game.backgroundTransition.to, alpha: progress },
  ];

  if (progress >= 1) {
    game.backgroundSceneId = game.backgroundTransition.to;
    game.backgroundTransition = null;
  }

  return layers;
}

function getPlatformSceneId(meters) {
  meters = clampMetersForLockedBasketballBoss(meters);
  for (let index = 1; index < sceneTimeline.length; index += 1) {
    const scene = sceneTimeline[index];
    if (!isBasketballBossCleared() && scene.start === basketballBossConfig.gateMeters) continue;
    if (meters >= scene.start - platformPreviewMeters && meters < scene.start) {
      return scene.id;
    }
  }

  return sceneTimeline[findSceneIndex(meters)].id;
}

function getSceneResult(meters) {
  const sceneId = sceneTimeline[findSceneIndex(meters)].id;
  return sceneResults[sceneId] || sceneResults.basketball;
}

function getSceneAsset(sceneId, assetType) {
  const sceneKey = `${sceneId}${assetType}`;
  return assets[sceneKey] || assets.basketballPlatform;
}

function canCarryPowerup(platform) {
  return platform.type === 'normal' || platform.type === 'moving';
}

function choosePlatformType(y, allowMoving = true) {
  const meters = metersFromY(y);
  if (isInStartingNormalZone(y)) return 'normal';
  if (allowMoving && Math.random() < config.movingPlatformChance) return 'moving';
  if (meters < config.fragilePlatformStartMeters) return 'normal';

  const chance =
    meters >= config.fragilePlatformExpertMeters
      ? config.fragilePlatformExpertChance
      : meters >= config.fragilePlatformHardMeters
      ? config.fragilePlatformHardChance
      : meters >= config.fragilePlatformMidMeters
        ? config.fragilePlatformMidChance
      : config.fragilePlatformChance;
  return Math.random() < chance ? 'fragile' : 'normal';
}

function getRocketBucket(y) {
  const meters = metersFromY(y);
  if (meters < config.rocketFirstSpawnMeters) return null;
  if (
    isBasketballBossCleared() &&
    meters >= basketballBossConfig.nextSceneMeters &&
    meters < basketballBossConfig.nextSceneMeters + config.rocketBossExitBlockMeters
  ) {
    return null;
  }

  const upcomingScene = sceneTimeline.find((scene) => scene.start > meters);
  if (
    upcomingScene &&
    meters >= upcomingScene.start - config.rocketSceneTransitionBlockMeters &&
    meters < upcomingScene.start
  ) {
    return null;
  }

  return Math.floor((meters - config.rocketFirstSpawnMeters) / config.rocketSpawnEveryMeters);
}

function createRocketForPlatform(platform) {
  const bucket = getRocketBucket(platform.y);
  if (isInStartingNormalZone(platform.y) || bucket === null || !canCarryPowerup(platform) || game.rocketBuckets.has(bucket)) {
    return null;
  }

  game.rocketBuckets.add(bucket);
  return {
    collected: false,
    bucket,
    offsetX: platform.width / 2 - config.rocketWidth / 2,
    offsetY: -config.rocketHeight + 6,
  };
}

function createSpringForPlatform(platform) {
  const meters = metersFromY(platform.y);
  if (isInStartingNormalZone(platform.y) || meters < config.springStartMeters || !canCarryPowerup(platform) || platform.rocket) {
    return null;
  }

  const chance = meters >= config.springHighChanceMeters ? config.springHighChance : config.springLowChance;
  if (Math.random() >= chance) return null;

  return {
    used: false,
    offsetX: platform.width / 2 - config.springWidth / 2,
    offsetY: -config.springHeight + 8,
  };
}

function createPlatform(x, y, width = config.platformWidth, type = choosePlatformType(y)) {
  const platform = { x, y, width, height: config.platformHeight, type, rocket: null, spring: null };
  if (type === 'moving') {
    const margin = 16;
    platform.movement = {
      minX: margin,
      maxX: config.worldWidth - width - margin,
      vx: randomBetween(config.movingPlatformSpeedMin, config.movingPlatformSpeedMax) * (Math.random() < 0.5 ? -1 : 1),
    };
  }
  platform.rocket = createRocketForPlatform(platform);
  platform.spring = createSpringForPlatform(platform);
  return platform;
}

function createPlatformRow(y, margin = 16) {
  const rowType = choosePlatformType(y);
  if (rowType === 'moving') {
    return [createPlatform(randomBetween(margin, config.worldWidth - config.platformWidth - margin), y, config.platformWidth, rowType)];
  }

  if (Math.random() >= config.doublePlatformChance) {
    return [createPlatform(randomBetween(margin, config.worldWidth - config.platformWidth - margin), y, config.platformWidth, rowType)];
  }

  const maxLeftX = config.worldWidth - margin - config.platformWidth * 2 - config.doublePlatformMinGap;
  if (maxLeftX <= margin) {
    return [createPlatform(randomBetween(margin, config.worldWidth - config.platformWidth - margin), y, config.platformWidth, rowType)];
  }

  const leftX = randomBetween(margin, maxLeftX);
  const rightX = randomBetween(
    leftX + config.platformWidth + config.doublePlatformMinGap,
    config.worldWidth - config.platformWidth - margin,
  );
  const platforms = [
    createPlatform(leftX, y, config.platformWidth, rowType),
    createPlatform(rightX, y, config.platformWidth, choosePlatformType(y, false)),
  ];
  return Math.random() < 0.5 ? platforms : platforms.reverse();
}

function vibrate(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

function createBreakFragments(platform) {
  const sceneId = getPlatformSceneId(metersFromY(platform.y));
  const pieces = 3;
  for (let index = 0; index < pieces; index += 1) {
    const pieceWidth = platform.width / pieces;
    game.breakFragments.push({
      sceneId,
      x: platform.x + pieceWidth * index,
      y: platform.y - 12,
      width: pieceWidth,
      height: config.platformDrawHeight,
      sxRatio: index / pieces,
      swRatio: 1 / pieces,
      vx: (index - 1) * 78 + randomBetween(-18, 18),
      vy: randomBetween(55, 135),
      rotation: randomBetween(-0.22, 0.22),
      rotationSpeed: (index - 1) * 1.8 + randomBetween(-0.7, 0.7),
      age: 0,
      lifetime: config.fragileBreakDuration,
    });
  }
}

function getRocketRect(platform) {
  if (!platform.rocket || platform.rocket.collected) return null;

  return {
    x: platform.x + platform.rocket.offsetX,
    y: platform.y + platform.rocket.offsetY,
    width: config.rocketWidth,
    height: config.rocketHeight,
  };
}

function intersects(rectA, rectB) {
  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}

function getPlayerBossRect() {
  const player = game.player;
  return {
    x: player.x + config.bossPlayerWidth * 0.18,
    y: player.y + config.bossPlayerHeight * 0.12,
    width: config.bossPlayerWidth * 0.64,
    height: config.bossPlayerHeight * 0.76,
  };
}

function getBossRect() {
  const battle = game.bossBattle;
  if (!battle) return null;

  return {
    x: battle.boss.x + config.bossWidth * 0.12,
    y: battle.boss.y + config.bossHeight * 0.1,
    width: config.bossWidth * 0.76,
    height: config.bossHeight * 0.68,
  };
}

function startRocketBoost(platform) {
  platform.rocket.collected = true;
  const player = game.player;
  player.mode = 'rocket';
  player.rocketTargetY = player.y - config.rocketBoostMeters * config.meterGridHeight;
  player.vy = -config.rocketBoostSpeed;
  vibrate([24, 30, 24]);
}

function collectRocketIfTouched() {
  const player = game.player;
  if (player.mode === 'rocket') return false;

  const playerBounds = {
    x: player.x + config.playerWidth * 0.3,
    y: player.y + config.playerHeight * 0.16,
    width: config.playerWidth * 0.4,
    height: config.playerHeight * 0.68,
  };

  for (const platform of game.platforms) {
    const rocketRect = getRocketRect(platform);
    if (!rocketRect) continue;

    const rocketHitbox = {
      x: rocketRect.x + config.rocketHitboxInsetX,
      y: rocketRect.y + config.rocketHitboxInsetY,
      width: rocketRect.width - config.rocketHitboxInsetX * 2,
      height: rocketRect.height - config.rocketHitboxInsetY * 2,
    };

    if (intersects(playerBounds, rocketHitbox)) {
      startRocketBoost(platform);
      return true;
    }
  }

  return false;
}

function resetGame() {
  resizeCanvas();
  state = 'playing';
  paused = false;
  game.score = 0;
  game.cameraY = 0;
  game.highestY = 0;
  game.phase = 'jump';
  game.player.x = config.worldWidth / 2 - config.playerWidth / 2;
  game.player.y = worldHeight * config.startPlatformYRatio - config.playerHeight;
  game.player.vx = 0;
  game.player.vy = config.jumpVelocity;
  game.player.mode = 'normal';
  game.player.rocketTargetY = null;
  game.rocketBuckets = new Set();
  game.breakFragments = [];
  game.clearedBossGates = new Set();
  game.bossGate = null;
  game.bossBattle = null;
  game.bossSuccess = null;
  game.backgroundSceneId = sceneTimeline[0].id;
  game.backgroundTransition = null;
  game.platforms = [
    createPlatform(config.worldWidth / 2 - config.platformWidth / 2, worldHeight * config.startPlatformYRatio, config.platformWidth, 'normal'),
  ];

  let y = worldHeight * config.startPlatformYRatio - randomBetween(config.platformGapMin, config.platformGapMax);
  while (y > -worldHeight * 1.4) {
    game.platforms.push(...createPlatformRow(y, 18));
    y -= randomBetween(config.platformGapMin, config.platformGapMax);
  }

  ui.readyPanel.classList.remove('is-visible');
  ui.gameOverPanel.classList.remove('is-visible');
  ui.modalBackdrop.classList.remove('is-visible');
  updateScore(0);
  syncBossHud(null);
}

function updateScore(score) {
  game.score = Math.max(0, Math.floor(score));
  ui.score.textContent = formatMeters(game.score);
}

function syncBossHud(battle = game.bossBattle) {
  const visible = state === 'playing' && game.phase === 'boss' && Boolean(battle);
  ui.hud?.classList.toggle('is-boss', visible);
  ui.bossHealthCard?.classList.toggle('is-visible', visible);
  ui.bossPlayerHealth?.classList.toggle('is-visible', visible);
  if (!visible || !battle) return;

  const hpRatio = Math.max(0, Math.min(1, battle.boss.hp / config.bossMaxHp));
  if (ui.bossHealthFill) {
    ui.bossHealthFill.style.transform = `scaleX(${hpRatio})`;
  }

  if (ui.bossPlayerHealth && ui.bossPlayerHealth.dataset.hp !== String(battle.playerHp)) {
    ui.bossPlayerHealth.dataset.hp = String(battle.playerHp);
    ui.bossPlayerHealth.replaceChildren();
    for (let index = 0; index < config.bossPlayerHp; index += 1) {
      const heart = document.createElement('span');
      heart.textContent = '♥';
      if (index >= battle.playerHp) heart.classList.add('is-empty');
      ui.bossPlayerHealth.append(heart);
    }
  }
}

function endGame() {
  state = 'gameOver';
  syncBossHud(null);
  bestScore = Math.max(bestScore, game.score);
  localStorage.setItem('meow-jump-best', bestScore.toString());
  ui.best.textContent = formatMeters(bestScore);
  ui.finalScore.textContent = formatMeters(game.score);
  const resultScore =
    game.phase === 'gate' || game.phase === 'boss' ? basketballBossConfig.gateMeters - 1 : game.score;
  const result = getSceneResult(resultScore);
  ui.finalRegion.textContent = result.name;
  ui.finalPraise.textContent = result.praise;
  ui.modalBackdrop.classList.add('is-visible');
  ui.gameOverPanel.classList.add('is-visible');
}

function ensurePlatforms() {
  if (game.platforms.length === 0) return;

  let topY = Math.min(...game.platforms.map((platform) => platform.y));
  const targetTop = game.cameraY - worldHeight * 1.1;

  while (topY > targetTop) {
    topY -= randomBetween(config.platformGapMin, config.platformGapMax);
    game.platforms.push(...createPlatformRow(topY, 16));
  }

  game.platforms = game.platforms.filter((platform) => platform.y < game.cameraY + worldHeight + 80);
}

function updateBreakFragments(dt) {
  for (const fragment of game.breakFragments) {
    fragment.age += dt;
    fragment.x += fragment.vx * dt;
    fragment.y += fragment.vy * dt;
    fragment.vy += config.fragileBreakGravity * dt;
    fragment.rotation += fragment.rotationSpeed * dt;
  }

  game.breakFragments = game.breakFragments.filter((fragment) => fragment.age < fragment.lifetime);
}

function updateMovingPlatforms(dt) {
  for (const platform of game.platforms) {
    if (!platform.movement) continue;

    platform.x += platform.movement.vx * dt;
    if (platform.x <= platform.movement.minX) {
      platform.x = platform.movement.minX;
      platform.movement.vx = Math.abs(platform.movement.vx);
    } else if (platform.x >= platform.movement.maxX) {
      platform.x = platform.movement.maxX;
      platform.movement.vx = -Math.abs(platform.movement.vx);
    }
  }
}

function updateCameraAndScore() {
  const cameraTrigger = game.cameraY + worldHeight * config.cameraLiftRatio;
  if (game.player.y < cameraTrigger) {
    game.cameraY = game.player.y - worldHeight * config.cameraLiftRatio;
  }

  game.highestY = Math.min(game.highestY, game.cameraY);
  updateScore(Math.min(metersFromY(game.highestY), isBasketballBossCleared() ? Infinity : basketballBossConfig.gateMeters));
}

function shouldStartBasketballBossGate() {
  const gateScreenY = getBasketballBossGateY() - game.cameraY;
  return (
    game.phase === 'jump' &&
    !isBasketballBossCleared() &&
    gateScreenY >= worldHeight * config.bossGateScreenTriggerRatio
  );
}

function startBossGate() {
  game.phase = 'gate';
  game.player.mode = 'normal';
  game.player.rocketTargetY = null;
  game.player.vy = Math.min(game.player.vy, -160);
  game.bossGate = {
    config: basketballBossConfig,
    age: 0,
    x: config.worldWidth / 2,
    y: getBasketballBossGateY(),
    radius: config.bossGateRadius,
  };
  vibrate([18, 32, 18]);
}

function startBossBattle() {
  const gateConfig = game.bossGate?.config || basketballBossConfig;
  game.phase = 'boss';
  game.bossGate = null;
  game.breakFragments = [];
  game.player.mode = 'boss';
  game.player.rocketTargetY = null;
  game.player.x = config.worldWidth / 2 - config.bossPlayerWidth / 2;
  game.player.y = worldHeight - config.bossPlayerHeight - 34;
  game.player.vx = 0;
  game.player.vy = 0;
  game.bossBattle = {
    config: gateConfig,
    boss: {
      x: config.worldWidth / 2 - config.bossWidth / 2,
      y: 70,
      vx: 82,
      hp: config.bossMaxHp,
      state: 'idle',
      attackTimer: 0,
      fireTimer: randomBetween(config.bossFireIntervalMin, config.bossFireIntervalMax),
    },
    playerHp: config.bossPlayerHp,
    playerInvulnerable: 0,
    playerFireTimer: 0.12,
    playerShootPose: 0,
    playerFacing: 1,
    playerBullets: [],
    bossProjectiles: [],
    elapsed: 0,
  };
}

function finishBossBattle() {
  const gateMeters = game.bossBattle?.config.gateMeters || basketballBossConfig.gateMeters;
  const nextSceneMeters = game.bossBattle?.config.nextSceneMeters || basketballBossConfig.nextSceneMeters;
  game.clearedBossGates.add(gateMeters);
  game.phase = 'success';
  game.bossBattle = null;
  game.bossSuccess = {
    age: 0,
    nextSceneMeters,
  };
  game.player.mode = 'normal';
  game.player.vx = 0;
  game.player.vy = 0;
  vibrate([24, 36, 24]);
}

function resumeAfterBossSuccess() {
  const nextSceneMeters = game.bossSuccess?.nextSceneMeters || basketballBossConfig.nextSceneMeters;
  const resumePlatformY = -nextSceneMeters * config.meterGridHeight + 38;

  game.phase = 'jump';
  game.bossSuccess = null;
  game.player.mode = 'normal';
  game.player.x = config.worldWidth / 2 - config.playerWidth / 2;
  game.player.y = resumePlatformY - config.playerHeight;
  game.player.vx = 0;
  game.player.vy = config.jumpVelocity;
  game.player.rocketTargetY = null;
  game.cameraY = game.player.y - worldHeight * config.cameraLiftRatio;
  game.highestY = Math.min(game.highestY, -nextSceneMeters * config.meterGridHeight);
  updateScore(nextSceneMeters);
  game.backgroundSceneId = 'candy';
  game.backgroundTransition = null;
  game.rocketBuckets = new Set();
  const resumePlatform = createPlatform(config.worldWidth / 2 - config.platformWidth / 2, resumePlatformY, config.platformWidth, 'normal');
  resumePlatform.rocket = null;
  resumePlatform.spring = null;
  game.platforms = [resumePlatform];

  let y = resumePlatformY - randomBetween(config.platformGapMin, config.platformGapMax);
  while (y > game.cameraY - worldHeight * 1.1) {
    game.platforms.push(...createPlatformRow(y, 18));
    y -= randomBetween(config.platformGapMin, config.platformGapMax);
  }
}

function updateBossGate(dt) {
  const gate = game.bossGate;
  if (!gate) return;

  gate.age += dt;
  const player = game.player;
  const playerCenterX = player.x + config.playerWidth / 2;
  const playerCenterY = player.y + config.playerHeight / 2;
  const dx = gate.x - playerCenterX;
  const dy = gate.y - playerCenterY;
  const distance = Math.hypot(dx, dy) || 1;
  const pull = Math.min(1, gate.age / config.bossGateAttractDuration);

  player.vx = dx * (1.6 + pull * 2.2);
  player.vy = dy * (1.6 + pull * 2.2);
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  if (player.x < -config.playerWidth) player.x = config.worldWidth;
  if (player.x > config.worldWidth) player.x = -config.playerWidth;

  if (distance < gate.radius * 0.72 || gate.age >= config.bossGateAttractDuration) {
    startBossBattle();
  }
}

function updateBossBattle(dt) {
  const battle = game.bossBattle;
  if (!battle) return;

  battle.elapsed += dt;
  battle.playerInvulnerable = Math.max(0, battle.playerInvulnerable - dt);
  battle.playerShootPose = Math.max(0, battle.playerShootPose - dt);

  const player = game.player;
  player.vx = 0;
  if (input.left) player.vx -= config.bossPlayerSpeed;
  if (input.right) player.vx += config.bossPlayerSpeed;
  if (player.vx < 0) battle.playerFacing = -1;
  if (player.vx > 0) battle.playerFacing = 1;
  player.x = Math.max(10, Math.min(config.worldWidth - config.bossPlayerWidth - 10, player.x + player.vx * dt));
  player.y = worldHeight - config.bossPlayerHeight - 34;

  battle.playerFireTimer -= dt;
  if (battle.playerFireTimer <= 0) {
    battle.playerFireTimer += config.bossPlayerFireInterval;
    battle.playerShootPose = config.bossPlayerShootPoseDuration;
    battle.playerBullets.push({
      x: player.x + config.bossPlayerWidth / 2 + battle.playerFacing * config.bossPlayerWidth * 0.37,
      y: player.y + 47,
      vy: -config.bossBulletSpeed,
      radius: config.bossPlayerBulletRadius,
      age: 0,
    });
  }

  const boss = battle.boss;
  boss.x += boss.vx * dt;
  const bossMinX = 12;
  const bossMaxX = config.worldWidth - config.bossWidth - 12;
  if (boss.x <= bossMinX) {
    boss.x = bossMinX;
    boss.vx = Math.abs(boss.vx);
  } else if (boss.x >= bossMaxX) {
    boss.x = bossMaxX;
    boss.vx = -Math.abs(boss.vx);
  }

  boss.fireTimer -= dt;
  if (boss.state === 'idle' && boss.fireTimer <= 0) {
    boss.state = 'attack';
    boss.attackTimer = randomBetween(config.bossAttackWindupMin, config.bossAttackWindupMax);
  }

  if (boss.state === 'attack') {
    boss.attackTimer -= dt;
    if (boss.attackTimer <= 0) {
      battle.bossProjectiles.push({
        x: boss.x + config.bossWidth * 0.38,
        y: boss.y + config.bossHeight * 0.68,
        vx: randomBetween(-24, 24),
        vy: config.bossProjectileSpeed,
        size: config.bossProjectileSize,
        age: 0,
      });
      boss.state = 'idle';
      boss.fireTimer = randomBetween(config.bossFireIntervalMin, config.bossFireIntervalMax);
    }
  }

  for (const bullet of battle.playerBullets) {
    bullet.age += dt;
    bullet.y += bullet.vy * dt;
  }
  battle.playerBullets = battle.playerBullets.filter((bullet) => bullet.y + bullet.radius > -20);

  const bossRect = getBossRect();
  if (bossRect) {
    for (const bullet of battle.playerBullets) {
      const bulletRect = {
        x: bullet.x - bullet.radius,
        y: bullet.y - bullet.radius,
        width: bullet.radius * 2,
        height: bullet.radius * 2,
      };
      if (!bullet.hit && intersects(bulletRect, bossRect)) {
        bullet.hit = true;
        boss.hp -= 1;
      }
    }
  }
  battle.playerBullets = battle.playerBullets.filter((bullet) => !bullet.hit);

  for (const projectile of battle.bossProjectiles) {
    projectile.age += dt;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
  }
  battle.bossProjectiles = battle.bossProjectiles.filter((projectile) => projectile.y < worldHeight + projectile.size);

  const playerRect = getPlayerBossRect();
  for (const projectile of battle.bossProjectiles) {
    const projectileRect = {
      x: projectile.x - projectile.size / 2,
      y: projectile.y - projectile.size / 2,
      width: projectile.size,
      height: projectile.size,
    };

    if (!projectile.hit && battle.playerInvulnerable <= 0 && intersects(projectileRect, playerRect)) {
      projectile.hit = true;
      battle.playerHp -= 1;
      battle.playerInvulnerable = config.bossInvulnerableDuration;
      vibrate([18, 24, 18]);
      if (battle.playerHp <= 0) {
        endGame();
        return;
      }
    }
  }
  battle.bossProjectiles = battle.bossProjectiles.filter((projectile) => !projectile.hit);

  if (boss.hp <= 0) {
    finishBossBattle();
  }
}

function updateBossSuccess(dt) {
  if (!game.bossSuccess) return;

  game.bossSuccess.age += dt;
  if (game.bossSuccess.age >= config.bossSuccessDuration) {
    resumeAfterBossSuccess();
  }
}

function update(dt) {
  if (state !== 'playing' || paused) return;

  if (game.phase === 'gate') {
    updateBossGate(dt);
    return;
  }

  if (game.phase === 'boss') {
    updateBossBattle(dt);
    return;
  }

  if (game.phase === 'success') {
    updateBossSuccess(dt);
    return;
  }

  const player = game.player;
  const previousBottom = player.y + config.playerHeight;
  updateMovingPlatforms(dt);

  player.vx = 0;
  if (input.left) player.vx -= config.moveSpeed;
  if (input.right) player.vx += config.moveSpeed;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  if (player.x < -config.playerWidth) player.x = config.worldWidth;
  if (player.x > config.worldWidth) player.x = -config.playerWidth;

  if (player.mode === 'rocket') {
    player.vy = -config.rocketBoostSpeed;
    if (player.rocketTargetY !== null && player.y <= player.rocketTargetY) {
      player.y = player.rocketTargetY;
      player.mode = 'normal';
      player.rocketTargetY = null;
      player.vy = config.rocketExitVelocity;
    }
  } else {
    player.vy += config.gravity * dt;
    collectRocketIfTouched();
  }

  if (player.mode === 'normal' && player.vy > 0) {
    for (const platform of game.platforms) {
      const nextBottom = player.y + config.playerHeight;
      const footWidth = config.playerWidth * config.footHitboxWidthRatio;
      const footLeft = player.x + (config.playerWidth - footWidth) / 2;
      const footRight = footLeft + footWidth;
      const platformLeft = platform.x + config.platformLandingInset;
      const platformRight = platform.x + platform.width - config.platformLandingInset;
      const footOverlap = Math.min(footRight, platformRight) - Math.max(footLeft, platformLeft);
      const horizontallyAligned = footOverlap >= footWidth * config.minFootOverlapRatio;
      const crossedPlatform = previousBottom <= platform.y + 4 && nextBottom >= platform.y;

      if (horizontallyAligned && crossedPlatform) {
        player.y = platform.y - config.playerHeight;
        const jumpMultiplier = platform.spring && !platform.spring.used ? config.springJumpMultiplier : 1;
        player.vy = config.jumpVelocity * jumpMultiplier;
        if (platform.spring && !platform.spring.used) {
          platform.spring.used = true;
          vibrate([16, 22, 16]);
        }
        if (platform.type === 'fragile') {
          createBreakFragments(platform);
          vibrate([18, 24, 18]);
          game.platforms = game.platforms.filter((candidate) => candidate !== platform);
        }
        break;
      }
    }
  }

  updateCameraAndScore();
  if (shouldStartBasketballBossGate()) {
    startBossGate();
    return;
  }
  ensurePlatforms();
  updateBreakFragments(dt);

  if (player.y - game.cameraY > worldHeight + 120) {
    endGame();
  }
}

function drawBreakFragment(fragment) {
  const img = getSceneAsset(fragment.sceneId, 'PlatformFragile');
  const progress = fragment.age / fragment.lifetime;
  const alpha = Math.max(0, 1 - progress);
  const sx = img.width * fragment.sxRatio;
  const sw = img.width * fragment.swRatio;
  const screenX = toScreenX(fragment.x);
  const screenY = toScreenY(fragment.y);
  const width = fragment.width * scale;
  const height = fragment.height * scale;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(screenX + width / 2, screenY + height / 2);
  ctx.rotate(fragment.rotation);
  ctx.drawImage(img, sx, 0, sw, img.height, -width / 2, -height / 2, width, height);
  ctx.restore();
}

function drawCoverImage(img, x, y, width, height) {
  const imageRatio = img.width / img.height;
  const boxRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imageRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
}

function drawBackground(meters = game.score) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const layers = getBackgroundLayers(meters);

  for (const layer of layers) {
    ctx.save();
    ctx.globalAlpha = layer.alpha;
    drawCoverImage(getSceneAsset(layer.id, 'Background'), 0, 0, width, height);
    ctx.restore();
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(255,255,255,0.06)');
  gradient.addColorStop(0.72, 'rgba(255,255,255,0)');
  gradient.addColorStop(1, 'rgba(69, 153, 108, 0.12)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function toScreenX(x) {
  return x * scale;
}

function toScreenY(y) {
  return (y - game.cameraY) * scale;
}

function drawPlatform(platform) {
  const sceneId = getPlatformSceneId(metersFromY(platform.y));
  const img = getSceneAsset(sceneId, platform.type === 'fragile' ? 'PlatformFragile' : 'Platform');

  ctx.drawImage(
    img,
    toScreenX(platform.x),
    toScreenY(platform.y - 12),
    platform.width * scale,
    config.platformDrawHeight * scale,
  );
}

function drawRocketPowerup(platform) {
  const rocketRect = getRocketRect(platform);
  if (!rocketRect) return;

  const floatOffset = Math.sin(performance.now() / 240 + platform.y * 0.03) * 3;
  const drawWidth = config.rocketWidth * scale;
  const drawHeight = config.rocketHeight * scale;

  ctx.drawImage(
    assets.rocketPowerup,
    toScreenX(rocketRect.x),
    toScreenY(rocketRect.y + floatOffset),
    drawWidth,
    drawHeight,
  );
}

function drawSpringPowerup(platform) {
  if (!platform.spring || platform.spring.used) return;

  const springX = platform.x + platform.spring.offsetX;
  const springY = platform.y + platform.spring.offsetY;
  const floatOffset = Math.sin(performance.now() / 220 + platform.y * 0.025) * 2 * scale;
  ctx.drawImage(
    assets.springPowerup,
    toScreenX(springX),
    toScreenY(springY) + floatOffset,
    config.springWidth * scale,
    config.springHeight * scale,
  );
}

function drawPlayer() {
  const player = game.player;
  const sprite =
    player.mode === 'rocket'
      ? assets.characterRocket
      : state === 'ready' || Math.abs(player.vy) < 80
      ? assets.characterIdle
      : player.vy < 0
        ? assets.characterJump
        : assets.characterFall;

  const drawWidth = config.playerWidth * scale;
  const drawHeight = config.playerHeight * scale;
  ctx.drawImage(sprite, toScreenX(player.x), toScreenY(player.y), drawWidth, drawHeight);
}

function getVisibleBasketballBossGate() {
  if (isBasketballBossCleared()) return null;
  const y = getBasketballBossGateY();
  const screenY = toScreenY(y);
  const radius = config.bossGateRadius * scale;

  if (screenY < -radius * 2 || screenY > canvas.clientHeight + radius * 2) return null;

  return {
    x: config.worldWidth / 2,
    y,
    radius: config.bossGateRadius,
  };
}

function drawBossGate(gate = game.bossGate || getVisibleBasketballBossGate()) {
  if (!gate) return;

  const screenX = toScreenX(gate.x);
  const screenY = toScreenY(gate.y);
  const pulse = Math.sin(performance.now() / 130) * 0.08 + 1;
  const radius = gate.radius * scale * pulse;
  const swirl = performance.now() / 520;

  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.rotate(swirl);

  const glow = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.55);
  glow.addColorStop(0, 'rgba(10, 7, 26, 0.98)');
  glow.addColorStop(0.42, 'rgba(32, 17, 67, 0.92)');
  glow.addColorStop(0.72, 'rgba(91, 65, 171, 0.42)');
  glow.addColorStop(1, 'rgba(91, 65, 171, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 5 * scale;
  ctx.strokeStyle = 'rgba(189, 166, 255, 0.76)';
  for (let index = 0; index < 3; index += 1) {
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * (0.95 + index * 0.18), radius * (0.48 + index * 0.08), index * 0.82, 0, Math.PI * 1.45);
    ctx.stroke();
  }

  ctx.fillStyle = '#05020d';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.52, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBossPlayer() {
  const battle = game.bossBattle;
  const player = game.player;
  if (battle?.playerInvulnerable > 0 && Math.floor(performance.now() / 90) % 2 === 0) return;

  const isShooting = (battle?.playerShootPose || 0) > 0;
  const sprite = isShooting ? assets.characterBossShoot : assets.characterBossIdle;
  const drawWidth = config.bossPlayerWidth * scale;
  const drawHeight = config.bossPlayerHeight * scale;
  const drawX = (player.x + config.bossPlayerWidth / 2) * scale - drawWidth / 2;
  const drawY = (player.y + config.bossPlayerHeight) * scale - drawHeight;

  if (battle?.playerFacing < 0) {
    ctx.save();
    ctx.translate(drawX + drawWidth / 2, drawY + drawHeight / 2);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  } else {
    ctx.drawImage(
      sprite,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
    );
  }

  if (isShooting) {
    const facing = battle?.playerFacing || 1;
    const muzzleX = (player.x + config.bossPlayerWidth / 2 + facing * config.bossPlayerWidth * 0.37) * scale;
    const muzzleY = (player.y + 47) * scale;
    const flashRadius = (9 + Math.sin(performance.now() / 30) * 2) * scale;
    const flash = ctx.createRadialGradient(muzzleX, muzzleY, 1, muzzleX, muzzleY, flashRadius);
    flash.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    flash.addColorStop(0.45, 'rgba(133, 231, 255, 0.78)');
    flash.addColorStop(1, 'rgba(133, 231, 255, 0)');
    ctx.fillStyle = flash;
    ctx.beginPath();
    ctx.arc(muzzleX, muzzleY, flashRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBossFloor() {
  const floorY = (worldHeight - 42) * scale;
  const floorHeight = config.bossFloorHeight * scale;
  const floorX = -8 * scale;
  const floorWidth = (config.worldWidth + 16) * scale;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 248, 232, 0.92)';
  ctx.strokeStyle = 'rgba(238, 142, 56, 0.82)';
  ctx.lineWidth = 3 * scale;
  roundedRectPath(floorX, floorY, floorWidth, floorHeight, 14 * scale);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(10 * scale, floorY + 8 * scale);
  ctx.lineTo((config.worldWidth - 10) * scale, floorY + 5 * scale);
  ctx.stroke();
  ctx.restore();
}

function roundedRectPath(x, y, width, height, radius) {
  const corner = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + corner, y);
  ctx.lineTo(x + width - corner, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + corner);
  ctx.lineTo(x + width, y + height - corner);
  ctx.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  ctx.lineTo(x + corner, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - corner);
  ctx.lineTo(x, y + corner);
  ctx.quadraticCurveTo(x, y, x + corner, y);
  ctx.closePath();
}

function drawPlayerBillBullet(bullet) {
  const width = config.bossPlayerBillWidth * scale;
  const height = config.bossPlayerBillHeight * scale;
  const flutter = Math.sin((bullet.age || 0) * 18) * 0.08;

  ctx.save();
  ctx.translate(bullet.x * scale, bullet.y * scale);
  ctx.rotate(-0.26 + flutter);
  ctx.fillStyle = '#ff8fc6';
  ctx.strokeStyle = '#8d315f';
  ctx.lineWidth = Math.max(1.5, 2 * scale);
  roundedRectPath(-width / 2, -height / 2, width, height, 4 * scale);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffd5e8';
  roundedRectPath(-width * 0.23, -height * 0.24, width * 0.46, height * 0.48, 3 * scale);
  ctx.fill();

  ctx.fillStyle = '#ff5ea9';
  ctx.beginPath();
  ctx.arc(0, 0, height * 0.16, 0, Math.PI * 2);
  ctx.fill();
  for (let index = 0; index < 4; index += 1) {
    const angle = -Math.PI / 2 + index * (Math.PI / 2);
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * height * 0.18, Math.sin(angle) * height * 0.16, height * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawBossBattle() {
  const battle = game.bossBattle;
  if (!battle) return;
  syncBossHud(battle);

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const boss = battle.boss;
  const bossSprite = assets[boss.state === 'attack' ? battle.config.attackAsset : battle.config.idleAsset];

  const overlay = ctx.createLinearGradient(0, 0, 0, height);
  overlay.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
  overlay.addColorStop(0.52, 'rgba(255, 255, 255, 0)');
  overlay.addColorStop(1, 'rgba(255, 248, 214, 0.16)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, width, height);

  const floatOffset = Math.sin(performance.now() / 260) * 4 * scale;
  ctx.drawImage(
    bossSprite,
    boss.x * scale,
    boss.y * scale + floatOffset,
    config.bossWidth * scale,
    config.bossHeight * scale,
  );

  for (const bullet of battle.playerBullets) {
    drawPlayerBillBullet(bullet);
  }

  for (const projectile of battle.bossProjectiles) {
    const wobble = Math.sin(projectile.age * 11) * 0.06;
    const size = projectile.size * scale * (1 + Math.min(0.18, projectile.age * 0.8));
    ctx.save();
    ctx.translate(projectile.x * scale, projectile.y * scale);
    ctx.rotate(projectile.age * 4 + wobble);
    ctx.drawImage(assets[battle.config.projectileAsset], -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  drawBossFloor();
  drawBossPlayer();
}

function drawBossBattleSuccess() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const img = assets.basketballBossSuccessBanner;
  const imageRatio = img.width / img.height;
  const maxWidth = width * 0.96;
  const maxHeight = height * 0.32;
  let drawWidth = maxWidth;
  let drawHeight = drawWidth / imageRatio;

  if (drawHeight > maxHeight) {
    drawHeight = maxHeight;
    drawWidth = drawHeight * imageRatio;
  }

  const progress = game.bossSuccess
    ? Math.min(1, game.bossSuccess.age / 0.32)
    : 1;
  const eased = 1 - Math.pow(1 - progress, 3);
  const y = height * 0.34 - drawHeight / 2 - (1 - eased) * 34 * scale;
  const pop = 0.9 + eased * 0.1;

  ctx.save();
  ctx.fillStyle = `rgba(20, 31, 52, ${0.18 * eased})`;
  ctx.fillRect(0, 0, width, height);
  ctx.translate(width / 2, y + drawHeight / 2);
  ctx.scale(pop, pop);
  ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  if (game.phase !== 'boss') {
    syncBossHud(null);
  }
  const lockedBasketballMeters = basketballBossConfig.gateMeters - 1;
  drawBackground(game.phase === 'gate' || game.phase === 'boss' || game.phase === 'success' ? lockedBasketballMeters : game.score);

  if (state === 'ready') {
    const previewY = worldHeight * 0.58;
    game.player.x = config.worldWidth / 2 - config.playerWidth / 2;
    game.player.y = previewY - config.playerHeight;
    game.cameraY = 0;
    drawPlatform(createPlatform(config.worldWidth / 2 - config.platformWidth / 2, previewY, config.platformWidth, 'normal'));
    drawPlayer();
    return;
  }

  if (game.phase === 'boss') {
    drawBossBattle();
    return;
  }

  if (game.phase === 'success') {
    drawBossBattleSuccess();
    return;
  }

  for (const platform of game.platforms) {
    drawPlatform(platform);
  }
  for (const fragment of game.breakFragments) {
    drawBreakFragment(fragment);
  }
  for (const platform of game.platforms) {
    drawSpringPowerup(platform);
    drawRocketPowerup(platform);
  }
  drawBossGate();
  drawPlayer();
}

function loop(timestamp) {
  const dt = Math.min(0.033, (timestamp - lastTime) / 1000 || 0);
  lastTime = timestamp;
  update(dt);
  draw();
  rafId = requestAnimationFrame(loop);
}

function setTouchDirection(clientX, active) {
  const rect = canvas.getBoundingClientRect();
  const isLeft = clientX - rect.left < rect.width / 2;
  input.left = active && isLeft;
  input.right = active && !isLeft;
}

function clearInput() {
  input.left = false;
  input.right = false;
}

function bindInput() {
  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') input.left = true;
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') input.right = true;
  });

  window.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') input.left = false;
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') input.right = false;
  });

  window.addEventListener(
    'pointerdown',
    (event) => {
      if (event.target.closest('button')) return;
      if (state === 'ready') return;
      setTouchDirection(event.clientX, true);
    },
    { passive: true },
  );

  window.addEventListener(
    'pointermove',
    (event) => {
      if (!input.left && !input.right) return;
      setTouchDirection(event.clientX, true);
    },
    { passive: true },
  );

  window.addEventListener('pointerup', clearInput, { passive: true });
  window.addEventListener('pointercancel', clearInput, { passive: true });

  ui.startButton.addEventListener('click', resetGame);
  ui.restartButton.addEventListener('click', resetGame);
  ui.pauseButton.addEventListener('click', () => {
    if (state !== 'playing') return;
    paused = !paused;
    ui.pauseButton.classList.toggle('is-paused', paused);
  });

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);
  window.visualViewport?.addEventListener('resize', resizeCanvas);
  window.visualViewport?.addEventListener('scroll', resizeCanvas);
}

async function boot() {
  try {
    await loadAssets();
    setViewportHeight();
    resizeCanvas();
    bindInput();
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  } catch (error) {
    console.error(error);
    ui.assetError.classList.add('is-visible');
    ui.modalBackdrop.classList.add('is-visible');
    cancelAnimationFrame(rafId);
  }
}

boot();
