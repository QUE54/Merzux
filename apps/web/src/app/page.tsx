'use client';
// ─────────────────────────────────────────────────────────────────────────────
//  NEXUS: SURVIVE  –  Main Page / Canvas Renderer
//  Production-quality game loop with dt-based timing, screen shake,
//  particle rendering, and full React UI overlay integration.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GameEngine } from './game/engine';
import type { GameSnapshot } from './game/engine/types';
import { i18n } from './game/engine/i18n';
import GameMenu from './game/components/GameMenu';
import GameHUD from './game/components/GameHUD';
import LevelUpOverlay from './game/components/LevelUpOverlay';
import SettingsOverlay, { loadSettings, type Settings } from './game/components/SettingsOverlay';

// ─── Input state ──────────────────────────────────────────────────────────────
interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  dash: boolean;
  grapple: boolean;
  prev: { dash: boolean; grapple: boolean; up: boolean; down: boolean };
}
function mkInput(): InputState {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    dash: false,
    grapple: false,
    prev: { dash: false, grapple: false, up: false, down: false },
  };
}

// ─── Canvas helper ────────────────────────────────────────────────────────────
function resize(canvas: HTMLCanvasElement) {
  if (typeof window === 'undefined') return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  blur = 20
) {
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ─── Main Component ───────────────────────────────────────────────────────────
type UIState =
  | 'MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_UP'
  | 'GAME_OVER'
  | 'SETTINGS_MENU'
  | 'SETTINGS_PAUSE';

export default function NexusSurvivePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const inputsRef = useRef<InputState>(mkInput());
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const prevStateRef = useRef<UIState>('MENU');

  const [ui, setUI] = useState<UIState>('MENU');
  const [codename, setCodename] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [snap, setSnap] = useState<GameSnapshot | null>(null);
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  const queryClient = useQueryClient();

  // ─── i18n init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    i18n.init();
    i18n.setLang(settings.language);
  }, [settings.language]);

  // ─── Leaderboard fetch ───────────────────────────────────────────────────────
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
    refetchInterval: 30000,
  });

  // ─── Score submission ────────────────────────────────────────────────────────
  const submitScore = useMutation({
    mutationFn: async (data: {
      score: number;
      kills: number;
      time_survived: number;
      build_summary: string;
    }) => {
      if (!playerId) throw new Error('No player ID');
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: playerId, ...data }),
      });
      if (!res.ok) throw new Error('Failed to submit score');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      toast.success(i18n.t('gameover.submitted'));
    },
    onError: () => toast.error(i18n.t('err.connection')),
  });

  // Keep submitScore in a ref to avoid stale closure in RAF loop
  const submitScoreRef = useRef(submitScore.mutate);
  useEffect(() => {
    submitScoreRef.current = submitScore.mutate;
  }, [submitScore.mutate]);

  // ─── Start game (declare BEFORE handleRegister which uses it) ────────────────
  const startGame = useCallback(() => {
    engineRef.current = new GameEngine();
    setSnap(null);
    setUI('PLAYING');
  }, []);

  // ─── Register player ─────────────────────────────────────────────────────────
  const handleRegister = useCallback(async () => {
    if (codename.length < 3 || codename.length > 20) return;
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codename }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? i18n.t('err.connection'));
      return;
    }
    setPlayerId(data.id);
    startGame();
  }, [codename, startGame]);

  // ─── Level-up selection ───────────────────────────────────────────────────────
  const handleUpgradeSelect = useCallback((id: string) => {
    engineRef.current?.applyUpgrade(id);
    setUI('PLAYING');
  }, []);

  // ─── Settings change ──────────────────────────────────────────────────────────
  const handleSettingsChange = useCallback((s: Settings) => {
    setSettings(s);
    i18n.setLang(s.language);
  }, []);

  // ─── Game loop ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (ui !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    resize(canvas);
    const handleResize = () => resize(canvas);
    window.addEventListener('resize', handleResize);

    // ─── Keyboard input ──────────────────────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      const inp = inputsRef.current;
      switch (e.code) {
        case 'KeyA':
          inp.left = true;
          break;
        case 'KeyD':
          inp.right = true;
          break;
        case 'KeyW':
          inp.up = true;
          break;
        case 'KeyS':
          inp.down = true;
          break;
        case 'Space':
          inp.dash = true;
          e.preventDefault();
          break;
        case 'KeyQ':
          inp.grapple = true;
          break;
        case 'Escape':
          setUI((prev) => {
            prevStateRef.current = prev;
            return prev === 'PAUSED' ? 'PLAYING' : 'PAUSED';
          });
          break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const inp = inputsRef.current;
      switch (e.code) {
        case 'KeyA':
          inp.left = false;
          break;
        case 'KeyD':
          inp.right = false;
          break;
        case 'KeyW':
          inp.up = false;
          break;
        case 'KeyS':
          inp.down = false;
          break;
        case 'Space':
          inp.dash = false;
          break;
        case 'KeyQ':
          inp.grapple = false;
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // ─── Render loop ─────────────────────────────────────────────────────────
    let animId = 0;
    let gameOverSubmitted = false;
    function loop(now: number) {
      animId = requestAnimationFrame(loop);
      const engine = engineRef.current;
      if (!engine) return;

      const deltaMs = Math.min(now - (lastTimeRef.current || now), 100);
      lastTimeRef.current = now;

      // Update engine if actively playing (not paused, not level-up, not gameover)
      if (ui === 'PLAYING') {
        const inp = inputsRef.current;
        engine.update(deltaMs, inp);
        // Update prev inputs
        inp.prev = { dash: inp.dash, grapple: inp.grapple, up: inp.up, down: inp.down };

        const snapshot = engine.getSnapshot();
        setSnap(snapshot);

        // Check pending level-up
        if (engine.pendingLevelUp) {
          setUI('LEVEL_UP');
        }
        // Check game over
        if (snapshot.isGameOver && !gameOverSubmitted) {
          gameOverSubmitted = true;
          setUI('GAME_OVER');
          submitScoreRef.current({
            score: snapshot.score,
            kills: snapshot.kills,
            time_survived: Math.floor(snapshot.time / 1000),
            build_summary: JSON.stringify(snapshot.upgradeCounts),
          });
        }
      }

      // Compute screen shake offset (safe inside RAF)
      const shake = settings.screenShake ? engine.screenShake : 0;
      const shakeX = shake > 0 ? (Math.random() - 0.5) * shake * 2 : 0;
      const shakeY = shake > 0 ? (Math.random() - 0.5) * shake * 2 : 0;
      draw(ctx, canvas, engine, settings, now, shakeX, shakeY);
    }

    lastTimeRef.current = performance.now();
    animId = requestAnimationFrame(loop);
    frameRef.current = animId;

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [ui, settings]);

  // ─── Also draw when paused/level-up (frozen frame) ─────────────────────────
  useEffect(() => {
    if (ui !== 'PAUSED' && ui !== 'LEVEL_UP') return;
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    draw(ctx, canvas, engine, settings, performance.now(), 0, 0);
  }, [ui, settings]);

  const isInGame = ui === 'PLAYING' || ui === 'PAUSED' || ui === 'LEVEL_UP' || ui === 'GAME_OVER';
  const showSettings = ui === 'SETTINGS_MENU' || ui === 'SETTINGS_PAUSE';
  const settingsCloseTarget: UIState = ui === 'SETTINGS_MENU' ? 'MENU' : 'PAUSED';
  const showHUD = (ui === 'PLAYING' || ui === 'PAUSED' || ui === 'LEVEL_UP') && snap !== null;
  const showLevelUp = ui === 'LEVEL_UP' && engineRef.current !== null;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono overflow-hidden">
      {/* ── Canvas (always mounted when in-game) ── */}
      {isInGame && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 w-full h-full block"
          style={{ imageRendering: 'pixelated' }}
        />
      )}

      {/* ── MENU ── */}
      {ui === 'MENU' && (
        <GameMenu
          codename={codename}
          setCodename={setCodename}
          handleRegister={handleRegister}
          leaderboard={leaderboard}
          onOpenSettings={() => {
            prevStateRef.current = 'MENU';
            setUI('SETTINGS_MENU');
          }}
        />
      )}

      {/* ── HUD (over canvas) ── */}
      {showHUD && snap && <GameHUD codename={codename} snap={snap} />}

      {/* ── LEVEL UP overlay ── */}
      {showLevelUp && engineRef.current && (
        <LevelUpOverlay
          level={engineRef.current.level}
          options={engineRef.current.getUpgradeOptions()}
          onSelect={handleUpgradeSelect}
        />
      )}

      {/* ── PAUSE overlay ── */}
      {ui === 'PAUSED' && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <h2 className="text-4xl font-black text-[#00f2ff] italic mb-8 tracking-widest">
            {i18n.t('pause.title')}
          </h2>
          <div className="flex flex-col gap-3 w-48">
            <PauseBtn onClick={() => setUI('PLAYING')} label={i18n.t('pause.resume')} primary />
            <PauseBtn
              onClick={() => {
                prevStateRef.current = 'PAUSED';
                setUI('SETTINGS_PAUSE');
              }}
              label={i18n.t('pause.settings')}
            />
            <PauseBtn
              onClick={() => {
                engineRef.current = null;
                setUI('MENU');
              }}
              label={i18n.t('pause.menu')}
              danger
            />
          </div>
        </div>
      )}

      {/* ── GAME OVER overlay ── */}
      {ui === 'GAME_OVER' && snap && (
        <GameOverOverlay
          snap={snap}
          submitting={submitScore.isPending}
          onReplay={() => {
            setSnap(null);
            startGame();
          }}
          onMenu={() => {
            engineRef.current = null;
            setUI('MENU');
          }}
        />
      )}

      {/* ── SETTINGS overlays ── */}
      {showSettings && (
        <SettingsOverlay
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setUI(settingsCloseTarget)}
        />
      )}
    </div>
  );
}

