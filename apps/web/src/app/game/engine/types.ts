// ─────────────────────────────────────────────────────────────────────────────
//  NEXUS: SURVIVE  –  Core Types & Vector Math
//  All game entities, stats, and data structures live here.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Vector Math ─────────────────────────────────────────────────────────────
export type Vector2 = { x: number; y: number };
export const v2 = (x = 0, y = 0): Vector2 => ({ x, y });
export const v2_add = (a: Vector2, b: Vector2): Vector2 => ({ x: a.x + b.x, y: a.y + b.y });
export const v2_sub = (a: Vector2, b: Vector2): Vector2 => ({ x: a.x - b.x, y: a.y - b.y });
export const v2_mul = (a: Vector2, s: number): Vector2 => ({ x: a.x * s, y: a.y * s });
export const v2_len = (a: Vector2): number => Math.sqrt(a.x * a.x + a.y * a.y);
export const v2_dist = (a: Vector2, b: Vector2): number =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
export const v2_norm = (a: Vector2): Vector2 => {
  const l = v2_len(a);
  return l < 0.0001 ? v2() : v2(a.x / l, a.y / l);
};
export const v2_lerp = (a: Vector2, b: Vector2, t: number): Vector2 =>
  v2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
export const v2_clone = (a: Vector2): Vector2 => ({ x: a.x, y: a.y });

// ─── Platform ────────────────────────────────────────────────────────────────
export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'solid' | 'wall';
  color: string;
  glowColor?: string;
}

// ─── Hook Point ──────────────────────────────────────────────────────────────
export interface HookPoint {
  pos: Vector2;
  radius: number;
}

// ─── Particle ────────────────────────────────────────────────────────────────
export interface Particle {
  pos: Vector2;
  vel: Vector2;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
  gravity: number;
  glow: boolean;
}

// ─── Enemy Kind ──────────────────────────────────────────────────────────────
export type EnemyKind = 'RUNNER' | 'TANK' | 'JUMPER' | 'FLYER' | 'SNIPER' | 'ELITE' | 'BOSS_TITAN';

export interface Enemy {
  id: number;
  kind: EnemyKind;
  pos: Vector2;
  vel: Vector2;
  hp: number;
  maxHp: number;
  radius: number;
  primaryColor: string;
  glowColor: string;
  speed: number;
  damage: number;
  onGround: boolean;
  stunTimer: number;
  attackCooldown: number;
  behaviorTimer: number;
  isBoss: boolean;
  flashTimer: number;
  shootTimer?: number;
  targetX?: number;
}

// ─── Projectile ──────────────────────────────────────────────────────────────
export interface Projectile {
  id: number;
  pos: Vector2;
  vel: Vector2;
  radius: number;
  color: string;
  glowColor: string;
  damage: number;
  life: number;
  maxLife: number;
  piercing: boolean;
  explosive: boolean;
  fromPlayer: boolean;
  pierceCount: number;
  trail: Vector2[];
}

// ─── Player Stats (mutated by upgrades) ──────────────────────────────────────
export interface PlayerStats {
  maxHp: number;
  speed: number;
  damage: number;
  fireInterval: number; // ms between shots
  critChance: number;
  critMul: number;
  maxDashCharges: number;
  dashSpeed: number;
  dashDuration: number;
  dashCooldown: number;
  maxJumps: number;
  grappleRange: number;
  grapplePull: number;
  grappleCooldown: number;
  piercing: boolean;
  explosive: boolean;
  multiShot: number;
  hpRegen: number;
  shieldMax: number;
  killHeal: number;
  dashDamage: boolean;
  comboDecayRate: number; // combo decays per second
  expBonus: number;
}

// ─── Player Runtime State ─────────────────────────────────────────────────────
export interface Player {
  pos: Vector2;
  vel: Vector2;
  radius: number;
  hp: number;
  shield: number;
  stats: PlayerStats;
  onGround: boolean;
  onWallLeft: boolean;
  onWallRight: boolean;
  wallRunTimer: number;
  jumpsLeft: number;
  dashChargesLeft: number;
  dashCooldownLeft: number;
  isDashing: boolean;
  dashTimer: number;
  dashDir: Vector2;
  grappleCooldownLeft: number;
  invincibleTimer: number;
  flashTimer: number;
  facing: 1 | -1;
  runMomentum: number; // 0–1, builds over continuous same-direction running
  runDir: number; // -1, 0, 1
  shootTimer: number; // countdown to next auto-shot (ms)
}

// ─── Upgrade Definition ───────────────────────────────────────────────────────
export interface UpgradeDef {
  id: string;
  nameKey: string;
  descKey: string;
  category: 'MOBILITY' | 'OFFENSIVE' | 'DEFENSIVE' | 'SPECIAL';
  maxStack: number;
  icon: string;
  apply: (stats: PlayerStats) => void;
}

// ─── Game Snapshot (consumed by React UI / renderer) ──────────────────────────
export interface GameSnapshot {
  score: number;
  kills: number;
  bossKills: number;
  level: number;
  exp: number;
  nextLevelExp: number;
  time: number; // ms elapsed
  combo: number;
  comboMul: number;
  hp: number;
  maxHp: number;
  shield: number;
  shieldMax: number;
  isGameOver: boolean;
  dashChargesLeft: number;
  maxDashCharges: number;
  grappleCooldownFrac: number; // 0 = ready, 1 = full cooldown
  dashCooldownFrac: number;
  upgradeCounts: Record<string, number>;
  isGrappling: boolean;
  grapplePoint: Vector2 | null;
  playerPos: Vector2;
  playerOnGround: boolean;
  playerFacing: 1 | -1;
  playerVel: Vector2;
  playerDashing: boolean;
  screenShake: number;
}

export interface UpgradePickEvent {
  options: UpgradeDef[];
}
