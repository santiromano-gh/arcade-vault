// Motor de TETRIS: port de references/03-tetris (game.js, index.html y style.css en tema
// oscuro). Mecánicas, tablero, panel lateral y overlay son los del prototipo, dibujados en un
// único canvas de 800×600; lo nuevo es la integración con React: estado en este cierre,
// notificaciones, pausa, bloqueo del teclado y limpieza.
import type { CreateEngine, GameStats } from "../types";
import {
  BLOCK,
  COLORS,
  COLS,
  KICKS,
  LINE_SCORES,
  ROWS,
  type Board,
  type Piece,
  clearLines,
  collide,
  createBoard,
  ghostY,
  merge,
  randomPiece,
  rotateCW,
} from "./board";
// Coordenadas lógicas del canvas.
const W = 800;
const H = 600;
const BOARD_X = 250; // tablero de 300×600 centrado
const BOARD_W = COLS * BLOCK;
const BOARD_H = ROWS * BLOCK;
const PANEL_X = BOARD_X + BOARD_W + 20; // 20 px tras el tablero
const MAX_SCORE = 10_000_000;
const GHOST_ALPHA = 0.2;
// Colores y tipografías del tema oscuro de style.css.
const BG = "#0f0f17";
const CANVAS_BG = "#1a1a25";
const BORDER = "#2a2a3a";
const GRID_LINE = "#22222e";
const ACCENT = "#7aa2f7";
const LABEL = "#555570";
const CONTROLS_TEXT = "#888";
const KBD_BG = "#22223a";
const KBD_BORDER = "#3a3a5a";
const KBD_TEXT = "#aaa";
const SANS = "system-ui, -apple-system, sans-serif";
const MONO = '"Courier New", Courier, monospace';
// Controles del panel, tal cual en index.html.
const CONTROLS: readonly { keys: string[]; text: string }[] = [
  { keys: ["←", "→"], text: "mover" },
  { keys: ["↑"], text: "rotar" },
  { keys: ["↓"], text: "bajar" },
  { keys: ["Space"], text: "caída" },
  { keys: ["P"], text: "pausa" },
];
// Teclas que el juego usa y que no deben hacer scroll en la página.
const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"]);
type State = "playing" | "gameover";
const formatScore = (n: number) => n.toLocaleString("es-ES");
export const createTetrisGame: CreateEngine = (canvas, callbacks) => {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("TETRIS: el navegador no soporta canvas 2D.");
  const ctx = context;
  // ── Estado del juego ────────────────────────────────────────────────────────
  let board: Board = createBoard();
  let next: Piece = randomPiece();
  let current: Piece = next;
  let score = 0;
  let lines = 0;
  let level = 1;
  let dropInterval = 1000;
  let dropAccum = 0;
  let state: State = "playing";
  let paused = false;
  let inputEnabled = true;
  // Notificaciones a React: solo cuando cambia algún valor respecto al último enviado.
  let lastStats: GameStats | null = null;
  let gameOverPending = false;
  const stats = (): GameStats => ({ score, lives: 0, level });
  function notify() {
    if (!lastStats || lastStats.score !== score || lastStats.level !== level) {
      lastStats = stats();
      callbacks.onStats(lastStats);
    }
    if (gameOverPending) {
      gameOverPending = false;
      callbacks.onGameOver(stats());
    }
  }
  // Toda suma de puntos pasa por aquí: por encima del tope, submitScore rechazaría el guardado.
  function addScore(points: number) {
    score = Math.min(score + points, MAX_SCORE);
  }
  function initGame() {
    board = createBoard();
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    dropAccum = 0;
    state = "playing";
    gameOverPending = false;
    // Fuerza a notificar el estado inicial en el siguiente frame, también en cada reinicio.
    lastStats = null;
    next = randomPiece();
    spawn();
  }
  // ── Mecánicas ───────────────────────────────────────────────────────────────
  function spawn() {
    current = next;
    next = randomPiece();
    if (collide(board, current.shape, current.x, current.y)) {
      state = "gameover";
      gameOverPending = true;
    }
  }
  function lockPiece() {
    merge(board, current);
    const cleared = clearLines(board);
    if (cleared) {
      lines += cleared;
      // Puntos con el nivel que había antes de recalcularlo.
      addScore(LINE_SCORES[cleared] * level);
      level = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    }
    spawn();
  }
  function move(dx: number) {
    if (!collide(board, current.shape, current.x + dx, current.y)) current.x += dx;
  }
  function tryRotate() {
    const rotated = rotateCW(current.shape);
    for (const kick of KICKS) {
      if (!collide(board, rotated, current.x + kick, current.y)) {
        current.shape = rotated;
        current.x += kick;
        return;
      }
    }
  }
  function softDrop() {
    if (!collide(board, current.shape, current.x, current.y + 1)) {
      current.y++;
      addScore(1);
    } else {
      lockPiece();
    }
  }
  function hardDrop() {
    const gy = ghostY(board, current);
    addScore((gy - current.y) * 2);
    current.y = gy;
    lockPiece();
  }
  function update(dt: number) {
    if (state !== "playing") return;
    dropAccum += dt;
    if (dropAccum >= dropInterval) {
      dropAccum = 0;
      if (!collide(board, current.shape, current.x, current.y + 1)) current.y++;
      else lockPiece();
    }
  }
  // ── Input ───────────────────────────────────────────────────────────────────
  // Actúa en cada evento, también en los repetidos: la autorrepetición del sistema es la del
  // prototipo. La tecla P (pausa) es de React.
  const onKeyDown = (e: KeyboardEvent) => {
    if (!inputEnabled || paused || state !== "playing") return;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    switch (e.code) {
      case "ArrowLeft":
        move(-1);
        break;
      case "ArrowRight":
        move(1);
        break;
      case "ArrowDown":
        softDrop();
        break;
      case "ArrowUp":
      case "KeyX":
        tryRotate();
        break;
      case "Space":
        hardDrop();
        break;
      default:
        return;
    }
    // Un hard drop puede terminar la partida: onGameOver llega en este mismo evento.
    notify();
  };
  window.addEventListener("keydown", onKeyDown);
  // ── Draw ────────────────────────────────────────────────────────────────────
  function drawBlock(px: number, py: number, colorIndex: number, alpha = 1) {
    const color = COLORS[colorIndex];
    if (!color) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, BLOCK - 2, BLOCK - 2);
    // Brillo superior
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(px + 1, py + 1, BLOCK - 2, 4);
    ctx.globalAlpha = 1;
  }
  function drawPiece(piece: Piece, y: number, alpha = 1) {
    for (let r = 0; r < piece.shape.length; r++)
      for (let c = 0; c < piece.shape[r].length; c++)
        drawBlock(BOARD_X + (piece.x + c) * BLOCK, (y + r) * BLOCK, piece.shape[r][c], alpha);
  }
  function setText(font: string, color: string, spacing = 0) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.letterSpacing = `${spacing}px`;
  }
  function drawTitle() {
    ctx.save();
    setText(`900 36px ${MONO}`, ACCENT, 10);
    ctx.shadowColor = "rgba(122,162,247,0.5)";
    ctx.shadowBlur = 20;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    // El espaciado se añade también tras la última letra: se compensa para centrar.
    ctx.fillText("TETRIS", BOARD_X / 2 + 5, 8);
    ctx.restore();
  }
  function drawBoard() {
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(BOARD_X, 0, BOARD_W, BOARD_H);
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let c = 1; c < COLS; c++) {
      ctx.moveTo(BOARD_X + c * BLOCK, 0);
      ctx.lineTo(BOARD_X + c * BLOCK, BOARD_H);
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.moveTo(BOARD_X, r * BLOCK);
      ctx.lineTo(BOARD_X + BOARD_W, r * BLOCK);
    }
    ctx.stroke();
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) drawBlock(BOARD_X + c * BLOCK, r * BLOCK, board[r][c]);
    // Tras el fin de partida se dibuja el tablero sin pieza actual ni fantasma.
    if (state === "playing") {
      drawPiece(current, ghostY(board, current), GHOST_ALPHA);
      drawPiece(current, current.y);
    }
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(BOARD_X + 0.5, 0.5, BOARD_W - 1, BOARD_H - 1);
  }
  // Panel lateral de index.html: secciones con 20 px entre ellas y 6 px entre etiqueta y valor.
  function drawLabel(text: string, y: number) {
    setText(`600 10px ${SANS}`, LABEL, 2);
    ctx.fillText(text, PANEL_X, y);
    return y + 12 + 6;
  }
  function drawValue(label: string, value: string, y: number) {
    const valueY = drawLabel(label, y);
    setText(`bold 26px ${MONO}`, ACCENT, 1);
    ctx.fillText(value, PANEL_X, valueY);
    return valueY + 30 + 20;
  }
  function drawNext(y: number) {
    const boxY = drawLabel("NEXT", y);
    const size = 4 * BLOCK;
    ctx.fillStyle = CANVAS_BG;
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(PANEL_X + 0.5, boxY + 0.5, size - 1, size - 1, 4);
    ctx.fill();
    ctx.stroke();
    const shape = next.shape;
    const offX = Math.floor((4 - shape[0].length) / 2);
    const offY = Math.floor((4 - shape.length) / 2);
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        drawBlock(PANEL_X + (offX + c) * BLOCK, boxY + (offY + r) * BLOCK, shape[r][c]);
    return boxY + size + 20;
  }
  function drawKbd(text: string, x: number, y: number) {
    setText(`11px ${SANS}`, KBD_TEXT);
    const w = ctx.measureText(text).width + 14;
    const h = 17;
    ctx.fillStyle = KBD_BG;
    ctx.strokeStyle = KBD_BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = KBD_TEXT;
    ctx.fillText(text, x + 7, y + 2);
    return x + w + 4;
  }
  function drawControls(y: number) {
    let rowY = drawLabel("CONTROLS", y);
    for (const { keys, text } of CONTROLS) {
      let x = PANEL_X;
      for (const key of keys) x = drawKbd(key, x, rowY);
      setText(`12px ${SANS}`, CONTROLS_TEXT);
      ctx.fillText(text, x, rowY + 2);
      rowY += 17 + 6;
    }
  }
  function drawPanel() {
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let y = 4;
    y = drawValue("SCORE", formatScore(score), y);
    y = drawValue("LINES", String(lines), y);
    y = drawValue("LEVEL", String(level), y);
    y = drawNext(y);
    drawControls(y);
    ctx.restore();
  }
  function drawGameOver() {
    ctx.save();
    ctx.fillStyle = "rgba(10,10,20,0.75)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    setText(`800 28px ${SANS}`, "#e57373", 4);
    ctx.fillText("GAME OVER", W / 2 + 2, H / 2 - 13);
    setText(`14px ${MONO}`, ACCENT);
    ctx.fillText(`Puntuación: ${formatScore(score)}`, W / 2, H / 2 + 19);
    ctx.restore();
  }
  function draw() {
    // El buffer puede ser mayor que 800×600 (devicePixelRatio): se dibuja en coordenadas lógicas.
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawTitle();
    drawBoard();
    drawPanel();
    if (state === "gameover") drawGameOver();
  }
  // ── Loop principal ──────────────────────────────────────────────────────────
  let lastTime: number | null = null;
  let frame: number | null = null;
  let destroyed = false;
  function loop(ts: number) {
    const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 50);
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
      state = "gameover";
      gameOverPending = true;
      draw();
      notify();
    },
    setInputEnabled(enabled) {
      inputEnabled = enabled;
    },
    destroy() {
      destroyed = true;
      stop();
      window.removeEventListener("keydown", onKeyDown);
    },
  };
};
