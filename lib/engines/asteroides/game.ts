// Motor de ASTEROIDES: port de references/02-asteroids/game.js. Update, draw, HUD y overlay
// son los del prototipo; lo nuevo es lo que exige la integración con React: el estado vive en
// este cierre (sin globales), notificaciones a React, pausa, bloqueo del teclado y limpieza.
import type { CreateEngine, GameStats } from "../types";
import {
  Asteroid,
  Bullet,
  H,
  POINTS,
  POWERUP_DURATION,
  Particle,
  PowerUp,
  Ship,
  W,
  dist,
  rand,
} from "./entities";
const POWERUP_DROP_CHANCE = 0.15;
// Teclas que el juego usa y que no deben hacer scroll en la página.
const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"]);
type State = "playing" | "dead" | "gameover";
export const createAsteroidesGame: CreateEngine = (canvas, callbacks) => {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("ASTEROIDES: el navegador no soporta canvas 2D.");
  const ctx = context;
  // ── Input ───────────────────────────────────────────────────────────────────
  const keys: Record<string, boolean> = {};
  const justPressed: Record<string, boolean> = {};
  let inputEnabled = true;
  let paused = false;
  const acceptsInput = () => inputEnabled && !paused;
  const clearInput = () => {
    for (const code of Object.keys(keys)) keys[code] = false;
    for (const code of Object.keys(justPressed)) justPressed[code] = false;
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (!acceptsInput()) return;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (!keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys[e.code] = false;
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  function pressed(code: string) {
    const val = justPressed[code];
    justPressed[code] = false;
    return val;
  }
  // ── Estado del juego ────────────────────────────────────────────────────────
  let ship = new Ship();
  let bullets: Bullet[] = [];
  let asteroids: Asteroid[] = [];
  let particles: Particle[] = [];
  let powerUps: PowerUp[] = [];
  let score = 0;
  let lives = 3;
  let level = 1;
  let state: State = "playing";
  let deadTimer = 0;
  let powerUpSpawned = false;
  let killsSinceSpawn = 0;
  // Notificaciones a React: solo cuando cambia algún valor respecto al último enviado.
  let lastStats: GameStats | null = null;
  let gameOverPending = false;
  const stats = (): GameStats => ({ score, lives, level });
  function notify() {
    if (
      !lastStats ||
      lastStats.score !== score ||
      lastStats.lives !== lives ||
      lastStats.level !== level
    ) {
      lastStats = stats();
      callbacks.onStats(lastStats);
    }
    if (gameOverPending) {
      gameOverPending = false;
      callbacks.onGameOver(stats());
    }
  }
  function spawnAsteroids(count: number) {
    const SAFE_DIST = 130;
    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
      asteroids.push(new Asteroid(x, y, 3));
    }
  }
  function initGame() {
    ship = new Ship();
    bullets = [];
    asteroids = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    score = 0;
    lives = 3;
    level = 1;
    state = "playing";
    gameOverPending = false;
    // Fuerza a notificar el estado inicial en el siguiente frame, también en cada reinicio.
    lastStats = null;
    spawnAsteroids(4);
  }
  function nextLevel() {
    level++;
    bullets = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    ship.reset();
    spawnAsteroids(3 + level);
  }
  function explode(x: number, y: number, count = 8) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
  }
  function killShip() {
    explode(ship.x, ship.y, 14);
    ship.dead = true;
    lives--;
    if (lives <= 0) {
      state = "gameover";
      gameOverPending = true;
    } else {
      state = "dead";
      deadTimer = 2;
    }
  }
  // ── Update ──────────────────────────────────────────────────────────────────
  function update(dt: number) {
    if (state === "gameover") {
      if (pressed("Space")) initGame();
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      return;
    }
    if (state === "dead") {
      deadTimer -= dt;
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      asteroids.forEach((a) => a.update(dt));
      if (deadTimer <= 0) {
        state = "playing";
        ship.reset();
      }
      return;
    }
    // Disparar
    if (pressed("Space")) {
      bullets.push(...ship.tryShoot());
    }
    ship.update(dt, keys);
    bullets.forEach((b) => b.update(dt));
    asteroids.forEach((a) => a.update(dt));
    particles.forEach((p) => p.update(dt));
    powerUps.forEach((p) => p.update(dt));
    bullets = bullets.filter((b) => !b.dead);
    particles = particles.filter((p) => !p.dead);
    powerUps = powerUps.filter((p) => !p.dead);
    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.tripleShot = POWERUP_DURATION;
      }
    }
    // Bala vs asteroide
    const newAsteroids: Asteroid[] = [];
    for (const b of bullets) {
      for (const a of asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          score += POINTS[a.size];
          explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          if (!powerUpSpawned) {
            killsSinceSpawn++;
            const guaranteed = killsSinceSpawn >= 5;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              powerUps.push(new PowerUp(a.x, a.y));
              powerUpSpawned = true;
            }
          }
        }
      }
    }
    asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
    bullets = bullets.filter((b) => !b.dead);
    // Nave vs asteroide
    if (ship.invincible <= 0) {
      for (const a of asteroids) {
        if (dist(ship, a) < ship.radius + a.radius * 0.82) {
          killShip();
          break;
        }
      }
    }
    // Nivel completado
    if (asteroids.length === 0) nextLevel();
  }
  // ── Draw ────────────────────────────────────────────────────────────────────
  function drawLifeIcon(x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  function drawHUD() {
    ctx.fillStyle = "#fff";
    ctx.font = "15px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE  ${score}`, 14, 26);
    ctx.textAlign = "center";
    ctx.fillText(`NIVEL ${level}`, W / 2, 26);
    for (let i = 0; i < lives; i++) drawLifeIcon(W - 16 - i * 22, 18);
    if (ship.tripleShot > 0) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#0ff";
      ctx.fillText(`3x  ${ship.tripleShot.toFixed(1)}s`, 14, 46);
    }
  }
  function drawOverlay(title: string, sub: string) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 46px monospace";
    ctx.fillText(title, W / 2, H / 2 - 18);
    ctx.font = "18px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText(sub, W / 2, H / 2 + 22);
  }
  function draw() {
    // El buffer puede ser mayor que 800×600 (devicePixelRatio): se dibuja en coordenadas lógicas.
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    particles.forEach((p) => p.draw(ctx));
    asteroids.forEach((a) => a.draw(ctx));
    powerUps.forEach((p) => p.draw(ctx));
    bullets.forEach((b) => b.draw(ctx));
    ship.draw(ctx);
    drawHUD();
    if (state === "gameover")
      drawOverlay("GAME OVER", `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
  }
  // ── Loop principal ──────────────────────────────────────────────────────────
  let lastTime: number | null = null;
  let frame: number | null = null;
  let destroyed = false;
  function loop(ts: number) {
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    update(dt);
    draw();
    notify();
    frame = requestAnimationFrame(loop);
  }
  function start() {
    if (destroyed || paused || frame !== null) return;
    // Sin marca previa el primer frame usa dt = 0: el tiempo en pausa no se acumula.
    lastTime = null;
    frame = requestAnimationFrame(loop);
  }
  function stop() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  }
  initGame();
  start();
  return {
    pause() {
      paused = true;
      clearInput();
      stop();
    },
    resume() {
      paused = false;
      start();
    },
    restart() {
      clearInput();
      initGame();
      // Dibuja y notifica ya, aunque el bucle esté en pausa.
      draw();
      notify();
    },
    end() {
      if (state !== "gameover") {
        if (!ship.dead) explode(ship.x, ship.y, 14);
        ship.dead = true;
        state = "gameover";
      }
      gameOverPending = true;
      draw();
      notify();
    },
    setInputEnabled(enabled) {
      inputEnabled = enabled;
      if (!enabled) clearInput();
    },
    destroy() {
      destroyed = true;
      stop();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
  };
};
