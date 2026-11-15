'use client';

import { Code2 } from 'lucide-react';
import type { LearningMode } from '@/lib/types';

interface HeaderBarProps {
  activeMode: LearningMode;
  onSelectMode: (mode: LearningMode) => void;
  onOpenPromptInspector: () => void;
}

const NAV_MODES: Array<{ id: LearningMode; label: string }> = [
  { id: 'flashcards', label: 'Kelime Kartları' },
  { id: 'grammar', label: 'Dil Bilgisi & Kalıplar' },
  { id: 'quiz', label: 'Alıştırma Testi' },
  { id: 'tutor', label: 'AI İngilizce Öğretmeni' },
];

export default function HeaderBar({
  activeMode,
  onSelectMode,
  onOpenPromptInspector,
}: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectMode('flashcards')}
          className="font-display text-xl font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0284C7]"
        >
          DilKöprüsü
        </button>

        {/* Zone 2: 4 Single-line Mode Links */}
        <nav
          aria-label="Öğrenme modları"
          className="hidden lg:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_MODES.map((mode) => {
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onSelectMode(mode.id)}
                className={`relative py-1.5 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0284C7] ${
                  isActive
                    ? 'text-[#0284C7] font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[15px] h-0.5 bg-[#0284C7]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenPromptInspector}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7]"
          >
            <Code2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>AI Studio Prompt</span>
          </button>
        </div>
      </div>

      {/* Responsive compact mode bar for mobile/tablet (< lg) */}
      <nav
        aria-label="Mobil öğrenme modları"
        className="flex lg:hidden items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 sm:px-6"
      >
        {NAV_MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-[#0284C7] text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {mode.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
