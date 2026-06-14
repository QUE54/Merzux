// NEXUS: SURVIVE – Game Engine
import {
  Vector2,
  v2,
  v2_add,
  v2_sub,
  v2_mul,
  v2_norm,
  v2_dist,
  v2_len,
  v2_lerp,
  v2_clone,
  Platform,
  HookPoint,
  Particle,
  Enemy,
  Projectile,
  Player,
  UpgradeDef,
  GameSnapshot,
} from './types';
import type { EnemyKind } from './data';
import { WORLD_PLATFORMS, WORLD_HOOK_POINTS, ENEMY_CONFIGS, UPGRADES, defaultStats } from './data';
import { i18n } from './i18n';

export type {
  Vector2,
  GameSnapshot,
  UpgradeDef,
  Platform,
  HookPoint,
  Particle,
  Enemy,
  Projectile,
  Player,
};
export { UPGRADES };

const GRAVITY = 0.68,
  FRIC_GROUND = 0.75,
  FRIC_AIR = 0.975;
const WALK_ACCEL = 1.9,
  MAX_SPEED = 9.5;
const JUMP_VEL = -17,
  DBL_JUMP_VEL = -14,
  WALL_JUMP_X = 13,
  WALL_JUMP_Y = -15,
  WALL_RUN_G = 0.12;
const SLIDE_ACCEL = 2.2;
let _id = 1;
const uid = () => _id++;
function rnd(lo: number, hi: number) {
  return lo + Math.random() * (hi - lo);
}
function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
interface Inputs {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  dash: boolean;
  grapple: boolean;
  prev: { dash: boolean; grapple: boolean; up: boolean; down: boolean };
}

export class GameEngine {
  platforms: Platform[] = WORLD_PLATFORMS;
  hookPoints: HookPoint[] = WORLD_HOOK_POINTS;
  player!: Player;
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  isGrappling = false;
  grapplePoint: Vector2 | null = null;
  score = 0;
  kills = 0;
  bossKills = 0;
  level = 1;
  exp = 0;
  nextLevelExp = 80;
  time = 0;
  combo = 0;
  comboMul = 1;
  peakCombo = 0;
  comboTimer = 0;
  difficultyMul = 1.0;
  enemySpawnTimer = 0;
  bossTimer = 0;
  screenShake = 0;
  notifications: { text: string; timer: number }[] = [];
  isPaused = false;
  isGameOver = false;
  gameOverReason = '';
  pendingLevelUp = false;
  upgradeOptions: UpgradeDef[] = [];
  upgradeCounts: Record<string, number> = {};
  camPos: Vector2 = v2();
  camTarget: Vector2 = v2();

  constructor() {
    this.initPlayer();
  }

  private initPlayer() {
    const s = defaultStats();
    this.player = {
      pos: v2(0, 490),
      vel: v2(),
      radius: 18,
      hp: s.maxHp,
      shield: 0,
      stats: s,
      onGround: false,
      onWallLeft: false,
      onWallRight: false,
      wallRunTimer: 0,
      jumpsLeft: s.maxJumps,
      dashChargesLeft: s.maxDashCharges,
      dashCooldownLeft: 0,
      isDashing: false,
      dashTimer: 0,
      dashDir: v2(),
      grappleCooldownLeft: 0,
      invincibleTimer: 0,
      flashTimer: 0,
      facing: 1,
      runMomentum: 0,
      runDir: 0,
      shootTimer: 0,
    };
    this.camPos = v2_clone(this.player.pos);
  }

  update(dms: number, inp: Inputs) {
    if (this.isPaused || this.isGameOver || this.pendingLevelUp) return;
    const dt = clamp(dms / 16.667, 0.1, 4);
    this.time += dms;
    this.difficultyMul = 1 + this.time / 60000;
    this.updatePlayer(dt, dms, inp);
    this.updateEnemies(dt, dms);
    this.updateProjectiles(dt);
    this.updateParticles(dt);
    this.handlePlayerContact(dms);
    this.handleProjectileHits();
    this.spawnEnemies(dms);
    this.updateCombo(dms);
    this.screenShake = Math.max(0, this.screenShake - 1.5 * dt);
    this.regenPlayer(dms);
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    this.projectiles = this.projectiles.filter((p) => p.life > 0);
    this.particles = this.particles.filter((p) => p.life > 0);
    this.camTarget = v2_add(this.player.pos, v2_mul(this.player.vel, 8));
    this.camPos = v2_lerp(this.camPos, this.camTarget, 0.08 * dt);
  }

