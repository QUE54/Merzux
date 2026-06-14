'use client';
import React, { useEffect, useState } from 'react';
import { i18n } from '../engine/i18n';
import type { GameSnapshot } from '../engine/types';

interface Props {
  codename: string;
  snap: GameSnapshot;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function GameHUD({ codename, snap }: Props) {
  const [, tick] = useState(0);
  useEffect(() => i18n.subscribe(() => tick((n) => n + 1)), []);
  const t = (k: string) => i18n.t(k);

  const hpFrac = snap.maxHp > 0 ? Math.max(0, snap.hp / snap.maxHp) : 0;
  const expFrac = snap.nextLevelExp > 0 ? snap.exp / snap.nextLevelExp : 0;
  const shFrac = snap.shieldMax > 0 ? snap.shield / snap.shieldMax : 0;
  const hpColor = hpFrac > 0.5 ? '#00f2ff' : hpFrac > 0.25 ? '#ffaa00' : '#ff3333';
  const comboVisible = snap.combo >= 2;
  const comboColor = snap.comboMul >= 5 ? '#ff1166' : snap.comboMul >= 3 ? '#ff8800' : '#ffee00';

  return (
    <div className="fixed inset-0 pointer-events-none z-20 font-mono select-none">
      {/* ── TOP LEFT: Operator info ── */}
      <div className="absolute top-4 left-4 flex flex-col gap-0.5">
        <span className="text-[9px] text-[#00f2ff66] uppercase tracking-[0.3em]">
          {t('hud.level')} {snap.level}
        </span>
        <span
          className="text-sm font-bold text-[#00f2ff] tracking-wide truncate max-w-[180px]"
          style={{ textShadow: '0 0 12px #00f2ffaa' }}
        >
          {codename}
        </span>
        <span className="text-[10px] text-[#ffffff55]">
          {t('hud.time')} {formatTime(snap.time)}
        </span>

        {/* HP bar */}
        <div className="mt-1.5 w-44">
          <div className="flex justify-between mb-0.5">
            <span className="text-[8px] text-[#ffffff44] uppercase">{t('hud.hp')}</span>
            <span className="text-[8px] text-white">
              {Math.ceil(snap.hp)}/{snap.maxHp}
            </span>
          </div>
          <div className="h-2 bg-[#ffffff10] rounded-full overflow-hidden border border-[#ffffff15]">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${hpFrac * 100}%`,
                background: hpColor,
                boxShadow: `0 0 8px ${hpColor}88`,
              }}
            />
          </div>
        </div>

        {/* Shield bar */}
        {snap.shieldMax > 0 && (
          <div className="w-44">
            <div className="flex justify-between mb-0.5">
              <span className="text-[8px] text-[#4488ff88] uppercase">{t('hud.shield')}</span>
              <span className="text-[8px] text-[#4488ff]">{Math.ceil(snap.shield)}</span>
            </div>
            <div className="h-1.5 bg-[#ffffff10] rounded-full overflow-hidden border border-[#4488ff22]">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${shFrac * 100}%`,
                  background: '#4488ff',
                  boxShadow: '0 0 6px #4488ffaa',
                }}
              />
            </div>
          </div>
        )}

        {/* EXP bar */}
        <div className="w-44">
          <div className="flex justify-between mb-0.5">
            <span className="text-[8px] text-[#aa44ff88] uppercase">EXP</span>
            <span className="text-[8px] text-[#aa44ff88]">
              {snap.exp}/{snap.nextLevelExp}
            </span>
          </div>
          <div className="h-1 bg-[#ffffff08] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${expFrac * 100}%`,
                background: 'linear-gradient(90deg,#aa44ff,#ff44ff)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── TOP RIGHT: Score ── */}
      <div className="absolute top-4 right-4 text-right">
        <span className="text-[9px] text-[#ffffff33] uppercase tracking-widest block">
          {t('hud.score')}
        </span>
        <span
          className="text-2xl font-black text-white block"
          style={{ textShadow: '0 0 16px #00f2ff' }}
        >
          {snap.score.toLocaleString()}
        </span>
        <span className="text-[10px] text-[#ffffff55]">
          {t('hud.kills')} <span className="text-white font-bold">{snap.kills}</span>
          {snap.bossKills > 0 && <span className="text-[#ff6600] ml-1">⚡{snap.bossKills}</span>}
        </span>
      </div>

      {/* ── BOTTOM LEFT: Cooldowns ── */}
      <div className="absolute bottom-5 left-4 flex items-end gap-3">
        {/* Dash charges */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] text-[#ffffff44] uppercase">{t('hud.dash')}</span>
          <div className="flex gap-1">
            {Array.from({ length: snap.maxDashCharges }).map((_, i) => {
              const active = i < snap.dashChargesLeft;
              return (
                <div
                  key={i}
                  className="w-4 h-4 rounded-sm border transition-all duration-150"
                  style={{
                    borderColor: active ? '#00f2ff' : '#ffffff22',
                    background: active ? '#00f2ff44' : 'transparent',
                    boxShadow: active ? '0 0 6px #00f2ff88' : 'none',
                  }}
                />
              );
            })}
          </div>
          {snap.dashCooldownFrac > 0.01 && (
            <div className="w-10 h-0.5 bg-[#ffffff15] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00f2ff] rounded-full transition-all"
                style={{ width: `${(1 - snap.dashCooldownFrac) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Grapple */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] text-[#ffffff44] uppercase">{t('hud.grapple')}</span>
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-base border transition-all"
            style={{
              borderColor: snap.grappleCooldownFrac < 0.05 ? '#00f2ff' : '#ffffff22',
              background: snap.isGrappling
                ? '#00f2ff55'
                : snap.grappleCooldownFrac < 0.05
                  ? '#00f2ff22'
                  : 'transparent',
              boxShadow: snap.grappleCooldownFrac < 0.05 ? '0 0 10px #00f2ffaa' : 'none',
            }}
          >
            🔗
          </div>
          {snap.grappleCooldownFrac > 0.05 && (
            <div className="w-8 h-0.5 bg-[#ffffff15] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00f2ff] rounded-full"
                style={{ width: `${(1 - snap.grappleCooldownFrac) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM CENTER: Combo ── */}
      {comboVisible && (
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center"
          style={{ animation: 'comboAnim 0.5s ease-in-out infinite alternate' }}
        >
          <div
            className="text-[9px] uppercase tracking-widest"
            style={{ color: comboColor + '88' }}
          >
            {t('hud.combo')}
          </div>
          <div
            className="text-3xl font-black leading-none"
            style={{ color: comboColor, textShadow: `0 0 24px ${comboColor}` }}
          >
            ×{snap.comboMul.toFixed(1)}
          </div>
          <div className="text-[9px]" style={{ color: comboColor + '99' }}>
            {snap.combo} KILLS
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes comboAnim {
          from {
            transform: translateX(-50%) scale(1);
            filter: drop-shadow(0 0 8px currentColor);
          }
          to {
            transform: translateX(-50%) scale(1.06);
            filter: drop-shadow(0 0 20px currentColor);
          }
        }
      `}</style>
    </div>
  );
}
