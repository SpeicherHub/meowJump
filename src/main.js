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
  startButton: document.querySelector('#startButton'),
  restartButton: document.querySelector('#restartButton'),
  pauseButton: document.querySelector('#pauseButton'),
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
const backgroundFadeDurationMs = 1000;

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
  rocketBoostMeters: 10,
  rocketBoostSpeed: 1200,
  rocketExitVelocity: -520,
  rocketWidth: 42,
  rocketHeight: 58,
  rocketHitboxInsetX: 9,
  rocketHitboxInsetY: 8,
  springStartMeters: 8,
  springHighChanceMeters: 50,
  springLowChance: 0.05,
  springHighChance: 0.1,
  springJumpMultiplier: 2,
  springWidth: 42,
  springHeight: 28,
  startPlatformYRatio: 0.78,
  cameraLiftRatio: 0.42,
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

function findSceneIndex(meters) {
  const index = sceneTimeline.findIndex((scene) => meters >= scene.start && meters < scene.end);
  return index === -1 ? sceneTimeline.length - 1 : index;
}

function getBackgroundSceneId(meters) {
  for (let index = 1; index < sceneTimeline.length; index += 1) {
    const scene = sceneTimeline[index];
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
  for (let index = 1; index < sceneTimeline.length; index += 1) {
    const scene = sceneTimeline[index];
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

function choosePlatformType(y) {
  const meters = metersFromY(y);
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
  if (bucket === null || platform.type !== 'normal' || game.rocketBuckets.has(bucket)) return null;

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
  if (meters < config.springStartMeters || platform.type !== 'normal' || platform.rocket) return null;

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
  platform.rocket = createRocketForPlatform(platform);
  platform.spring = createSpringForPlatform(platform);
  return platform;
}

function createPlatformRow(y, margin = 16) {
  if (Math.random() >= config.doublePlatformChance) {
    return [createPlatform(randomBetween(margin, config.worldWidth - config.platformWidth - margin), y)];
  }

  const maxLeftX = config.worldWidth - margin - config.platformWidth * 2 - config.doublePlatformMinGap;
  if (maxLeftX <= margin) {
    return [createPlatform(randomBetween(margin, config.worldWidth - config.platformWidth - margin), y)];
  }

  const leftX = randomBetween(margin, maxLeftX);
  const rightX = randomBetween(
    leftX + config.platformWidth + config.doublePlatformMinGap,
    config.worldWidth - config.platformWidth - margin,
  );
  const platforms = [createPlatform(leftX, y), createPlatform(rightX, y)];
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
  game.player.x = config.worldWidth / 2 - config.playerWidth / 2;
  game.player.y = worldHeight * config.startPlatformYRatio - config.playerHeight;
  game.player.vx = 0;
  game.player.vy = config.jumpVelocity;
  game.player.mode = 'normal';
  game.player.rocketTargetY = null;
  game.rocketBuckets = new Set();
  game.breakFragments = [];
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
}

function updateScore(score) {
  game.score = Math.max(0, Math.floor(score));
  ui.score.textContent = formatMeters(game.score);
}

function endGame() {
  state = 'gameOver';
  bestScore = Math.max(bestScore, game.score);
  localStorage.setItem('meow-jump-best', bestScore.toString());
  ui.best.textContent = formatMeters(bestScore);
  ui.finalScore.textContent = formatMeters(game.score);
  const result = getSceneResult(game.score);
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

function updateCameraAndScore() {
  const cameraTrigger = game.cameraY + worldHeight * config.cameraLiftRatio;
  if (game.player.y < cameraTrigger) {
    game.cameraY = game.player.y - worldHeight * config.cameraLiftRatio;
  }

  game.highestY = Math.min(game.highestY, game.cameraY);
  updateScore(metersFromY(game.highestY));
}

function update(dt) {
  if (state !== 'playing' || paused) return;

  const player = game.player;
  const previousBottom = player.y + config.playerHeight;

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

function drawBackground() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const layers = getBackgroundLayers(game.score);

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

function draw() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  drawBackground();

  if (state === 'ready') {
    const previewY = worldHeight * 0.58;
    game.player.x = config.worldWidth / 2 - config.playerWidth / 2;
    game.player.y = previewY - config.playerHeight;
    game.cameraY = 0;
    drawPlatform(createPlatform(config.worldWidth / 2 - config.platformWidth / 2, previewY));
    drawPlayer();
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