  applyUpgrade(id: string) {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return;
    def.apply(this.player.stats);
    this.upgradeCounts[id] = (this.upgradeCounts[id] ?? 0) + 1;
    if (id === 'shield')
      this.player.shield = Math.min(this.player.shield + 40, this.player.stats.shieldMax);
    if (id === 'hp_up') this.player.hp = Math.min(this.player.hp + 40, this.player.stats.maxHp);
    this.pendingLevelUp = false;
    this.upgradeOptions = [];
    this.player.dashChargesLeft = this.player.stats.maxDashCharges;
  }

  getUpgradeOptions(): UpgradeDef[] {
    return this.upgradeOptions;
  }

  getSnapshot(): GameSnapshot {
    const p = this.player;
    return {
      score: this.score,
      kills: this.kills,
      bossKills: this.bossKills,
      level: this.level,
      exp: this.exp,
      nextLevelExp: this.nextLevelExp,
      time: this.time,
      combo: this.combo,
      comboMul: this.comboMul,
      hp: p.hp,
      maxHp: p.stats.maxHp,
      shield: p.shield,
      shieldMax: p.stats.shieldMax,
      isGameOver: this.isGameOver,
      dashChargesLeft: p.dashChargesLeft,
      maxDashCharges: p.stats.maxDashCharges,
      grappleCooldownFrac: p.grappleCooldownLeft / p.stats.grappleCooldown,
      dashCooldownFrac: p.dashCooldownLeft / p.stats.dashCooldown,
      upgradeCounts: { ...this.upgradeCounts },
      isGrappling: this.isGrappling,
      grapplePoint: this.grapplePoint,
      playerPos: v2_clone(p.pos),
      playerOnGround: p.onGround,
      playerFacing: p.facing,
      playerVel: v2_clone(p.vel),
      playerDashing: p.isDashing,
      screenShake: this.screenShake,
    };
  }

  addShake(v: number) {
    this.screenShake = Math.min(this.screenShake + v, 30);
  }
  notify(txt: string) {
    this.notifications.push({ text: txt, timer: 2500 });
    if (this.notifications.length > 5) this.notifications.shift();
  }

