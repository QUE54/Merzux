'use client';
import React, { useEffect, useState } from 'react';
import { i18n } from '../engine/i18n';
import type { UpgradeDef } from '../engine/types';

interface Props {
  level: number;
  options: UpgradeDef[];
  onSelect: (id: string) => void;
}

const CAT_BG: Record<string, string> = {
  MOBILITY: 'border-[#00f2ff44] hover:border-[#00f2ff] hover:bg-[#00f2ff08]',
  OFFENSIVE: 'border-[#ff440044] hover:border-[#ff4400] hover:bg-[#ff440008]',
  DEFENSIVE: 'border-[#4488ff44] hover:border-[#4488ff] hover:bg-[#4488ff08]',
  SPECIAL: 'border-[#aa44ff44] hover:border-[#aa44ff] hover:bg-[#aa44ff08]',
};
const CAT_GLOW: Record<string, string> = {
  MOBILITY: '#00f2ff',
  OFFENSIVE: '#ff4400',
  DEFENSIVE: '#4488ff',
  SPECIAL: '#aa44ff',
};
const CAT_TEXT: Record<string, string> = {
  MOBILITY: 'text-[#00f2ff]',
  OFFENSIVE: 'text-[#ff6644]',
  DEFENSIVE: 'text-[#4488ff]',
  SPECIAL: 'text-[#aa44ff]',
};

export default function LevelUpOverlay({ level, options, onSelect }: Props) {
  const [, tick] = useState(0);
  useEffect(() => i18n.subscribe(() => tick((n) => n + 1)), []);
  const t = (k: string) => i18n.t(k);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-[10px] text-[#ffffff33] font-mono uppercase tracking-[0.5em] mb-2">
          {t('hud.level')} {level}
        </div>
        <h2
          className="text-4xl md:text-5xl font-black italic text-white"
          style={{
            textShadow: '0 0 40px #00f2ffaa',
            animation: 'lvlPulse 1s ease-in-out infinite alternate',
          }}
        >
          {t('levelup.title')}
        </h2>
        <p className="text-[#ffffff55] font-mono text-sm mt-2 tracking-wide">{t('levelup.pick')}</p>
      </div>

      {/* Upgrade cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
        {options.map((upg, i) => {
          const color = CAT_GLOW[upg.category];
          const animDelay = `${i * 0.08}s`;
          return (
            <button
              key={upg.id}
              onClick={() => onSelect(upg.id)}
              className={`group relative bg-[#0a0a1a] border rounded-xl p-6 text-left transition-all duration-200 ${CAT_BG[upg.category]}`}
              style={{ animation: `cardSlide 0.35s ease-out ${animDelay} both` }}
            >
              {/* Glow on hover */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ boxShadow: `inset 0 0 30px ${color}18` }}
              />

              {/* Icon + Category */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{upg.icon}</span>
                <span
                  className={`text-[9px] font-mono uppercase tracking-widest font-bold ${CAT_TEXT[upg.category]}`}
                >
                  {t(`cat.${upg.category}`)}
                </span>
              </div>

              {/* Name */}
              <div
                className={`text-lg font-black mb-2 ${CAT_TEXT[upg.category]}`}
                style={{ textShadow: `0 0 12px ${color}55` }}
              >
                {t(upg.nameKey)}
              </div>

              {/* Description */}
              <p className="text-[#ffffff66] text-xs leading-relaxed mb-4">{t(upg.descKey)}</p>

              {/* Select button */}
              <div
                className={`text-[10px] font-mono uppercase tracking-wider font-bold ${CAT_TEXT[upg.category]} opacity-60 group-hover:opacity-100 transition-opacity`}
              >
                [ {t('levelup.select')} ]
              </div>
            </button>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes lvlPulse {
          from {
            text-shadow: 0 0 20px #00f2ffaa;
          }
          to {
            text-shadow: 0 0 60px #00f2ff;
          }
        }
        @keyframes cardSlide {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
