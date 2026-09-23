'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x      = x;
    this.y      = y;
    this.size   = size;
    this.radius = RADII[size];
    this.points = POINTS[size];
    this.dead   = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
class EstrellaFugaz extends Asteroid {
  constructor(x, y) {
    super(x, y, 2);
    this.points = 75;
    this.dead   = false;
    this.radius = 22;
    this.ttl    = rand(3.5, 5);   // segundos antes de desintegrarse

    // Corre en línea recta, mucho más rápido que un asteroide normal
    const angle = rand(0, Math.PI * 2);
    const speed = rand(180, 240);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(0.5, 1.5);

    // Polígono más compacto acorde al radio reducido
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }

    this.trail = [];   // estela de posiciones recientes
  }

  update(dt) {
    // Sin wrap: atraviesa la pantalla y muere al salir o al agotar su tiempo
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rot += this.rotSpeed * dt;

    this.trail.push([this.x, this.y]);
    if (this.trail.length > 18) this.trail.shift();

    this.ttl -= dt;
    const offScreen = this.x < -60 || this.x > W + 60 ||
                      this.y < -60 || this.y > H + 60;
    if (this.ttl <= 0 || offScreen) {
      if (this.ttl <= 0) explode(this.x, this.y, 12);   // se desintegra en chispas
      this.dead = true;
    }
  }

  split() { return []; }

  draw() {
    if (this.ttl < 0.8 && Math.floor(this.ttl * 10) % 2 === 0) return;  // parpadeo final
    const alpha = this.ttl < 0.8 ? Math.max(this.ttl / 0.8, 0) : 1;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = 'round';

    // Estela: trazos cada vez más viejos y tenues, opuestos al movimiento
    for (let i = 0; i < this.trail.length; i++) {
      const t = (i + 1) / this.trail.length;     // más nuevo = más brillante
      const [tx, ty] = this.trail[i];
      ctx.strokeStyle = `rgba(255, 190, 60, ${(t * 0.35 * alpha).toFixed(2)})`;
      ctx.lineWidth   = 1 + t * 3;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - this.vx * 0.05, ty - this.vy * 0.05);
      ctx.stroke();
    }

    // Cuerpo del cometa con halo cálido
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.shadowColor = '#ff9d00';
    ctx.shadowBlur  = 16;
    ctx.strokeStyle = `rgba(255, 215, 130, ${alpha.toFixed(2)})`;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
}

// ── Naves (skins) ─────────────────────────────────────────────────────────────
// Formato: name = etiqueta en HUD, color = trazo, verts = polígono a escala 1×
// (nariz en +X), nose = distancia de la nariz, tail = X trasera (origen de la
// llama), flame = color y longitud aleatoria de la llama.
// Campos de jugabilidad: scale = tamaño relativo a la clásica (2 = el doble,
// también agranda la hitbox), scoreMult = multiplicador de puntos y
// launchers = pares [x, y] locales de cada cañón (una bala por cañón).
const SKINS = [
  { id:'clasica',   name:'HALCÓN',    color:'#fff', scale:1, scoreMult:1,
    verts:[[20,0],[-12,-9],[-7,0],[-12,9]],
    nose:21, tail:-8,  flame:{ color:'rgba(255,130,0,0.85)', len:[6,14] },
    launchers:[[21,0]] },
  { id:'aguila',    name:'ÁGUILA',    color:'#ffc94d', scale:1, scoreMult:1,
    verts:[[22,0],[-4,-6],[-14,-12],[-10,0],[-14,12],[-4,6]],
    nose:23, tail:-11, flame:{ color:'rgba(255,200,60,0.9)', len:[7,16] },
    launchers:[[23,0]] },
  { id:'libelula',  name:'LIBÉLULA',  color:'#0ff', scale:1, scoreMult:1,
    verts:[[24,0],[-6,-5],[-14,-4],[-10,0],[-14,4],[-6,5]],
    nose:25, tail:-14, flame:{ color:'rgba(0,255,255,0.85)', len:[5,12] },
    launchers:[[25,0]] },
  { id:'escorpion', name:'ESCORPIÓN', color:'#ff4d6d', scale:1, scoreMult:1,
    verts:[[18,0],[-2,-4],[-16,-14],[-13,-2],[-16,0],[-13,2],[-16,14],[-2,4]],
    nose:20, tail:-16, flame:{ color:'rgba(255,70,110,0.9)', len:[6,15] },
    launchers:[[20,0]] },
  { id:'tarantula', name:'TARÁNTULA', color:'#a55cff', scale:2, scoreMult:2,
    verts:[[26,0],[4,-5],[-8,-20],[-18,-13],[-22,0],[-18,13],[-8,20],[4,5]],
    nose:27, tail:-20, flame:{ color:'rgba(190,120,255,0.9)', len:[10,22] },
    launchers:[[26,-13],[26,13]] },
];