  private updatePlayer(dt: number, dms: number, inp: Inputs) {
    const p = this.player;
    p.invincibleTimer = Math.max(0, p.invincibleTimer - dms);
    p.flashTimer = Math.max(0, p.flashTimer - dms);
    p.dashCooldownLeft = Math.max(0, p.dashCooldownLeft - dms);
    p.grappleCooldownLeft = Math.max(0, p.grappleCooldownLeft - dms);
    p.shootTimer = Math.max(0, p.shootTimer - dms);
    if (p.wallRunTimer > 0) p.wallRunTimer = Math.max(0, p.wallRunTimer - dms);

    if (p.isDashing) {
      p.dashTimer = Math.max(0, p.dashTimer - dms);
      p.vel = v2_mul(p.dashDir, p.stats.dashSpeed);
      if (p.dashTimer <= 0) {
        p.isDashing = false;
        p.vel = v2_mul(p.dashDir, p.stats.dashSpeed * 0.45);
      }
      if (Math.random() < 0.7)
        this.pt(
          v2_add(p.pos, v2(rnd(-5, 5), rnd(-5, 5))),
          v2_mul(p.dashDir, -rnd(1, 4)),
          rnd(3, 7),
          '#00f2ff',
          rnd(120, 220),
          0.1,
          true
        );
      if (p.stats.dashDamage)
        this.enemies.forEach((e) => {
          if (v2_dist(p.pos, e.pos) < p.radius + e.radius + 25)
            this.hitEnemy(e, p.stats.damage * 0.5, false);
        });
    } else {
      if (inp.dash && !inp.prev.dash && p.dashChargesLeft > 0 && p.dashCooldownLeft <= 0) {
        const dx = inp.left ? -1 : inp.right ? 1 : p.facing;
        const dy = inp.down ? 1 : inp.up && !p.onGround ? -0.5 : 0;
        p.dashDir = v2_norm(v2(dx, dy));
        if (v2_len(p.dashDir) < 0.01) p.dashDir = v2(p.facing, 0);
        p.isDashing = true;
        p.dashTimer = p.stats.dashDuration;
        p.dashChargesLeft--;
        p.dashCooldownLeft = p.stats.dashCooldown;
        p.invincibleTimer = p.stats.dashDuration + 60;
        this.addShake(4);
        for (let i = 0; i < 10; i++)
          this.pt(
            v2_clone(p.pos),
            v2(rnd(-6, 6), rnd(-6, 6)),
            rnd(3, 8),
            '#00f2ff',
            rnd(200, 350),
            0.05,
            true
          );
      }
      if (inp.grapple && !inp.prev.grapple && !this.isGrappling && p.grappleCooldownLeft <= 0) {
        let best: HookPoint | null = null,
          bestS = -Infinity;
        this.hookPoints.forEach((hp) => {
          const d = v2_dist(p.pos, hp.pos);
          if (d < p.stats.grappleRange) {
            const s = (p.pos.y - hp.pos.y) * 0.7 - d * 0.3;
            if (s > bestS) {
              bestS = s;
              best = hp;
            }
          }
        });
        if (best) {
          this.grapplePoint = v2_clone((best as HookPoint).pos);
          this.isGrappling = true;
          this.notify(i18n.t('notif.grapple'));
        }
      }
      if (!inp.grapple && this.isGrappling) {
        this.isGrappling = false;
        p.grappleCooldownLeft = p.stats.grappleCooldown;
        if (this.upgradeCounts['grapple_pull'] && this.grapplePoint) {
          if (v2_dist(p.pos, this.grapplePoint) < 80)
            this.enemies.forEach((e) => {
              if (v2_dist(p.pos, e.pos) < e.radius + 60) this.hitEnemy(e, 50, false);
            });
        }
        this.grapplePoint = null;
      }
      if (this.isGrappling && this.grapplePoint) {
        const toH = v2_sub(this.grapplePoint, p.pos),
          d = v2_len(toH);
        if (d < 20) {
          this.isGrappling = false;
          p.grappleCooldownLeft = p.stats.grappleCooldown * 0.4;
          this.grapplePoint = null;
        } else {
          p.vel = v2_add(p.vel, v2_mul(v2_norm(toH), p.stats.grapplePull * dt));
          if (Math.random() < 0.3)
            this.pt(
              v2_lerp(p.pos, this.grapplePoint, Math.random()),
              v2(rnd(-1, 1), rnd(-1, 1)),
              rnd(2, 5),
              '#00f2ff',
              rnd(100, 200),
              0,
              false
            );
        }
      }
      const sm = p.stats.speed;
      const ac = (p.onGround ? WALK_ACCEL : WALK_ACCEL * 0.52) * sm;
      if (inp.left) {
        p.vel.x -= ac * dt;
        p.facing = -1;
        if (p.runDir === 1) p.runMomentum = 0;
        p.runDir = -1;
        p.runMomentum = Math.min(1, p.runMomentum + 0.02 * dt);
      } else if (inp.right) {
        p.vel.x += ac * dt;
        p.facing = 1;
        if (p.runDir === -1) p.runMomentum = 0;
        p.runDir = 1;
        p.runMomentum = Math.min(1, p.runMomentum + 0.02 * dt);
      } else {
        p.runMomentum = Math.max(0, p.runMomentum - 0.05 * dt);
        p.runDir = 0;
      }
      const mb = 1 + p.runMomentum * 0.35;
      p.vel.x = clamp(p.vel.x, -MAX_SPEED * sm * mb, MAX_SPEED * sm * mb);
      if (inp.down) {
        if (p.onGround) p.vel.x += p.facing * SLIDE_ACCEL * dt * sm;
        else p.vel.y += 3.5 * dt;
      }
      if (inp.up && !inp.prev.up) {
        if (p.onGround) {
          p.vel.y = JUMP_VEL * dt;
          p.jumpsLeft = p.stats.maxJumps - 1;
          this.addShake(1.5);
        } else if (p.onWallLeft || p.onWallRight) {
          const dir = p.onWallLeft ? 1 : -1;
          p.vel.x = WALL_JUMP_X * dir * dt;
          p.vel.y = WALL_JUMP_Y * dt;
          p.jumpsLeft = p.stats.maxJumps - 1;
          this.addShake(2);
          p.onWallLeft = false;
          p.onWallRight = false;
          for (let i = 0; i < 8; i++)
            this.pt(
              v2_clone(p.pos),
              v2(dir * rnd(2, 6), rnd(-4, -1)),
              rnd(3, 6),
              '#00f2ff',
              rnd(200, 350),
              0.05,
              true
            );
        } else if (p.jumpsLeft > 0) {
          p.vel.y = DBL_JUMP_VEL * dt;
          p.jumpsLeft--;
          for (let i = 0; i < 10; i++)
            this.pt(
              v2_clone(p.pos),
              v2(rnd(-4, 4), rnd(1, 5)),
              rnd(3, 7),
              '#00f2ff',
              rnd(200, 300),
              0.08,
              true
            );
        }
      }
      p.vel.x *= Math.pow(p.onGround ? FRIC_GROUND : FRIC_AIR, dt);
    }
    if (!p.isDashing) {
      let grav = GRAVITY;
      if (
        (p.onWallLeft || p.onWallRight) &&
        !p.onGround &&
        p.vel.y > 0 &&
        (inp.left || inp.right)
      ) {
        grav = WALL_RUN_G;
        p.wallRunTimer = 400;
        if (Math.random() < 0.2)
          this.pt(
            v2_clone(p.pos),
            v2(p.onWallLeft ? 2 : -2, rnd(0, 2)),
            rnd(2, 5),
            '#00f2ff88',
            rnd(100, 200),
            0,
            false
          );
      }
      if (!this.isGrappling) p.vel.y += grav * dt;
    }
    p.pos = v2_add(p.pos, v2_mul(p.vel, dt));
    p.onGround = false;
    p.onWallLeft = false;
    p.onWallRight = false;
    for (const pl of this.platforms) {
      const { x: px, y: py } = p.pos,
        r = p.radius;
      const L = pl.x,
        R = pl.x + pl.w,
        T = pl.y,
        B = pl.y + pl.h;
      if (px + r > L && px - r < R && py + r > T && py - r < B) {
        const oT = py + r - T,
          oB = B - (py - r),
          oL = px + r - L,
          oR = R - (px - r);
        const m = Math.min(oT, oB, oL, oR);
        if (m === oT && p.vel.y >= 0) {
          p.pos.y = T - r;
          if (p.vel.y > 2) this.addShake(Math.min(p.vel.y * 0.4, 5));
          p.vel.y = 0;
          p.onGround = true;
          p.jumpsLeft = p.stats.maxJumps;
          if (p.dashCooldownLeft <= 0) p.dashChargesLeft = p.stats.maxDashCharges;
        } else if (m === oB && p.vel.y < 0) {
          p.pos.y = B + r;
          p.vel.y = 0;
        } else if (m === oL) {
          p.pos.x = L - r;
          p.vel.x = Math.min(0, p.vel.x);
          p.onWallRight = true;
        } else {
          p.pos.x = R + r;
          p.vel.x = Math.max(0, p.vel.x);
          p.onWallLeft = true;
        }
      }
    }
    if (p.pos.y > 900) this.gameOver('fell');
    if (p.shootTimer <= 0) {
      this.autoShoot();
      p.shootTimer = p.stats.fireInterval;
    }
  }

