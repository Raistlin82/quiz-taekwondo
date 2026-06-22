/* ============================================================
   Lightweight canvas confetti. burst() for a correct answer,
   rain() for a great final result. Self-managing rAF loop.
   ============================================================ */

const COLORS = ['#22c55e', '#3b82f6', '#fbbf24', '#ef4444', '#14b8a6', '#a855f7'];

interface Part {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  s: number;
  c: string;
  rot: number;
  vr: number;
  life: number;
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let parts: Part[] = [];
let raf: number | null = null;

function ensure(): boolean {
  if (canvas && ctx) return true;
  canvas = document.getElementById('confetti') as HTMLCanvasElement | null;
  if (!canvas) return false;
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  return Boolean(ctx);
}

function resize(): void {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function spawn(n: number, big: boolean): void {
  for (let i = 0; i < n; i++) {
    parts.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 120,
      y: window.innerHeight / 2 - 60,
      vx: (Math.random() - 0.5) * (big ? 14 : 9),
      vy: Math.random() * -1 - (big ? 7 : 5),
      g: 0.22,
      s: Math.random() * 7 + 4,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.3,
      life: big ? 120 : 70,
    });
  }
}

function loop(): void {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of parts) {
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life--;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.c;
    ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.5);
    ctx.restore();
  }
  parts = parts.filter((p) => p.life > 0 && p.y < canvas!.height + 30);
  if (parts.length) {
    raf = requestAnimationFrame(loop);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    raf = null;
  }
}

export function burst(): void {
  if (!ensure()) return;
  spawn(18, false);
  if (!raf) loop();
}

export function rain(): void {
  if (!ensure()) return;
  spawn(120, true);
  if (!raf) loop();
}
