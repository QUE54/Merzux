'use client';
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { i18n, type LangCode } from '../engine/i18n';

export interface Settings {
  language: LangCode;
  screenShake: boolean;
  motionBlur: boolean;
  particleQuality: 'low' | 'medium' | 'high';
  masterVolume: number;
  sfxVolume: number;
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  screenShake: true,
  motionBlur: false,
  particleQuality: 'high',
  masterVolume: 80,
  sfxVolume: 80,
};

export function loadSettings(): Settings {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem('nexus_settings');
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings) {
  if (typeof localStorage !== 'undefined')
    localStorage.setItem('nexus_settings', JSON.stringify(s));
}

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  onClose: () => void;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-10 h-5 rounded-full transition-all duration-200 ${on ? 'bg-[#00f2ff]' : 'bg-[#ffffff22]'}`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${on ? 'left-5' : 'left-0.5'}`}
      />
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#ffffff08]">
      <span className="text-xs text-[#ffffff88] font-mono uppercase tracking-wide">{label}</span>
      {children}
    </div>
  );
}

export default function SettingsOverlay({ settings, onChange, onClose }: Props) {
  const [, tick] = useState(0);
  useEffect(() => i18n.subscribe(() => tick((n) => n + 1)), []);
  const t = (k: string) => i18n.t(k);

  const set = <K extends keyof Settings>(key: K, val: Settings[K]) => {
    const next = { ...settings, [key]: val };
    onChange(next);
    saveSettings(next);
  };

  const handleLang = (lang: LangCode) => {
    set('language', lang);
    i18n.setLang(lang);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)' }}
    >
      <div className="bg-[#0a0a1a] border border-[#00f2ff22] rounded-2xl w-full max-w-md p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-[#00f2ff] uppercase tracking-widest font-mono">
            {t('settings.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-[#ffffff44] hover:text-[#00f2ff] transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Language */}
        <Row label={t('settings.language')}>
          <select
            value={settings.language}
            onChange={(e) => handleLang(e.target.value as LangCode)}
            className="bg-[#000] border border-[#00f2ff33] text-[#00f2ff88] text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-[#00f2ff]"
          >
            {i18n.allLangs.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </Row>

        {/* Screen shake */}
        <Row label={t('settings.screenshake')}>
          <Toggle
            on={settings.screenShake}
            onToggle={() => set('screenShake', !settings.screenShake)}
          />
        </Row>

        {/* Motion Blur */}
        <Row label={t('settings.motionblur')}>
          <Toggle
            on={settings.motionBlur}
            onToggle={() => set('motionBlur', !settings.motionBlur)}
          />
        </Row>

        {/* Particle quality */}
        <Row label={t('settings.particles')}>
          <div className="flex gap-1">
            {(['low', 'medium', 'high'] as const).map((q) => (
              <button
                key={q}
                onClick={() => set('particleQuality', q)}
                className={`px-2.5 py-1 rounded text-[9px] font-mono uppercase border transition-all ${
                  settings.particleQuality === q
                    ? 'border-[#00f2ff] bg-[#00f2ff22] text-[#00f2ff]'
                    : 'border-[#ffffff15] text-[#ffffff44] hover:border-[#ffffff33]'
                }`}
              >
                {t(`settings.${q}`)}
              </button>
            ))}
          </div>
        </Row>

        {/* Master volume */}
        <Row label={t('settings.audio')}>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={settings.masterVolume}
              onChange={(e) => set('masterVolume', Number(e.target.value))}
              className="w-24 accent-[#00f2ff]"
            />
            <span className="text-xs text-[#00f2ff88] font-mono w-8 text-right">
              {settings.masterVolume}
            </span>
          </div>
        </Row>

        {/* SFX volume */}
        <Row label={t('settings.sfx')}>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={settings.sfxVolume}
              onChange={(e) => set('sfxVolume', Number(e.target.value))}
              className="w-24 accent-[#00f2ff]"
            />
            <span className="text-xs text-[#00f2ff88] font-mono w-8 text-right">
              {settings.sfxVolume}
            </span>
          </div>
        </Row>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 border border-[#00f2ff44] text-[#00f2ff] font-mono text-xs uppercase tracking-widest hover:bg-[#00f2ff15] transition-colors rounded"
        >
          {t('settings.close')}
        </button>
      </div>
    </div>
  );
}