  private autoShoot() {
    const p = this.player;
    if (!this.enemies.length) return;
    const sorted = [...this.enemies].sort((a, b) => {
      const da = v2_dist(p.pos, a.pos),
        db = v2_dist(p.pos, b.pos);
      if (a.isBoss && !b.isBoss) return -1;
      if (b.isBoss && !a.isBoss) return 1;
      return da - db;
    });
    sorted.slice(0, p.stats.multiShot).forEach((tgt) => {
      const dir = v2_norm(v2_sub(tgt.pos, p.pos));
      const crit = Math.random() < p.stats.critChance;
      const dmg = Math.round(p.stats.damage * (crit ? p.stats.critMul : 1));
      this.projectiles.push({
        id: uid(),
        pos: v2_add(p.pos, v2_mul(dir, p.radius + 5)),
        vel: v2_mul(dir, 18),
        radius: crit ? 6 : 4,
        color: crit ? '#ffee00' : '#00f2ff',
        glowColor: crit ? '#ff8800' : '#00aaff',
        damage: dmg,
        life: 800,
        maxLife: 800,
        piercing: p.stats.piercing,
        explosive: p.stats.explosive,
        fromPlayer: true,
        pierceCount: 0,
        trail: [],
      });
      if (crit) this.notify(i18n.t('notif.critical'));
    });
  }