const SKIN_KEY = 'asteroids.skin';
let currentSkin    = 0;   // índice en SKINS
let skinNoticeTimer = 0;  // segundos restantes del aviso "SKIN: ..." en el HUD

// Agrandar la nave con la tecla D: una sola vez por nivel
const ENLARGE_FACTOR = 1.5;   // multiplicador de tamaño al agrandar
let scaleBoost         = 1;   // 1 = tamaño base de la skin, ENLARGE_FACTOR = agrandada
let enlargedThisLevel  = false;
let enlargeNoticeTimer = 0;   // segundos restantes del aviso "TAMAÑO ×..." en el HUD

// Tamaño efectivo de la skin activa (base × agrandamiento del nivel)
function effectiveScale() {
  return SKINS[currentSkin].scale * scaleBoost;
}

function resetEnlarge() {
  scaleBoost        = 1;
  enlargedThisLevel = false;
}

function enlargeShip() {
  if (enlargedThisLevel) return;
  enlargedThisLevel  = true;
  scaleBoost         = ENLARGE_FACTOR;
  enlargeNoticeTimer = 1.6;
  if (ship) ship.radius = effectiveScale() * 12;
}

function loadSkin() {
  try {
    const i = parseInt(localStorage.getItem(SKIN_KEY), 10);
    if (Number.isInteger(i) && i >= 0 && i < SKINS.length) currentSkin = i;
  } catch (_) { /* localStorage no disponible (file://): skin por defecto */ }
}

function saveSkin() {
  try { localStorage.setItem(SKIN_KEY, String(currentSkin)); } catch (_) {}
}

function cycleSkin() {
  currentSkin = (currentSkin + 1) % SKINS.length;
  saveSkin();
  skinNoticeTimer = 1.6;
  // La hitbox cambia con el tamaño (base de la skin × agrandamiento del nivel)
  if (ship) ship.radius = effectiveScale() * 12;
}

// Tuning del escudo (power-up "escudo")
const SHIELD_DURATION = 6;    // segundos que dura el escudo
const SHIELD_CHARGES  = 2;    // impactos que absorbe antes de apagarse
const SHIELD_COLOR    = '#0f8';  // verde: glifo, anillo, partículas y HUD

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = effectiveScale() * 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedTimer    = 0;   // power-up "Velocidad": segundos restantes
    this.tripleTimer   = 0;   // power-up "Triple shot": segundos restantes
    this.shieldTimer   = 0;   // power-up "Escudo": segundos restantes
    this.shieldCharges = 0;   // power-up "Escudo": impactos restantes
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    -= dt;
    if (this.tripleTimer   > 0) this.tripleTimer   -= dt;
    if (this.shieldTimer   > 0) this.shieldTimer   -= dt;

    const ROT   = 3.5;   // rad/s
    const DRAG   = 0.987;
    const THRUST = this.speedTimer > 0 ? 520 : 260;  // px/s² (x2 con "Velocidad")

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const skin = SKINS[currentSkin];
    const scale = effectiveScale();
    const shots = [];

    // Cada cañón definido en la skin dispara una bala hacia delante
    for (const [lx, ly] of skin.launchers) {
      const ox = this.x + Math.cos(this.angle) * lx * scale
                     - Math.sin(this.angle) * ly * scale;
      const oy = this.y + Math.sin(this.angle) * lx * scale
                     + Math.cos(this.angle) * ly * scale;

      // Power-up "Triple shot": abanico de 3 balas (±10°) por cañón
      if (this.tripleTimer > 0) {
        const SPREAD = Math.PI / 18;   // 10° en radianes
        shots.push(new Bullet(ox, oy, this.angle - SPREAD));
        shots.push(new Bullet(ox, oy, this.angle));
        shots.push(new Bullet(ox, oy, this.angle + SPREAD));
      } else {
        shots.push(new Bullet(ox, oy, this.angle));
      }
    }

    return shots;
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[currentSkin];

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(effectiveScale(), effectiveScale());
    ctx.strokeStyle = skin.color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta de la skin activa
    ctx.beginPath();
    ctx.moveTo(skin.verts[0][0], skin.verts[0][1]);
    for (let i = 1; i < skin.verts.length; i++)
      ctx.lineTo(skin.verts[i][0], skin.verts[i][1]);
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      const [minLen, maxLen] = skin.flame.len;
      ctx.beginPath();
      ctx.moveTo(skin.tail, -4);
      ctx.lineTo(skin.tail - rand(minLen, maxLen), 0);
      ctx.lineTo(skin.tail,  4);
      ctx.strokeStyle = skin.flame.color;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── PowerUp ───────────────────────────────────────────────────────────────────
