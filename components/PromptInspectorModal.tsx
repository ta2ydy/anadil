'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Code2 } from 'lucide-react';
import { getActivePromptBundle } from '@/lib/prompts';
import type { CefrLevel, LearningMode, TutorPracticeStyle } from '@/lib/types';

interface PromptInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLevel: CefrLevel;
  activeMode: LearningMode;
  tutorStyle: TutorPracticeStyle;
  activeGrammarTopicEn?: string;
  livePromptOverride?: {
    systemInstruction: string;
    taskPrompt: string;
  } | null;
}

const MODE_OPTIONS: Array<{ id: LearningMode; labelTr: string }> = [
  { id: 'flashcards', labelTr: 'Kelime Kartları' },
  { id: 'grammar', labelTr: 'Dil Bilgisi & Kalıplar' },
  { id: 'quiz', labelTr: 'Alıştırma Testi' },
  { id: 'tutor', labelTr: 'AI İngilizce Öğretmeni' },
];

function PromptInspectorDialogBody({
  onClose,
  activeLevel,
  activeMode,
  tutorStyle,
  activeGrammarTopicEn,
  livePromptOverride,
}: Omit<PromptInspectorModalProps, 'isOpen'>) {
  const [inspectMode, setInspectMode] = useState<LearningMode>(activeMode);
  const [inspectLevel, setInspectLevel] = useState<CefrLevel>(activeLevel);
  const [copiedField, setCopiedField] = useState<'system' | 'task' | 'all' | null>(null);

  const bundle = getActivePromptBundle(inspectLevel, inspectMode, {
    tutorStyle,
    grammarTopicEn: activeGrammarTopicEn,
  });

  const isViewingExactLiveSession =
    livePromptOverride && inspectMode === activeMode && inspectLevel === activeLevel;

  const displayedSystem = isViewingExactLiveSession
    ? livePromptOverride.systemInstruction
    : bundle.systemInstruction;

  const displayedTask = isViewingExactLiveSession
    ? livePromptOverride.taskPrompt
    : bundle.taskPrompt;

  async function handleCopy(text: string, field: 'system' | 'task' | 'all') {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback ignored if clipboard permissions are blocked
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 8 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
    >
      {/* Modal Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Code2 className="h-3.5 w-3.5 text-[#0284C7]" aria-hidden="true" />
            <span>Google AI Studio Prompt Denetleyicisi</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{bundle.model}</span>
          </div>
          <h2
            id="prompt-inspector-title"
            className="mt-1 font-display text-xl font-semibold text-slate-900"
          >
            Aktif İngilizce System Instruction &amp; Görev İstemi
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
        <div className="flex flex-wrap items-center gap-1">
          {MODE_OPTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setInspectMode(m.id)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                inspectMode === m.id
                  ? 'bg-white text-[#0284C7] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m.labelTr}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5">
          {(['A1', 'A2', 'B1', 'B2'] as CefrLevel[]).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setInspectLevel(lvl)}
              className={`rounded px-2 py-1 font-mono text-xs font-medium transition-colors ${
                inspectLevel === lvl
                  ? 'bg-[#0284C7] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Content */}
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <p className="text-sm text-slate-600">
          Arayüz tamamen Türkçe sunulurken, Gemini API çağrıları Google AI Studio için İngilizce{' '}
          <span className="font-mono text-xs text-slate-800">systemInstruction</span> ve görev
          istemleriyle çalıştırılır. Aşağıdan aktif istemi inceleyebilir veya kopyalayabilirsiniz.
        </p>

        {/* System Instruction Block */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              1. systemInstruction (English)
            </span>
            <button
              type="button"
              onClick={() => handleCopy(displayedSystem, 'system')}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {copiedField === 'system' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#059669]" aria-hidden="true" />
                  <span className="text-[#059669]">Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>System Instruction Kopyala</span>
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">
            {displayedSystem}
          </pre>
        </div>

        {/* Task Prompt Block */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              2. Task Prompt / Template (English)
            </span>
            <button
              type="button"
              onClick={() => handleCopy(displayedTask, 'task')}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {copiedField === 'task' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#059669]" aria-hidden="true" />
                  <span className="text-[#059669]">Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Task Prompt Kopyala</span>
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100">
            {displayedTask}
          </pre>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
        <button
          type="button"
          onClick={() =>
            handleCopy(
              `SYSTEM INSTRUCTION:\n${displayedSystem}\n\nTASK PROMPT:\n${displayedTask}`,
              'all'
            )
          }
          className="inline-flex items-center gap-2 rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0369A1]"
        >
          {copiedField === 'all' ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>Tüm İstem Kopyalandı</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden="true" />
              <span>Tümünü Kopyala</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
        >
          Kapat
        </button>
      </div>
    </motion.div>
  );
}

export default function PromptInspectorModal(props: PromptInspectorModalProps) {
  return (
    <AnimatePresence>
      {props.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="prompt-inspector-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={props.onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px]"
          />
          <PromptInspectorDialogBody
            key={`${props.activeMode}-${props.activeLevel}`}
            onClose={props.onClose}
            activeLevel={props.activeLevel}
            activeMode={props.activeMode}
            tutorStyle={props.tutorStyle}
            activeGrammarTopicEn={props.activeGrammarTopicEn}
            livePromptOverride={props.livePromptOverride}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