  private updateEnemies(dt: number, dms: number) {
    const p = this.player;
    for (const e of this.enemies) {
      e.flashTimer = Math.max(0, e.flashTimer - dms);
      e.stunTimer = Math.max(0, e.stunTimer - dms);
      e.attackCooldown = Math.max(0, e.attackCooldown - dms);
      e.behaviorTimer = Math.max(0, e.behaviorTimer - dms);
      if (e.stunTimer > 0) continue;
      if (e.kind !== 'FLYER') e.vel.y += GRAVITY * dt * 0.9;
      const dx = p.pos.x - e.pos.x,
        dist = v2_dist(p.pos, e.pos);
      switch (e.kind) {
        case 'RUNNER': {
          const d = Math.sign(dx);
          e.vel.x += d * e.speed * 0.15 * dt;
          e.vel.x = clamp(e.vel.x, -e.speed * dt, e.speed * dt);
          e.vel.x *= 0.9;
          break;
        }
        case 'TANK': {
          if (e.behaviorTimer <= 0) {
            e.vel.x = Math.sign(dx) * e.speed * 0.6 * dt;
            e.behaviorTimer = 200;
          }
          break;
        }
        case 'JUMPER': {
          if (e.onGround && e.behaviorTimer <= 0 && dist < 600) {
            const d2 = v2_norm(v2_sub(p.pos, e.pos));
            e.vel = v2_mul(d2, e.speed * 8);
            e.vel.y = Math.min(e.vel.y, -12 * dt);
            e.behaviorTimer = rnd(800, 1600);
          }
          e.vel.x *= 0.96;
          break;
        }
        case 'FLYER': {
          const tY = p.pos.y - 100,
            toT = v2_norm(v2_sub(v2(p.pos.x, tY), e.pos));
          e.vel = v2_add(e.vel, v2_mul(toT, e.speed * 0.08 * dt));
          e.vel = v2_mul(e.vel, Math.pow(0.95, dt));
          break;
        }
        case 'SNIPER': {
          if (dist < 300) e.vel.x -= Math.sign(dx) * e.speed * 0.08 * dt;
          else if (dist > 600) e.vel.x += Math.sign(dx) * e.speed * 0.04 * dt;
          e.vel.x = clamp(e.vel.x, -e.speed * 0.5, e.speed * 0.5);
          if (e.attackCooldown <= 0 && dist < 800) {
            this.fireEnemyShot(e);
            e.attackCooldown = rnd(2000, 3500);
          }
          break;
        }
        case 'ELITE': {
          const pred = v2_add(p.pos, v2_mul(p.vel, 20)),
            tP = v2_norm(v2_sub(pred, e.pos));
          e.vel.x += tP.x * e.speed * 0.12 * dt;
          e.vel.x = clamp(e.vel.x, -e.speed * dt, e.speed * dt);
          e.vel.x *= 0.92;
          if (e.onGround && p.pos.y < e.pos.y - 80 && e.behaviorTimer <= 0) {
            e.vel.y = -14 * dt;
            e.behaviorTimer = rnd(1200, 2000);
          }
          break;
        }
        case 'BOSS_TITAN': {
          this.updateBoss(e, p, dt);
          break;
        }
      }
      if (e.kind !== 'FLYER') {
        e.onGround = false;
        e.pos = v2_add(e.pos, v2_mul(e.vel, dt));
        for (const pl of this.platforms) {
          const { x: ex, y: ey } = e.pos,
            r = e.radius;
          if (ex + r > pl.x && ex - r < pl.x + pl.w && ey + r > pl.y && ey - r < pl.y + pl.h) {
            const oT = ey + r - pl.y,
              oB = pl.y + pl.h - (ey - r),
              oL = ex + r - pl.x,
              oR = pl.x + pl.w - (ex - r);
            const m = Math.min(oT, oB, oL, oR);
            if (m === oT && e.vel.y >= 0) {
              e.pos.y = pl.y - r;
              e.vel.y = 0;
              e.onGround = true;
            } else if (m === oB && e.vel.y < 0) {
              e.pos.y = pl.y + pl.h + r;
              e.vel.y = 0;
            } else if (m === oL) {
              e.pos.x = pl.x - r;
              e.vel.x = 0;
            } else {
              e.pos.x = pl.x + pl.w + r;
              e.vel.x = 0;
            }
          }
        }
        if (e.pos.y > 1000) e.hp = 0;
      } else e.pos = v2_add(e.pos, v2_mul(e.vel, dt));
    }
  }

