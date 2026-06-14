// ─────────────────────────────────────────────────────────────────────────────
//  NEXUS: SURVIVE  –  Static Game Data
// ─────────────────────────────────────────────────────────────────────────────
import { v2 } from './types';
import type { Platform, HookPoint, UpgradeDef, PlayerStats, EnemyKind } from './types';

export type { EnemyKind };

export interface EnemyConfig {
  hp: number;
  radius: number;
  speed: number;
  damage: number;
  primaryColor: string;
  glowColor: string;
  expReward: number;
  scoreReward: number;
}

// ─── World Platforms ──────────────────────────────────────────────────────────
export const WORLD_PLATFORMS: Platform[] = [
  { x: -2500, y: 560, w: 5000, h: 120, type: 'solid', color: '#1a1a2e', glowColor: '#00f2ff33' },
  { x: -700, y: 450, w: 200, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#00f2ff55' },
  { x: -350, y: 430, w: 160, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#00f2ff55' },
  { x: 50, y: 450, w: 180, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#00f2ff55' },
  { x: 420, y: 440, w: 200, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#00f2ff55' },
  { x: 750, y: 460, w: 160, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#00f2ff55' },
  { x: -1000, y: 470, w: 180, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#00f2ff55' },
  { x: -600, y: 330, w: 150, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#ff6b0055' },
  { x: -250, y: 310, w: 200, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#ff6b0055' },
  { x: 150, y: 320, w: 175, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#ff6b0055' },
  { x: 560, y: 315, w: 160, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#ff6b0055' },
  { x: -950, y: 340, w: 170, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#ff6b0055' },
  { x: 900, y: 330, w: 170, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#ff6b0055' },
  { x: -500, y: 200, w: 140, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#ff00ff55' },
  { x: -100, y: 185, w: 190, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#ff00ff55' },
  { x: 320, y: 195, w: 145, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#ff00ff55' },
  { x: -820, y: 210, w: 150, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#ff00ff55' },
  { x: 720, y: 200, w: 155, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#ff00ff55' },
  { x: -300, y: 65, w: 220, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#ffe50055' },
  { x: 100, y: 60, w: 180, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#ffe50055' },
  { x: -650, y: 80, w: 160, h: 18, type: 'solid', color: '#1a1a2e', glowColor: '#ffe50055' },
  { x: -1250, y: 80, w: 24, h: 480, type: 'wall', color: '#101030', glowColor: '#00f2ff22' },
  { x: 1226, y: 80, w: 24, h: 480, type: 'wall', color: '#101030', glowColor: '#00f2ff22' },
  { x: -880, y: 180, w: 22, h: 280, type: 'wall', color: '#101030', glowColor: '#00f2ff22' },
  { x: 858, y: 180, w: 22, h: 280, type: 'wall', color: '#101030', glowColor: '#00f2ff22' },
  { x: -1800, y: 300, w: 22, h: 260, type: 'wall', color: '#101030', glowColor: '#00f2ff22' },
  { x: 1778, y: 300, w: 22, h: 260, type: 'wall', color: '#101030', glowColor: '#00f2ff22' },
];

// ─── Hook Points ──────────────────────────────────────────────────────────────
export const WORLD_HOOK_POINTS: HookPoint[] = [
  { pos: v2(-800, 420), radius: 8 },
  { pos: v2(-500, 420), radius: 8 },
  { pos: v2(-200, 420), radius: 8 },
  { pos: v2(100, 420), radius: 8 },
  { pos: v2(400, 420), radius: 8 },
  { pos: v2(700, 420), radius: 8 },
  { pos: v2(1000, 420), radius: 8 },
  { pos: v2(-1100, 420), radius: 8 },
  { pos: v2(-700, 280), radius: 8 },
  { pos: v2(-400, 280), radius: 8 },
  { pos: v2(-150, 280), radius: 8 },
  { pos: v2(150, 280), radius: 8 },
  { pos: v2(450, 280), radius: 8 },
  { pos: v2(750, 280), radius: 8 },
  { pos: v2(-950, 280), radius: 8 },
  { pos: v2(900, 280), radius: 8 },
  { pos: v2(-600, 150), radius: 8 },
  { pos: v2(-300, 150), radius: 8 },
  { pos: v2(0, 150), radius: 8 },
  { pos: v2(250, 150), radius: 8 },
  { pos: v2(600, 150), radius: 8 },
  { pos: v2(-800, 150), radius: 8 },
  { pos: v2(750, 150), radius: 8 },
  { pos: v2(-400, 20), radius: 8 },
  { pos: v2(-100, 20), radius: 8 },
  { pos: v2(150, 20), radius: 8 },
  { pos: v2(-1240, 250), radius: 8 },
  { pos: v2(1236, 250), radius: 8 },
  { pos: v2(-870, 300), radius: 8 },
  { pos: v2(868, 300), radius: 8 },
];

// ─── Enemy Configs ────────────────────────────────────────────────────────────
export const ENEMY_CONFIGS: Record<EnemyKind, EnemyConfig> = {
  RUNNER: {
    hp: 35,
    radius: 13,
    speed: 3.8,
    damage: 8,
    primaryColor: '#ff4444',
    glowColor: '#ff0000',
    expReward: 15,
    scoreReward: 80,
  },
  TANK: {
    hp: 220,
    radius: 22,
    speed: 1.6,
    damage: 18,
    primaryColor: '#aa2222',
    glowColor: '#ff6600',
    expReward: 50,
    scoreReward: 250,
  },
  JUMPER: {
    hp: 55,
    radius: 15,
    speed: 2.8,
    damage: 10,
    primaryColor: '#ff8800',
    glowColor: '#ffaa00',
    expReward: 25,
    scoreReward: 130,
  },
  FLYER: {
    hp: 45,
    radius: 14,
    speed: 2.4,
    damage: 7,
    primaryColor: '#aa44ff',
    glowColor: '#cc66ff',
    expReward: 22,
    scoreReward: 110,
  },
  SNIPER: {
    hp: 40,
    radius: 13,
    speed: 1.4,
    damage: 30,
    primaryColor: '#44ff88',
    glowColor: '#00ff44',
    expReward: 30,
    scoreReward: 160,
  },
  ELITE: {
    hp: 140,
    radius: 18,
    speed: 3.2,
    damage: 14,
    primaryColor: '#ff4488',
    glowColor: '#ff0066',
    expReward: 60,
    scoreReward: 400,
  },
  BOSS_TITAN: {
    hp: 1500,
    radius: 45,
    speed: 2.0,
    damage: 35,
    primaryColor: '#ff6600',
    glowColor: '#ffaa00',
    expReward: 500,
    scoreReward: 3000,
  },
};

// ─── Upgrades ─────────────────────────────────────────────────────────────────
export const UPGRADES: UpgradeDef[] = [
  {
    id: 'speed_boost',
    nameKey: 'upg.speed_boost.name',
    descKey: 'upg.speed_boost.desc',
    category: 'MOBILITY',
    maxStack: 4,
    icon: '⚡',
    apply: (s: PlayerStats) => {
      s.speed *= 1.18;
    },
  },
  {
    id: 'dash_charge',
    nameKey: 'upg.dash_charge.name',
    descKey: 'upg.dash_charge.desc',
    category: 'MOBILITY',
    maxStack: 3,
    icon: '💨',
    apply: (s: PlayerStats) => {
      s.maxDashCharges += 1;
    },
  },
  {
    id: 'grapple_power',
    nameKey: 'upg.grapple_power.name',
    descKey: 'upg.grapple_power.desc',
    category: 'MOBILITY',
    maxStack: 4,
    icon: '🔗',
    apply: (s: PlayerStats) => {
      s.grapplePull *= 1.6;
      s.grappleRange += 150;
    },
  },
  {
    id: 'extra_jump',
    nameKey: 'upg.extra_jump.name',
    descKey: 'upg.extra_jump.desc',
    category: 'MOBILITY',
    maxStack: 3,
    icon: '🦅',
    apply: (s: PlayerStats) => {
      s.maxJumps += 1;
    },
  },
  {
    id: 'damage_up',
    nameKey: 'upg.damage_up.name',
    descKey: 'upg.damage_up.desc',
    category: 'OFFENSIVE',
    maxStack: 6,
    icon: '🔥',
    apply: (s: PlayerStats) => {
      s.damage = Math.round(s.damage * 1.3);
    },
  },
  {
    id: 'fire_rate',
    nameKey: 'upg.fire_rate.name',
    descKey: 'upg.fire_rate.desc',
    category: 'OFFENSIVE',
    maxStack: 5,
    icon: '🚀',
    apply: (s: PlayerStats) => {
      s.fireInterval = Math.max(100, s.fireInterval * 0.78);
    },
  },
  {
    id: 'crit_chance',
    nameKey: 'upg.crit_chance.name',
    descKey: 'upg.crit_chance.desc',
    category: 'OFFENSIVE',
    maxStack: 4,
    icon: '💢',
    apply: (s: PlayerStats) => {
      s.critChance = Math.min(0.85, s.critChance + 0.15);
    },
  },
  {
    id: 'multi_shot',
    nameKey: 'upg.multi_shot.name',
    descKey: 'upg.multi_shot.desc',
    category: 'OFFENSIVE',
    maxStack: 3,
    icon: '🎯',
    apply: (s: PlayerStats) => {
      s.multiShot += 1;
    },
  },
  {
    id: 'piercing',
    nameKey: 'upg.piercing.name',
    descKey: 'upg.piercing.desc',
    category: 'OFFENSIVE',
    maxStack: 1,
    icon: '🗡',
    apply: (s: PlayerStats) => {
      s.piercing = true;
    },
  },
  {
    id: 'explosive',
    nameKey: 'upg.explosive.name',
    descKey: 'upg.explosive.desc',
    category: 'OFFENSIVE',
    maxStack: 1,
    icon: '💥',
    apply: (s: PlayerStats) => {
      s.explosive = true;
    },
  },
  {
    id: 'hp_up',
    nameKey: 'upg.hp_up.name',
    descKey: 'upg.hp_up.desc',
    category: 'DEFENSIVE',
    maxStack: 8,
    icon: '❤',
    apply: (s: PlayerStats) => {
      s.maxHp += 40;
    },
  },
  {
    id: 'hp_regen',
    nameKey: 'upg.hp_regen.name',
    descKey: 'upg.hp_regen.desc',
    category: 'DEFENSIVE',
    maxStack: 4,
    icon: '💊',
    apply: (s: PlayerStats) => {
      s.hpRegen += 2;
    },
  },
  {
    id: 'shield',
    nameKey: 'upg.shield.name',
    descKey: 'upg.shield.desc',
    category: 'DEFENSIVE',
    maxStack: 4,
    icon: '🛡',
    apply: (s: PlayerStats) => {
      s.shieldMax += 40;
    },
  },
  {
    id: 'combo_boost',
    nameKey: 'upg.combo_boost.name',
    descKey: 'upg.combo_boost.desc',
    category: 'SPECIAL',
    maxStack: 4,
    icon: '✦',
    apply: (s: PlayerStats) => {
      s.comboDecayRate = Math.max(0.1, s.comboDecayRate * 0.5);
    },
  },
  {
    id: 'kill_heal',
    nameKey: 'upg.kill_heal.name',
    descKey: 'upg.kill_heal.desc',
    category: 'SPECIAL',
    maxStack: 4,
    icon: '🩸',
    apply: (s: PlayerStats) => {
      s.killHeal += 4;
    },
  },
  {
    id: 'dash_damage',
    nameKey: 'upg.dash_damage.name',
    descKey: 'upg.dash_damage.desc',
    category: 'SPECIAL',
    maxStack: 1,
    icon: '⚔',
    apply: (s: PlayerStats) => {
      s.dashDamage = true;
    },
  },
  {
    id: 'grapple_pull',
    nameKey: 'upg.grapple_pull.name',
    descKey: 'upg.grapple_pull.desc',
    category: 'SPECIAL',
    maxStack: 1,
    icon: '⚡',
    apply: (_s: PlayerStats) => {
      /* engine handles */
    },
  },
  {
    id: 'exp_boost',
    nameKey: 'upg.exp_boost.name',
    descKey: 'upg.exp_boost.desc',
    category: 'SPECIAL',
    maxStack: 3,
    icon: '🧠',
    apply: (s: PlayerStats) => {
      s.expBonus += 0.25;
    },
  },
];

// ─── Default Player Stats ─────────────────────────────────────────────────────
export function defaultStats(): PlayerStats {
  return {
    maxHp: 100,
    speed: 1.0,
    damage: 25,
    fireInterval: 420,
    critChance: 0.08,
    critMul: 2.2,
    maxDashCharges: 2,
    dashSpeed: 24,
    dashDuration: 130,
    dashCooldown: 380,
    maxJumps: 2,
    grappleRange: 650,
    grapplePull: 2.2,
    grappleCooldown: 220,
    piercing: false,
    explosive: false,
    multiShot: 1,
    hpRegen: 0,
    shieldMax: 0,
    killHeal: 0,
    dashDamage: false,
    comboDecayRate: 1.0,
    expBonus: 0,
  };
}