class PowerUp {
  constructor(x, y, type = 'velocidad') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 14;
    this.ttl = 10;          // segundos antes de desaparecer
    this.dead = false;

    // Deriva lenta en dirección aleatoria
    const angle = rand(0, Math.PI * 2);
    const speed = rand(10, 25);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo en los últimos 2 segundos
    if (this.ttl < 2 && Math.floor(this.ttl * 6) % 2 === 0) return;

    // color por tipo: cian = velocidad, magenta = triple shot, verde = escudo
    const color = this.type === 'escudo' ? SHIELD_COLOR
                : this.type === 'triple' ? '#f0f'
                : '#0ff';

    ctx.save();
    ctx.translate(this.x, this.y);

    // Círculo exterior del color del tipo
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    if (this.type === 'escudo') {
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = color;
    if (this.type === 'escudo') {
      // Glifo de escudo
      ctx.beginPath();
      ctx.moveTo(-6, -7);
      ctx.lineTo( 6, -7);
      ctx.lineTo( 6,  0);
      ctx.quadraticCurveTo(6, 6, 0, 9);
      ctx.quadraticCurveTo(-6, 6, -6, 0);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'triple') {
      // Glifo: 3 balas en abanico
      const SPREAD = Math.PI / 18;
      for (let i = -1; i <= 1; i++) {
        const a = i * SPREAD;
        const bx = Math.sin(a) * 9;
        const by = -Math.cos(a) * 9;
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Glifo de rayo
      ctx.beginPath();
      ctx.moveTo( 2, -8);
      ctx.lineTo(-4,  1);
      ctx.lineTo( 0,  1);
      ctx.lineTo(-2,  8);
      ctx.lineTo( 5, -2);
      ctx.lineTo( 1, -2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color = '#fff') {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
    this.color = color;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = Math.max(alpha, 0);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }

  // Dos estrellas fugaces garantizadas por oleada
  for (let i = 0; i < 2; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new EstrellaFugaz(x, y));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  resetEnlarge();
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUps  = [];
  resetEnlarge();
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8, color = '#fff') {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Cambiar de skin con S, agrandar con D (una vez por nivel)
  if (pressed('KeyS')) cycleSkin();
  if (pressed('KeyD')) enlargeShip();
  if (skinNoticeTimer > 0) skinNoticeTimer -= dt;
  if (enlargeNoticeTimer > 0) enlargeNoticeTimer -= dt;

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerUps.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerUps  = powerUps.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points * SKINS[currentSkin].scoreMult;
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        // ~15% de probabilidad de soltar un power-up (la estrella fugaz no suelta)
        if (!(a instanceof EstrellaFugaz) && Math.random() < 0.15) {
          // Distribución: 40% escudo, 30% triple shot, 30% velocidad
          const r = Math.random();
          const type = r < 0.4 ? 'escudo' : r < 0.7 ? 'triple' : 'velocidad';
          powerUps.push(new PowerUp(a.x, a.y, type));
        }
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);
  newAsteroids.length = 0;   // queda listo para los fragmentos del escudo

  // Nave vs asteroide (el escudo absorbe los impactos)
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shieldTimer > 0) {
          // El escudo destruye el objeto en vez de matar a la nave
          a.dead = true;
          score += a.points * SKINS[currentSkin].scoreMult;
          explode(a.x, a.y, a.size * 5, SHIELD_COLOR);
          newAsteroids.push(...a.split());
          ship.shieldCharges--;
          if (ship.shieldCharges <= 0) ship.shieldTimer = 0;
        } else {
          killShip();
          break;
        }
      }
    }
    asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  }

  // Nave vs power-up
  if (!ship.dead) {
    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        if (p.type === 'escudo') {
          // Reinicia tiempo y cargas si ya estaba activo
          ship.shieldTimer   = SHIELD_DURATION;
          ship.shieldCharges = SHIELD_CHARGES;
        } else if (p.type === 'triple') {
          ship.tripleTimer = 5;   // reinicia el contador si ya estaba activo
        } else {
          ship.speedTimer = 5;   // reinicia el contador si ya estaba activo
        }
        const pickupColor = p.type === 'escudo' ? SHIELD_COLOR
                          : p.type === 'triple' ? '#f0f' : '#fff';
        explode(p.x, p.y, 6, pickupColor);
      }
    }
    powerUps = powerUps.filter(p => !p.dead);
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS[currentSkin];
  const S = 0.45;   // escala: nariz 20 → 9, como el icono original

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.color;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(skin.verts[0][0] * S, skin.verts[0][1] * S);
  for (let i = 1; i < skin.verts.length; i++)
    ctx.lineTo(skin.verts[i][0] * S, skin.verts[i][1] * S);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawShield() {
  if (ship.dead || ship.shieldTimer <= 0) return;
  // Parpadeo cuando queda poco tiempo
  if (ship.shieldTimer < 1 && Math.floor(ship.shieldTimer * 8) % 2 === 0) return;

  ctx.save();
  ctx.translate(ship.x, ship.y);

  const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 160);

  // Halo exterior tenue
  ctx.strokeStyle = SHIELD_COLOR;
  ctx.globalAlpha = 0.3 * pulse;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, ship.radius + 11, 0, Math.PI * 2);
  ctx.stroke();

  // Anillo principal con segmentos que rotan
  ctx.globalAlpha = 0.9 * pulse;
  ctx.lineWidth   = 2;
  ctx.setLineDash([7, 5]);
  ctx.lineDashOffset = -performance.now() / 30;
  ctx.beginPath();
  ctx.arc(0, 0, ship.radius + 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Indicadores de power-ups activos (velocidad, triple y escudo, apilados)
  let hudY = 46;
  if (ship.speedTimer > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0ff';
    ctx.fillText(`VELOCIDAD ${ship.speedTimer.toFixed(1)}s`, 14, hudY);
    hudY += 20;
  }
  if (ship.tripleTimer > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f0f';
    ctx.fillText(`TRIPLE ${ship.tripleTimer.toFixed(1)}s`, 14, hudY);
    hudY += 20;
  }
  if (ship.shieldTimer > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = SHIELD_COLOR;
    ctx.fillText(`ESCUDO ${ship.shieldTimer.toFixed(1)}s ×${ship.shieldCharges}`, 14, hudY);
  }

  // Aviso temporal al cambiar de skin (se desvanece con el tiempo restante)
  if (skinNoticeTimer > 0) {
    const skin = SKINS[currentSkin];
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.min(skinNoticeTimer / 0.6, 1);
    ctx.fillStyle = skin.color;
    ctx.fillText(`SKIN: ${skin.name}`, W / 2, 46);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
  }

  // Aviso temporal al agrandar la nave (una vez por nivel)
  if (enlargeNoticeTimer > 0) {
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.min(enlargeNoticeTimer / 0.6, 1);
    ctx.fillStyle = '#fff';
    ctx.fillText(`NAVE AGRANDADA ×${ENLARGE_FACTOR}`, W / 2, enlargeNoticeTimer > 0 && skinNoticeTimer > 0 ? 66 : 46);
    ctx.globalAlpha = 1;
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  powerUps.forEach(p => p.draw());
  drawShield();
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

loadSkin();
initGame();
requestAnimationFrame(loop);