  private updateBoss(e: Enemy, p: Player, dt: number) {
    const hf = e.hp / e.maxHp,
      ph = hf > 0.66 ? 1 : hf > 0.33 ? 2 : 3;
    if (ph !== e.phase) {
      e.phase = ph;
      this.addShake(15);
      this.notify(ph === 2 ? '⚠ BOSS ENRAGED' : '💀 BOSS FRENZY');
      for (let i = 0; i < 30; i++)
        this.pt(
          v2_clone(e.pos),
          v2(rnd(-8, 8), rnd(-8, 8)),
          rnd(5, 12),
          '#ff6600',
          rnd(400, 800),
          0.05,
          true
        );
    }
    const spd = e.speed * (1 + (3 - ph) * 0.35);
    e.vel.x += Math.sign(p.pos.x - e.pos.x) * spd * 0.1 * dt;
    e.vel.x = clamp(e.vel.x, -spd * dt * 1.5, spd * dt * 1.5);
    e.vel.x *= 0.88;
    if (e.onGround && p.pos.y < e.pos.y - 100 && e.behaviorTimer <= 0) {
      e.vel.y = -18 * dt;
      e.behaviorTimer = rnd(2000, 3500) / ph;
    }
    if (e.attackCooldown <= 0) {
      for (let i = 0; i < ph; i++) {
        const a = ((Math.PI * 2) / ph) * i;
        this.projectiles.push({
          id: uid(),
          pos: v2_clone(e.pos),
          vel: v2_mul(v2(Math.cos(a), Math.sin(a)), 6),
          radius: 7,
          color: '#ff6600',
          glowColor: '#ffaa00',
          damage: e.damage,
          life: 1200,
          maxLife: 1200,
          piercing: false,
          explosive: false,
          fromPlayer: false,
          pierceCount: 0,
          trail: [],
        });
      }
      e.attackCooldown = rnd(1500, 2800) / ph;
    }
  }

  private fireEnemyShot(e: Enemy) {
    const p = this.player,
      ttt = v2_dist(p.pos, e.pos) / 8;
    const pred = v2_add(p.pos, v2_mul(p.vel, ttt * 0.4));
    const dir = v2_norm(v2_sub(pred, e.pos));
    this.projectiles.push({
      id: uid(),
      pos: v2_add(e.pos, v2_mul(dir, e.radius + 5)),
      vel: v2_mul(dir, 7),
      radius: 5,
      color: '#44ff88',
      glowColor: '#00ff44',
      damage: e.damage,
      life: 1500,
      maxLife: 1500,
      piercing: false,
      explosive: false,
      fromPlayer: false,
      pierceCount: 0,
      trail: [],
    });
  }

  private updateProjectiles(dt: number) {
    for (const pr of this.projectiles) {
      if (pr.fromPlayer) {
        pr.trail.push(v2_clone(pr.pos));
        if (pr.trail.length > 8) pr.trail.shift();
      }
      pr.pos = v2_add(pr.pos, v2_mul(pr.vel, dt));
      pr.life -= 16.67 * dt;
    }
  }

  private updateParticles(dt: number) {
    for (const pt of this.particles) {
      pt.vel.y += pt.gravity * dt;
      pt.pos = v2_add(pt.pos, v2_mul(pt.vel, dt));
      pt.life -= 16.67 * dt;
      pt.radius = (pt.life / pt.maxLife) * pt.radius;
    }
  }

  private pt(
    pos: Vector2,
    vel: Vector2,
    r: number,
    color: string,
    life: number,
    gravity: number,
    glow: boolean
  ) {
    if (this.particles.length > 600) return;
    this.particles.push({ pos, vel, radius: r, color, life, maxLife: life, gravity, glow });
  }

