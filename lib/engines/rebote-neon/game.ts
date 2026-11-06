// Motor de REBOTE NEÓN: rompebloques portado de references/04-arkanoid/game.js. Respecto al
// prototipo cambian el ángulo de rebote en la paleta, el saque manual, el rebote en bloques según
// la cara, el ciclo infinito de niveles con tope de velocidad, los subpasos y el voltaje. El estado
// vive en este cierre (sin globales); la pausa, el HUD y el guardado son de la plataforma.
import { DEFAULT_SKIN } from "../skins";
import type { CreateEngine, GameStats } from "../types";
import {
  BALL_SIZE,
  BASE_BALL_SPEED,
  BASE_BALL_VX,
  BASE_BALL_VY,
  BLOCKS_ORIGIN_X,
  BLOCKS_ORIGIN_Y,
  BLOCK_H,
  BLOCK_W,
  EXPLOSION_DURATION,
  EXPLOSION_STEPS,
  H,
  MAX_BOUNCE_ANGLE,
  MAX_SCORE,
  MAX_SUBSTEP,
  MAX_VOLTAGE,
  PADDLE_H,
  PADDLE_SPEED,
  PADDLE_W,
  PADDLE_Y,
  POINTS_PER_BLOCK,
  START_LIVES,
  W,
  levelPattern,
  levelSpeedMultiplier,
  type BlockColor,
} from "./levels";
import { SKINS, type BlockPattern } from "./skins";
// Teclas que el juego usa y que no deben hacer scroll en la página. P y Escape son de la plataforma.
const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "Space"]);
const PADDLE_END_W = 10; // ancho de cada extremo coloreado de la paleta
type State = "serve" | "playing" | "gameover";
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Block extends Rect {
  color: BlockColor;
  alive: boolean;
}
interface Explosion extends Rect {
  color: BlockColor;
  elapsed: number; // ms
}
// Resultado de un subpaso: si la pelota se perdió o el nivel se vació, el frame no sigue moviéndola.
type StepResult = "continue" | "lost" | "cleared";
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export const createReboteNeonGame: CreateEngine = (canvas, callbacks) => {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("REBOTE NEÓN: el navegador no soporta canvas 2D.");
  const ctx = context;
  // ── Audio ───────────────────────────────────────────────────────────────────
  // Se crea aquí y no a nivel de módulo: el registro de motores también se evalúa en el servidor.
  const bounceSound = new Audio("/games/rebote-neon/ball-bounce.mp3");
  const breakSound = new Audio("/games/rebote-neon/break-sound.mp3");
  const activeClips = new Set<HTMLAudioElement>();
  function play(sound: HTMLAudioElement) {
    const clip = sound.cloneNode() as HTMLAudioElement;
    activeClips.add(clip);
    clip.addEventListener("ended", () => activeClips.delete(clip), { once: true });
    // Si el navegador bloquea la reproducción, el juego sigue en silencio.
    clip.play().catch(() => activeClips.delete(clip));
  }
  // ── Estado del juego ────────────────────────────────────────────────────────
  const paddle: Rect = { x: (W - PADDLE_W) / 2, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H };
  const ball = { x: 0, y: 0, w: BALL_SIZE, h: BALL_SIZE, vx: 0, vy: 0 };
  let blocks: Block[] = [];
  let explosions: Explosion[] = [];
  let score = 0;
  let lives = START_LIVES;
  let level = 1;
  // Bloques rotos desde el último toque de la paleta, con tope MAX_VOLTAGE. Se muestra como ×1
  // mientras vale 0: el primer bloque de la racha vale ×1, el segundo ×2…
  let voltage = 0;
  let state: State = "serve";
  // ── Input ───────────────────────────────────────────────────────────────────
  const keys = { ArrowLeft: false, ArrowRight: false };
  let inputEnabled = true;
  let paused = false;
  const acceptsInput = () => inputEnabled && !paused && state !== "gameover";
  const clearInput = () => {
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (!acceptsInput()) return;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (e.code === "ArrowLeft" || e.code === "ArrowRight") keys[e.code] = true;
    if (e.code === "Space" && !e.repeat) launch();
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === "ArrowLeft" || e.code === "ArrowRight") keys[e.code] = false;
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!acceptsInput()) return;
    // Escala con la resolución lógica: canvas.width incluye devicePixelRatio.
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const x = (e.clientX - rect.left) * (W / rect.width);
    paddle.x = clamp(x - paddle.w / 2, 0, W - paddle.w);
    if (state === "serve") stickBallToPaddle();
  };
  const onClick = () => {
    if (!acceptsInput()) return;
    launch();
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("click", onClick);
  // ── Notificaciones a React ──────────────────────────────────────────────────
  // Solo cuando cambia algún valor respecto al último enviado.
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
  // ── Partida ─────────────────────────────────────────────────────────────────
  const ballSpeed = () => BASE_BALL_SPEED * levelSpeedMultiplier(level);
  function stickBallToPaddle() {
    ball.x = paddle.x + (paddle.w - ball.w) / 2;
    ball.y = paddle.y - ball.h;
    ball.vx = 0;
    ball.vy = 0;
  }
  function serve() {
    state = "serve";
    voltage = 0;
    stickBallToPaddle();
  }
  function loadLevel(n: number) {
    level = n;
    blocks = levelPattern(n).map((b) => ({
      x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
      y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
      w: BLOCK_W,
      h: BLOCK_H,
      color: b.color,
      alive: true,
    }));
    explosions = [];
    serve();
  }
  function initGame() {
    score = 0;
    lives = START_LIVES;
    gameOverPending = false;
    paddle.x = (W - paddle.w) / 2;
    clearInput();
    loadLevel(1);
    // Fuerza a notificar el estado inicial en el siguiente frame, también en cada reinicio.
    lastStats = null;
  }
  function launch() {
    if (state !== "serve") return;
    const speed = ballSpeed();
    ball.vx = (BASE_BALL_VX / BASE_BALL_SPEED) * speed;
    ball.vy = (BASE_BALL_VY / BASE_BALL_SPEED) * speed;
    state = "playing";
    notify();
  }
  function addScore(points: number) {
    score = Math.min(score + points, MAX_SCORE);
  }
  function loseBall() {
    lives--;
    if (lives <= 0) {
      lives = 0;
      state = "gameover";
      voltage = 0;
      gameOverPending = true;
    } else {
      serve();
    }
  }
  // ── Física ──────────────────────────────────────────────────────────────────
  // Rebote según el punto de impacto: centro → vertical, extremos → hasta 60°.
  function bounceOffPaddle() {
    const ballCenter = ball.x + ball.w / 2;
    const paddleCenter = paddle.x + paddle.w / 2;
    const t = clamp((ballCenter - paddleCenter) / (paddle.w / 2), -1, 1);
    const angle = t * MAX_BOUNCE_ANGLE;
    const speed = ballSpeed();
    ball.vx = speed * Math.sin(angle);
    ball.vy = -speed * Math.cos(angle);
    ball.y = paddle.y - ball.h;
    voltage = 0;
    play(bounceSound);
  }
  // Invierte el eje de menor solapamiento y saca la pelota del bloque por esa cara.
  function bounceOffBlock(block: Block) {
    const overlapX = Math.min(ball.x + ball.w, block.x + block.w) - Math.max(ball.x, block.x);
    const overlapY = Math.min(ball.y + ball.h, block.y + block.h) - Math.max(ball.y, block.y);
    const ballFromLeft = ball.x + ball.w / 2 < block.x + block.w / 2;
    const ballFromTop = ball.y + ball.h / 2 < block.y + block.h / 2;
    if (overlapX < overlapY) {
      ball.vx = ballFromLeft ? -Math.abs(ball.vx) : Math.abs(ball.vx);
      ball.x = ballFromLeft ? block.x - ball.w : block.x + block.w;
    } else {
      ball.vy = ballFromTop ? -Math.abs(ball.vy) : Math.abs(ball.vy);
      ball.y = ballFromTop ? block.y - ball.h : block.y + block.h;
    }
  }
  function breakBlock(block: Block) {
    block.alive = false;
    explosions.push({
      x: block.x,
      y: block.y,
      w: block.w,
      h: block.h,
      color: block.color,
      elapsed: 0,
    });
    voltage = Math.min(voltage + 1, MAX_VOLTAGE);
    addScore(POINTS_PER_BLOCK * level * voltage);
    play(breakSound);
  }
  function step(dx: number, dy: number, canBreak: boolean): StepResult | "broke" {
    ball.x += dx;
    ball.y += dy;
    // Paredes izquierda, derecha y techo.
    if (ball.x <= 0) {
      ball.x = 0;
      ball.vx = Math.abs(ball.vx);
      play(bounceSound);
    } else if (ball.x + ball.w >= W) {
      ball.x = W - ball.w;
      ball.vx = -Math.abs(ball.vx);
      play(bounceSound);
    }
    if (ball.y <= 0) {
      ball.y = 0;
      ball.vy = Math.abs(ball.vy);
      play(bounceSound);
    }
    // Paleta: solo de bajada y con la base de la pelota aún cerca de la cara superior (como el
    // prototipo), para que una paleta que entra de lado no recoja una pelota ya perdida.
    if (
      ball.vy > 0 &&
      overlaps(ball, paddle) &&
      ball.y + ball.h <= paddle.y + paddle.h + MAX_SUBSTEP
    )
      bounceOffPaddle();
    // Bloques: como máximo uno por frame.
    if (canBreak) {
      const hit = blocks.find((b) => b.alive && overlaps(ball, b));
      if (hit) {
        bounceOffBlock(hit);
        breakBlock(hit);
        if (blocks.every((b) => !b.alive)) {
          loadLevel(level + 1);
          return "cleared";
        }
        return "broke";
      }
    }
    if (ball.y > H) {
      loseBall();
      return "lost";
    }
    return "continue";
  }
  function moveBall(dt: number) {
    // Subpasos de ≤ MAX_SUBSTEP px: a ×2,0 la pelota no atraviesa bloques ni la paleta.
    const distance = Math.hypot(ball.vx, ball.vy) * dt;
    const steps = Math.max(1, Math.ceil(distance / MAX_SUBSTEP));
    let canBreak = true;
    for (let i = 0; i < steps; i++) {
      // La velocidad puede cambiar en cada rebote: el avance se recalcula en cada subpaso.
      const result = step((ball.vx * dt) / steps, (ball.vy * dt) / steps, canBreak);
      if (result === "lost" || result === "cleared") return;
      if (result === "broke") canBreak = false;
    }
  }
  // ── Update ──────────────────────────────────────────────────────────────────
  function update(dt: number) {
    for (const exp of explosions) exp.elapsed += dt * 1000;
    explosions = explosions.filter((exp) => exp.elapsed < EXPLOSION_DURATION);
    if (state === "gameover") return;
    if (keys.ArrowLeft) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
    if (keys.ArrowRight) paddle.x = Math.min(W - paddle.w, paddle.x + PADDLE_SPEED * dt);
    if (state === "serve") stickBallToPaddle();
    else moveBall(dt);
  }
  // ── Draw ────────────────────────────────────────────────────────────────────
  // Paleta de la skin activa: cambiarla solo afecta al dibujo, nunca al estado de la partida.
  let palette = SKINS[DEFAULT_SKIN];
  function withGlow(color: string, draw: () => void) {
    if (palette.glow > 0) {
      ctx.shadowColor = color;
      ctx.shadowBlur = palette.glow;
    }
    draw();
    ctx.shadowBlur = 0;
  }
  function drawPattern(pattern: BlockPattern, x: number, y: number, w: number, h: number) {
    if (pattern === "solid") return;
    ctx.fillStyle = palette.blockBorder;
    if (pattern === "dot") {
      ctx.fillRect(x + w / 2 - 3, y + h / 2 - 3, 6, 6);
    } else if (pattern === "stripes") {
      for (let sx = x + 8; sx < x + w - 4; sx += 12) ctx.fillRect(sx, y + 6, 3, h - 10);
    } else {
      for (let cy = 0; cy < 2; cy++)
        for (let cx = 0; cx < 8; cx++)
          if ((cx + cy) % 2 === 0) ctx.fillRect(x + 4 + cx * 7, y + 6 + cy * 6, 6, 6);
    }
  }
  function drawBlock(block: Block) {
    const color = palette.blocks[block.color];
    const x = block.x + 1;
    const y = block.y + 1;
    const w = block.w - 2;
    const h = block.h - 2;
    ctx.globalAlpha = palette.blockFillAlpha;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.blockHighlight;
    ctx.fillRect(x + 2, y + 2, w - 4, 3);
    drawPattern(palette.blockPatterns[block.color], x, y, w, h);
    const line = palette.lineScale;
    if (palette.glow > 0) {
      // Tubo de neón: contorno en el color del bloque con resplandor.
      ctx.strokeStyle = color;
      ctx.lineWidth = line;
      withGlow(color, () => ctx.strokeRect(x + line / 2, y + line / 2, w - line, h - line));
    } else {
      ctx.strokeStyle = palette.blockBorder;
      ctx.lineWidth = line;
      ctx.strokeRect(x + line / 2, y + line / 2, w - line, h - line);
    }
  }
  function drawExplosion(exp: Explosion) {
    const k = Math.min(Math.floor((exp.elapsed / EXPLOSION_DURATION) * EXPLOSION_STEPS), 3);
    const scale = 1 + 0.15 * k;
    const w = exp.w * scale;
    const h = exp.h * scale;
    const color = palette.blocks[exp.color];
    ctx.globalAlpha = 1 - k / EXPLOSION_STEPS;
    ctx.fillStyle = color;
    withGlow(color, () => ctx.fillRect(exp.x + (exp.w - w) / 2, exp.y + (exp.h - h) / 2, w, h));
    ctx.globalAlpha = 1;
  }
  function drawPaddle() {
    const { x, y, w, h } = paddle;
    ctx.fillStyle = palette.paddle;
    withGlow(palette.paddle, () => ctx.fillRect(x, y, w, h));
    ctx.fillStyle = palette.paddleEnds;
    withGlow(palette.paddleEnds, () => {
      ctx.fillRect(x, y, PADDLE_END_W, h);
      ctx.fillRect(x + w - PADDLE_END_W, y, PADDLE_END_W, h);
    });
  }
  function drawBall() {
    ctx.fillStyle = palette.ball;
    withGlow(palette.ball, () => {
      ctx.beginPath();
      ctx.arc(ball.x + ball.w / 2, ball.y + ball.h / 2, ball.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  function drawVoltage() {
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = palette.textAccent;
    withGlow(palette.textAccent, () => ctx.fillText(`VOLTAJE ×${Math.max(1, voltage)}`, 14, 14));
  }
  function drawServeNotice() {
    ctx.fillStyle = palette.overlayVeil;
    ctx.fillRect(0, 360, W, 110);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = palette.text;
    ctx.font = "bold 36px monospace";
    withGlow(palette.text, () => ctx.fillText(`NIVEL ${level}`, W / 2, 398));
    ctx.font = "16px monospace";
    ctx.fillText("ESPACIO O CLIC PARA LANZAR", W / 2, 442);
  }
  function drawGameOver() {
    ctx.fillStyle = palette.overlayVeil;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = palette.text;
    ctx.font = "bold 64px monospace";
    withGlow(palette.text, () => ctx.fillText("GAME OVER", W / 2, H / 2));
  }
  function draw() {
    // El buffer puede ser mayor que 800×600 (devicePixelRatio): se dibuja en coordenadas lógicas.
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, W, H);
    for (const block of blocks) if (block.alive) drawBlock(block);
    for (const exp of explosions) drawExplosion(exp);
    drawPaddle();
    if (state !== "gameover") drawBall();
    drawVoltage();
    if (state === "serve") drawServeNotice();
    if (state === "gameover") drawGameOver();
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
      initGame();
      // Dibuja y notifica ya, aunque el bucle esté en pausa.
      draw();
      notify();
    },
    end() {
      if (state !== "gameover") {
        state = "gameover";
        voltage = 0;
      }
      gameOverPending = true;
      draw();
      notify();
    },
    setInputEnabled(enabled) {
      inputEnabled = enabled;
      if (!enabled) clearInput();
    },
    setSkin(skin) {
      palette = SKINS[skin];
      // Con el bucle detenido (pausa) se dibuja un frame para que el cambio se vea ya.
      if (!destroyed && frame === null) draw();
    },
    destroy() {
      destroyed = true;
      stop();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      // Ningún sonido sigue sonando tras SALIR.
      for (const clip of activeClips) clip.pause();
      activeClips.clear();
    },
  };
};