// ─── Pause button helper ──────────────────────────────────────────────────────
function PauseBtn({
  onClick,
  label,
  primary,
  danger,
}: {
  onClick: () => void;
  label: string;
  primary?: boolean;
  danger?: boolean;
}) {
  const base =
    'w-full py-2.5 rounded font-mono text-sm uppercase tracking-wider transition-all font-bold';
  const cls = primary
    ? `${base} bg-[#00f2ff] text-black hover:bg-[#00d4df]`
    : danger
      ? `${base} border border-red-500 text-red-400 hover:bg-red-500 hover:text-black`
      : `${base} border border-[#ffffff22] text-[#ffffff88] hover:border-[#00f2ff44] hover:text-[#00f2ff]`;
  return (
    <button className={cls} onClick={onClick}>
      {label}
    </button>
  );
}

// ─── Game Over Overlay ────────────────────────────────────────────────────────
function GameOverOverlay({
  snap,
  submitting,
  onReplay,
  onMenu,
}: {
  snap: GameSnapshot;
  submitting: boolean;
  onReplay: () => void;
  onMenu: () => void;
}) {
  const t = (k: string) => i18n.t(k);
  const mins = Math.floor(snap.time / 60000);
  const secs = Math.floor((snap.time % 60000) / 1000);
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  const stats = [
    { label: t('gameover.score'), value: snap.score.toLocaleString(), color: '#00f2ff' },
    { label: t('gameover.kills'), value: snap.kills.toString(), color: '#ff4444' },
    { label: t('gameover.time'), value: timeStr, color: '#ffaa00' },
    { label: t('gameover.level'), value: snap.level.toString(), color: '#aa44ff' },
    { label: t('gameover.combo'), value: `×${snap.comboMul.toFixed(1)}`, color: '#ffee00' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)' }}
    >
      <div className="text-center mb-8">
        <h2
          className="text-5xl font-black italic text-[#ff3333] mb-2"
          style={{ textShadow: '0 0 40px #ff3333aa' }}
        >
          {t('gameover.title')}
        </h2>
        <p className="text-[#ffffff33] font-mono text-xs tracking-widest">
          {i18n.t('gameover.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 w-full max-w-2xl">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="text-center border border-[#ffffff0a] rounded p-3">
            <div className="text-[9px] text-[#ffffff33] uppercase tracking-wider mb-1">{label}</div>
            <div
              className="text-xl font-black"
              style={{ color, textShadow: `0 0 12px ${color}88` }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {submitting ? (
        <p className="text-[#ffffff55] font-mono text-xs mb-6">{t('gameover.submitting')}</p>
      ) : (
        <p className="text-[#00f2ff55] font-mono text-xs mb-6">{t('gameover.submitted')}</p>
      )}

      <div className="flex gap-4">
        <button
          onClick={onReplay}
          className="px-8 py-3 bg-[#00f2ff] text-black font-black rounded uppercase tracking-wider hover:bg-[#00d4df] transition-all"
          style={{ boxShadow: '0 0 20px #00f2ff44' }}
        >
          {t('gameover.again')}
        </button>
        <button
          onClick={onMenu}
          className="px-8 py-3 border border-[#ffffff22] text-[#ffffff88] font-mono rounded uppercase tracking-wider hover:border-[#00f2ff44] hover:text-[#00f2ff] transition-all"
        >
          {t('gameover.menu')}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  CANVAS RENDERER  –  draw(ctx, canvas, engine, settings, now, shakeX, shakeY)
// ─────────────────────────────────────────────────────────────────────────────
function draw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  engine: GameEngine,
  settings: Settings,
  now: number,
  shakeX: number,
  shakeY: number
) {
  const W = canvas.width;
  const H = canvas.height;

  // Clear
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, W, H);

  // Background grid (parallax slower than world)
  const camX = W / 2 - engine.camPos.x;
  const camY = H / 2 - engine.camPos.y;
  drawGrid(ctx, W, H, engine.camPos.x * 0.3, engine.camPos.y * 0.3);

  // World space
  ctx.save();
  ctx.translate(camX + shakeX, camY + shakeY);

  // ── Platforms ──
  for (const plat of engine.platforms) {
    ctx.fillStyle = plat.color;
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    if (plat.glowColor) {
      const grad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + 4);
      grad.addColorStop(0, plat.glowColor);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(plat.x, plat.y, plat.w, 4);
    }
  }

  // ── Hook points ──
  const grappleReady = engine.player.grappleCooldownLeft <= 0;
  for (const hp of engine.hookPoints) {
    const pulse = grappleReady ? 0.5 + 0.5 * Math.sin(now / 400 + hp.pos.x) : 0.15;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(hp.pos.x, hp.pos.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#00f2ff';
    ctx.shadowBlur = grappleReady ? 12 : 3;
    ctx.shadowColor = '#00f2ff';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // ── Particles ──
  for (const pt of engine.particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.globalAlpha = alpha;
    if (pt.glow) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = pt.color;
    }
    ctx.beginPath();
    ctx.arc(pt.pos.x, pt.pos.y, Math.max(0.5, pt.radius), 0, Math.PI * 2);
    ctx.fillStyle = pt.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  // ── Projectiles with trails ──
  for (const pr of engine.projectiles) {
    for (let i = 0; i < pr.trail.length; i++) {
      const ta = (i / pr.trail.length) * 0.6;
      const tr = pr.radius * (i / pr.trail.length) * 0.8;
      ctx.globalAlpha = ta;
      ctx.beginPath();
      ctx.arc(pr.trail[i].x, pr.trail[i].y, tr, 0, Math.PI * 2);
      ctx.fillStyle = pr.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 15;
    ctx.shadowColor = pr.glowColor;
    ctx.beginPath();
    ctx.arc(pr.pos.x, pr.pos.y, pr.radius, 0, Math.PI * 2);
    ctx.fillStyle = pr.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── Enemies ──
  for (const e of engine.enemies) {
    const flash = e.flashTimer > 0;
    ctx.shadowBlur = e.isBoss ? 30 : 12;
    ctx.shadowColor = e.glowColor;
    ctx.beginPath();
    ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
    ctx.fillStyle = flash ? '#ffffff' : e.primaryColor;
    ctx.fill();
    if (e.isBoss) {
      ctx.beginPath();
      ctx.arc(e.pos.x, e.pos.y, e.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = e.glowColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin(now / 200);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.shadowBlur = 0;
    const barW = e.radius * 2.4;
    const barH = e.isBoss ? 8 : 4;
    const barY = e.pos.y - e.radius - (e.isBoss ? 18 : 10);
    const barX = e.pos.x - barW / 2;
    ctx.fillStyle = '#ffffff15';
    ctx.fillRect(barX, barY, barW, barH);
    const hpFrac = Math.max(0, e.hp / e.maxHp);
    const hpCol = hpFrac > 0.5 ? '#ff4444' : hpFrac > 0.2 ? '#ff8800' : '#ff0000';
    ctx.fillStyle = hpCol;
    ctx.fillRect(barX, barY, barW * hpFrac, barH);
    if (e.isBoss) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(i18n.t(`enemy.${e.kind}`), e.pos.x, barY - 6);
    }
  }
  ctx.textAlign = 'left';

  // ── Grapple rope ──
  if (engine.isGrappling && engine.grapplePoint) {
    const { x: px, y: py } = engine.player.pos;
    const { x: gx, y: gy } = engine.grapplePoint;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(gx, gy);
    ctx.strokeStyle = '#00f2ff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00f2ff';
    ctx.stroke();
    ctx.shadowBlur = 0;
    drawGlow(ctx, gx, gy, 6, '#00f2ff', 20);
  }

  // ── Player ──
  const pl = engine.player;
  const plFlash = pl.flashTimer > 0;
  const plGlow = pl.isDashing ? '#ffffff' : '#00f2ff';
  if (pl.isDashing) {
    for (let i = 1; i <= 4; i++) {
      const tx = pl.pos.x - pl.vel.x * i * 1.5;
      const ty = pl.pos.y - pl.vel.y * i * 1.5;
      ctx.globalAlpha = 0.1 * (5 - i);
      ctx.beginPath();
      ctx.arc(tx, ty, pl.radius * (1 - i * 0.1), 0, Math.PI * 2);
      ctx.fillStyle = '#00f2ff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.shadowBlur = pl.isDashing ? 40 : 20;
  ctx.shadowColor = plGlow;
  ctx.beginPath();
  ctx.arc(pl.pos.x, pl.pos.y, pl.radius, 0, Math.PI * 2);
  if (plFlash) {
    ctx.fillStyle = '#ffffff';
  } else {
    const grad = ctx.createRadialGradient(
      pl.pos.x - 4,
      pl.pos.y - 4,
      2,
      pl.pos.x,
      pl.pos.y,
      pl.radius
    );
    grad.addColorStop(0, '#aaffff');
    grad.addColorStop(1, '#00f2ff');
    ctx.fillStyle = grad;
  }
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff88';
  ctx.beginPath();
  ctx.arc(pl.pos.x + pl.facing * 8, pl.pos.y, 4, 0, Math.PI * 2);
  ctx.fill();
  if (pl.onWallLeft || pl.onWallRight) {
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now / 100);
    ctx.strokeStyle = '#00f2ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(pl.pos.x - pl.radius - 2, pl.pos.y - pl.radius, pl.radius * 0.4, pl.radius * 2);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ─── Background Grid ──────────────────────────────────────────────────────────
function drawGrid(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  offsetX: number,
  offsetY: number
) {
  const gs = 80;
  ctx.strokeStyle = '#00f2ff08';
  ctx.lineWidth = 0.5;
  const ox = ((offsetX % gs) + gs) % gs;
  const oy = ((offsetY % gs) + gs) % gs;
  for (let x = -ox; x < W + gs; x += gs) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = -oy; y < H + gs; y += gs) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}