  private handleProjectileHits() {
    for (const pr of this.projectiles) {
      if (!pr.fromPlayer || pr.life <= 0) continue;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        const hr = pr.explosive ? pr.radius + 35 : pr.radius;
        if (v2_dist(pr.pos, e.pos) < hr + e.radius) {
          this.hitEnemy(e, pr.damage, pr.explosive);
          e.vel = v2_add(e.vel, v2_mul(v2_norm(v2_sub(e.pos, pr.pos)), pr.damage * 0.04));
          e.stunTimer = Math.max(e.stunTimer, 60);
          if (!pr.piercing || pr.pierceCount >= 3) pr.life = 0;
          else pr.pierceCount++;
          break;
        }
      }
    }
    for (const pr of this.projectiles) {
      if (pr.fromPlayer || pr.life <= 0) continue;
      if (v2_dist(pr.pos, this.player.pos) < pr.radius + this.player.radius) {
        this.hurtPlayer(pr.damage);
        pr.life = 0;
      }
    }
  }

  private handlePlayerContact(dms: number) {
    const p = this.player;
    if (p.invincibleTimer > 0 || p.isDashing) return;
    for (const e of this.enemies) {
      if (v2_dist(p.pos, e.pos) < p.radius + e.radius) {
        this.hurtPlayer(e.damage * (dms / 1000) * 2);
        p.vel = v2_add(p.vel, v2_mul(v2_norm(v2_sub(p.pos, e.pos)), 2));
      }
    }
  }

  private hurtPlayer(amt: number) {
    const p = this.player;
    if (p.invincibleTimer > 0 || p.isDashing) return;
    let rem = amt;
    if (p.shield > 0) {
      const ab = Math.min(p.shield, rem);
      p.shield -= ab;
      rem -= ab;
    }
    if (rem > 0) {
      p.hp -= rem;
      p.flashTimer = 200;
      p.invincibleTimer = 400;
      this.addShake(6);
    }
    if (p.hp <= 0) {
      p.hp = 0;
      this.gameOver('eliminated');
    }
  }

  private hitEnemy(e: Enemy, amt: number, explosive: boolean) {
    e.hp -= amt;
    e.flashTimer = 120;
    this.addShake(explosive ? 6 : 2);
    for (let i = 0; i < (explosive ? 18 : 8); i++)
      this.pt(
        v2_clone(e.pos),
        v2(rnd(-5, 5), rnd(-6, -1)),
        rnd(2, 6),
        explosive ? '#ff6600' : '#ff4444',
        rnd(150, 350),
        0.12,
        true
      );
    if (e.hp <= 0) this.killEnemy(e);
  }

  private killEnemy(e: Enemy) {
    const cfg = ENEMY_CONFIGS[e.kind];
    for (let i = 0; i < (e.isBoss ? 60 : 20); i++) {
      const a = Math.random() * Math.PI * 2,
        spd = rnd(2, e.isBoss ? 14 : 8);
      this.pt(
        v2_clone(e.pos),
        v2(Math.cos(a) * spd, Math.sin(a) * spd - 2),
        rnd(3, e.isBoss ? 12 : 7),
        e.glowColor,
        rnd(300, e.isBoss ? 1200 : 600),
        0.08,
        true
      );
    }
    this.exp += Math.round(cfg.expReward * (1 + this.player.stats.expBonus));
    this.score += Math.round(cfg.scoreReward * this.comboMul * this.difficultyMul);
    this.kills++;
    if (e.isBoss) {
      this.bossKills++;
      this.addShake(25);
      this.notify('🏆 BOSS DEFEATED!');
    }
    if (this.player.stats.killHeal > 0)
      this.player.hp = Math.min(
        this.player.hp + this.player.stats.killHeal,
        this.player.stats.maxHp
      );
    this.combo++;
    this.comboTimer = 3000 / this.player.stats.comboDecayRate;
    this.comboMul = 1 + Math.log2(1 + this.combo) * 0.5;
    this.peakCombo = Math.max(this.peakCombo, this.combo);
    this.addShake(e.isBoss ? 20 : 3);
    this.checkLevelUp();
  }

  private checkLevelUp() {
    if (this.exp >= this.nextLevelExp) {
      this.exp -= this.nextLevelExp;
      this.level++;
      this.nextLevelExp = Math.round(this.nextLevelExp * 1.22 + 20);
      this.pendingLevelUp = true;
      this.upgradeOptions = this.pickOptions();
      this.addShake(10);
      this.notify(i18n.t('notif.level_up'));
    }
  }

  private pickOptions(): UpgradeDef[] {
    const elig = UPGRADES.filter((u) => (this.upgradeCounts[u.id] ?? 0) < u.maxStack);
    const shuf = [...elig].sort(() => Math.random() - 0.5);
    const out: UpgradeDef[] = [],
      cats = new Set<string>();
    for (const u of shuf) {
      if (out.length >= 3) break;
      if (!cats.has(u.category) || out.length >= 2) {
        out.push(u);
        cats.add(u.category);
      }
    }
    for (const u of shuf) {
      if (out.length >= 3) break;
      if (!out.includes(u)) out.push(u);
    }
    return out.slice(0, 3);
  }

  private spawnEnemies(dms: number) {
    this.enemySpawnTimer -= dms;
    this.bossTimer -= dms;
    const iv = Math.max(600, 2000 - this.time / 120) / this.difficultyMul;
    if (this.enemySpawnTimer <= 0) {
      this.spawnEnemy();
      this.enemySpawnTimer = iv;
    }
    if (this.bossTimer <= 0 && this.time > 60000 && this.bossKills < 6) {
      this.spawnBoss();
      this.bossTimer = 300000;
      this.notify(i18n.t('notif.boss_spawn'));
    } else if (this.bossTimer <= 0 && this.time <= 60000) {
      this.bossTimer = Math.max(1, 60000 - this.time);
    }
  }

  private kindForDifficulty(): EnemyKind {
    const t = this.time / 1000,
      r = Math.random();
    if (t < 60) return r < 0.7 ? 'RUNNER' : 'JUMPER';
    if (t < 180) return r < 0.4 ? 'RUNNER' : r < 0.65 ? 'JUMPER' : r < 0.82 ? 'TANK' : 'FLYER';
    if (t < 360)
      return r < 0.25
        ? 'RUNNER'
        : r < 0.45
          ? 'JUMPER'
          : r < 0.62
            ? 'TANK'
            : r < 0.76
              ? 'FLYER'
              : r < 0.89
                ? 'SNIPER'
                : 'ELITE';
    return r < 0.15
      ? 'RUNNER'
      : r < 0.3
        ? 'JUMPER'
        : r < 0.45
          ? 'TANK'
          : r < 0.6
            ? 'FLYER'
            : r < 0.75
              ? 'SNIPER'
              : 'ELITE';
  }

  private spawnEnemy() {
    const kind = this.kindForDifficulty(),
      cfg = ENEMY_CONFIGS[kind];
    const side = Math.random() > 0.5 ? 1 : -1,
      hm = 1 + (this.difficultyMul - 1) * 0.6;
    this.enemies.push({
      id: uid(),
      kind,
      pos: v2(this.player.pos.x + side * rnd(700, 1100), 490),
      vel: v2(),
      hp: Math.round(cfg.hp * hm),
      maxHp: Math.round(cfg.hp * hm),
      radius: cfg.radius,
      primaryColor: cfg.primaryColor,
      glowColor: cfg.glowColor,
      speed: cfg.speed * (0.9 + Math.random() * 0.3),
      damage: cfg.damage * (1 + (this.difficultyMul - 1) * 0.4),
      onGround: false,
      stunTimer: 0,
      attackCooldown: rnd(500, 1500),
      behaviorTimer: 0,
      isBoss: false,
      phase: 1,
      flashTimer: 0,
    });
  }

  private spawnBoss() {
    const cfg = ENEMY_CONFIGS['BOSS_TITAN'],
      hm = 1 + this.bossKills * 0.3;
    this.enemies.push({
      id: uid(),
      kind: 'BOSS_TITAN',
      pos: v2(this.player.pos.x + (Math.random() > 0.5 ? 900 : -900), 200),
      vel: v2(),
      hp: Math.round(cfg.hp * hm),
      maxHp: Math.round(cfg.hp * hm),
      radius: cfg.radius,
      primaryColor: cfg.primaryColor,
      glowColor: cfg.glowColor,
      speed: cfg.speed,
      damage: cfg.damage,
      onGround: false,
      stunTimer: 0,
      attackCooldown: 1000,
      behaviorTimer: 0,
      isBoss: true,
      phase: 1,
      flashTimer: 0,
    });
  }

  private updateCombo(dms: number) {
    if (this.comboTimer > 0) {
      this.comboTimer -= dms;
      if (this.comboTimer <= 0) {
        if (this.combo > 3) this.notify(i18n.t('notif.combo_break'));
        this.combo = 0;
        this.comboMul = 1;
      }
    }
  }

  private regenPlayer(dms: number) {
    const p = this.player;
    if (p.stats.hpRegen > 0) p.hp = Math.min(p.hp + p.stats.hpRegen * (dms / 1000), p.stats.maxHp);
    if (p.stats.shieldMax > 0 && p.shield < p.stats.shieldMax)
      p.shield = Math.min(p.shield + 5 * (dms / 1000), p.stats.shieldMax);
  }

  private gameOver(reason: string) {
    this.isGameOver = true;
    this.gameOverReason = reason;
    this.addShake(30);
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2;
      this.pt(
        v2_clone(this.player.pos),
        v2(Math.cos(a) * rnd(3, 12), Math.sin(a) * rnd(3, 12) - 3),
        rnd(4, 12),
        '#00f2ff',
        rnd(500, 1500),
        0.06,
        true
      );
    }
  }
}
