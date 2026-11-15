'use client';

import { CEFR_LEVELS } from '@/lib/curriculum';
import type { CefrLevel } from '@/lib/types';

interface LevelSwitcherBarProps {
  activeLevel: CefrLevel;
  onSelectLevel: (level: CefrLevel) => void;
  masteredCount: number;
  totalCardsCount: number;
}

export default function LevelSwitcherBar({
  activeLevel,
  onSelectLevel,
  masteredCount,
  totalCardsCount,
}: LevelSwitcherBarProps) {
  const currentMeta = CEFR_LEVELS.find((item) => item.level === activeLevel) ?? CEFR_LEVELS[0];

  return (
    <section
      aria-label="CEFR Seviye Seçimi"
      className="border-b border-slate-200 bg-white"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">CEFR Düzeyi</span>
            <span aria-hidden="true">·</span>
            <span>{currentMeta.level} {currentMeta.labelTr}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {masteredCount}/{totalCardsCount} kelime öğrenildi
            </span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-[26px] text-balance">
            {currentMeta.level} — {currentMeta.shortDescTr}
          </h1>
          <p className="text-sm text-slate-600">
            Odak: {currentMeta.focusTr}
          </p>
        </div>

        {/* Interactive Segmented Control for A1, A2, B1, B2 */}
        <div
          role="tablist"
          aria-label="CEFR Seviyeleri"
          className="inline-flex items-center gap-1 self-start rounded-lg border border-slate-200 bg-slate-100 p-1 lg:self-auto"
        >
          {CEFR_LEVELS.map((item) => {
            const isActive = item.level === activeLevel;
            return (
              <button
                key={item.level}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectLevel(item.level)}
                className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7] ${
                  isActive
                    ? 'bg-white text-[#0284C7] shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="font-mono font-semibold">{item.level}</span>
                <span className="hidden sm:inline">{item.labelTr}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
