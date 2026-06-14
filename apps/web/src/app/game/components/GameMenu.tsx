'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Trophy, Play, Settings, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { i18n, type LangCode } from '../engine/i18n';

interface Props {
  codename: string;
  setCodename: (v: string) => void;
  handleRegister: () => Promise<void> | void;
  leaderboard: any[];
  onOpenSettings: () => void;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];

export default function GameMenu({
  codename,
  setCodename,
  handleRegister,
  leaderboard,
  onOpenSettings,
}: Props) {
  const [, tick] = useState(0);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'play' | 'board' | 'controls'>('play');

  useEffect(() => i18n.subscribe(() => tick((n) => n + 1)), []);
  const t = (k: string) => i18n.t(k);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^A-Za-z0-9_]/g, '').slice(0, 20);
    setCodename(v);
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleStart();
  };

  const handleStart = useCallback(async () => {
    if (codename.length < 3) {
      setError(i18n.t('err.codename_short'));
      return;
    }
    if (codename.length > 20) {
      setError(i18n.t('err.codename_long'));
      return;
    }
    setChecking(true);
    setError('');
    try {
      await handleRegister();
    } catch {
      setError(i18n.t('err.connection'));
    } finally {
      setChecking(false);
    }
  }, [codename, handleRegister]);

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#00f2ff 1px,transparent 1px),linear-gradient(90deg,#00f2ff 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Language selector (top right) */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-30">
        <select
          value={i18n.lang}
          onChange={(e) => i18n.setLang(e.target.value as LangCode)}
          className="bg-[#0a0a1a] border border-[#00f2ff33] text-[#00f2ff88] text-xs rounded px-2 py-1 font-mono cursor-pointer focus:outline-none focus:border-[#00f2ff]"
        >
          {i18n.allLangs.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <button
          onClick={onOpenSettings}
          className="p-1.5 border border-[#ffffff22] rounded text-[#ffffff44] hover:text-[#00f2ff] hover:border-[#00f2ff44] transition-colors"
        >
          <Settings size={14} />
        </button>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1
          className="text-6xl md:text-8xl font-black tracking-tighter italic mb-2"
          style={{ textShadow: '0 0 40px #00f2ff44' }}
        >
          NEXUS:
          <span className="text-[#00f2ff]" style={{ textShadow: '0 0 40px #00f2ff' }}>
            SURVIVE
          </span>
        </h1>
        <p className="text-[#ffffff44] font-mono tracking-[0.4em] uppercase text-xs">
          {t('menu.subtitle')}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border border-[#ffffff15] rounded p-0.5 bg-[#0a0a1a]">
        {(['play', 'board', 'controls'] as const).map((tab_) => {
          const tabLabel =
            tab_ === 'play'
              ? t('menu.start')
              : tab_ === 'board'
                ? t('menu.leaderboard')
                : t('menu.controls');
          return (
            <button
              key={tab_}
              onClick={() => setTab(tab_)}
              className={`px-4 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all ${
                tab === tab_
                  ? 'bg-[#00f2ff22] text-[#00f2ff]'
                  : 'text-[#ffffff44] hover:text-[#ffffff88]'
              }`}
            >
              {tabLabel}
            </button>
          );
        })}
      </div>

      <div className="w-full max-w-3xl">
        {/* ── PLAY TAB ── */}
        {tab === 'play' && (
          <div className="bg-[#0a0a1a] border border-[#00f2ff22] rounded-xl p-8 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-6">
              <Play size={18} className="text-[#00f2ff]" />
              <span className="text-[#00f2ff] font-mono text-sm uppercase tracking-wider">
                {t('menu.codename')}
              </span>
            </div>

            <Input
              value={codename}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={t('menu.codename_ph')}
              maxLength={20}
              className="bg-black border-[#00f2ff33] focus:border-[#00f2ff] text-[#00f2ff] font-mono h-12 text-base mb-2"
              style={{ caretColor: '#00f2ff' }}
            />

            {error && <p className="text-red-400 text-xs font-mono mb-3">{error}</p>}

            <div className="flex items-center justify-between mb-4">
              <span className="text-[#ffffff33] text-xs font-mono">{codename.length}/20</span>
              {codename.length >= 3 && codename.length <= 20 && (
                <span className="text-[#00f2ff55] text-xs font-mono">✓ Valid</span>
              )}
            </div>

            <Button
              onClick={handleStart}
              disabled={checking || codename.length < 3}
              className="w-full h-12 font-black text-base bg-[#00f2ff] hover:bg-[#00d4df] text-black disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ boxShadow: '0 0 20px #00f2ff44' }}
            >
              {checking ? t('menu.checking') : t('menu.start')}
            </Button>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                { icon: '⚡', label: 'Movement System' },
                { icon: '🔗', label: 'Grapple Physics' },
                { icon: '🎯', label: 'Auto Combat' },
              ].map(({ icon, label }) => (
                <div key={label} className="border border-[#ffffff0a] rounded p-2">
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-[9px] text-[#ffffff33] uppercase">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {tab === 'board' && (
          <div className="bg-[#0a0a1a] border border-[#00f2ff22] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-[#00f2ff15]">
              <Trophy size={16} className="text-[#00f2ff]" />
              <span className="text-[#00f2ff] font-mono text-sm uppercase tracking-wider">
                {t('menu.top100')}
              </span>
            </div>
            <div className="overflow-y-auto max-h-[55vh]">
              {leaderboard.length === 0 ? (
                <div className="text-center text-[#ffffff33] font-mono text-sm py-16">
                  {t('menu.no_scores')}
                </div>
              ) : (
                <table className="w-full font-mono text-sm">
                  <thead className="sticky top-0 bg-[#0a0a1a] border-b border-[#ffffff0a]">
                    <tr className="text-[#ffffff33] text-[9px] uppercase">
                      <th className="px-4 py-2 text-left">{t('menu.rank')}</th>
                      <th className="px-4 py-2 text-left">{t('menu.operator')}</th>
                      <th className="px-4 py-2 text-right">{t('menu.score')}</th>
                      <th className="px-4 py-2 text-right hidden md:table-cell">
                        {t('menu.kills')}
                      </th>
                      <th className="px-4 py-2 text-right hidden md:table-cell">
                        {t('menu.time')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((e: any, i: number) => (
                      <tr
                        key={i}
                        className="border-b border-[#ffffff06] hover:bg-[#00f2ff08] transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <span
                            className="font-black"
                            style={{ color: RANK_COLORS[i] ?? '#ffffff44' }}
                          >
                            #{i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-bold text-white">{e.codename}</td>
                        <td className="px-4 py-2.5 text-right text-[#00f2ff] font-black">
                          {Number(e.score).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[#ffffff55] hidden md:table-cell">
                          {e.kills}
                        </td>
                        <td className="px-4 py-2.5 text-right text-[#ffffff55] hidden md:table-cell">
                          {formatTime(e.time_survived * 1000)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── CONTROLS TAB ── */}
        {tab === 'controls' && (
          <div className="bg-[#0a0a1a] border border-[#00f2ff22] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Keyboard size={16} className="text-[#00f2ff]" />
              <span className="text-[#00f2ff] font-mono text-sm uppercase tracking-wider">
                {t('menu.controls')}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                ['A / D', t('menu.ctrl_move')],
                ['W', t('menu.ctrl_jump')],
                ['S', t('menu.ctrl_slide')],
                ['SPACE', t('menu.ctrl_dash')],
                ['Q', t('menu.ctrl_grapple')],
                ['ESC', t('menu.ctrl_pause')],
              ].map(([key, action]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-2.5 border border-[#ffffff08] rounded"
                >
                  <kbd className="px-2 py-0.5 bg-[#00f2ff15] border border-[#00f2ff44] rounded text-[#00f2ff] font-mono text-xs min-w-[52px] text-center">
                    {key}
                  </kbd>
                  <span className="text-[#ffffff88] text-xs">{action}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 border border-[#ffffff08] rounded bg-[#ffffff04]">
              <p className="text-[#ffffff44] text-xs font-mono leading-relaxed">
                💡 Chain GRAPPLE → DASH → WALL JUMP to build massive Combo multipliers and reach the
                Endgame power level.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
