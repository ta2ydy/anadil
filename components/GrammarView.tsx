'use client';

import { useState } from 'react';
import { Volume2, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { GRAMMAR_TOPICS } from '@/lib/curriculum';
import { speakEnglish } from '@/lib/speech';
import type { CefrLevel } from '@/lib/types';

interface GrammarViewProps {
  level: CefrLevel;
  onActiveTopicChange?: (topicEn: string) => void;
  onPromptCaptured?: (systemInstruction: string, taskPrompt: string) => void;
}

interface GrammarAiResult {
  feedbackTr: string;
  improvedSentenceEn: string;
  extraExamples: Array<{ en: string; tr: string }>;
}

export default function GrammarView({
  level,
  onActiveTopicChange,
  onPromptCaptured,
}: GrammarViewProps) {
  const topics = GRAMMAR_TOPICS[level];
  const [selectedId, setSelectedId] = useState(topics[0]?.id ?? '');
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [practiceInput, setPracticeInput] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiResult, setAiResult] = useState<GrammarAiResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const activeTopic = topics.find((t) => t.id === selectedId) ?? topics[0];

  function handleSelectTopic(topicId: string) {
    setSelectedId(topicId);
    setAiResult(null);
    setAiError(null);
    const found = topics.find((t) => t.id === topicId);
    if (found) {
      onActiveTopicChange?.(found.titleEn);
    }
  }

  function handleSpeak(text: string) {
    speakEnglish(text, {
      rate: 0.94,
      onStart: () => setSpeakingText(text),
      onEnd: () => setSpeakingText(null),
      onError: () => setSpeakingText(null),
    });
  }

  async function handleCheckSentence(e: React.FormEvent) {
    e.preventDefault();
    if (!practiceInput.trim() || !activeTopic) return;

    setIsLoadingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          topicTitleEn: activeTopic.titleEn,
          query: practiceInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cümle kontrol edilemedi.');
      }
      if (data.usedSystemInstruction && data.usedTaskPrompt) {
        onPromptCaptured?.(data.usedSystemInstruction, data.usedTaskPrompt);
      }
      setAiResult({
        feedbackTr: data.feedbackTr,
        improvedSentenceEn: data.improvedSentenceEn,
        extraExamples: Array.isArray(data.extraExamples) ? data.extraExamples : [],
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setIsLoadingAi(false);
    }
  }

  if (!activeTopic) return null;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
      {/* Left Topic Navigation (4 cols) */}
      <aside className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-4">
        <div className="border-b border-slate-100 pb-3">
          <p className="text-xs font-medium text-slate-500">
            {level} Seviyesi · {topics.length} Konu
          </p>
          <h2 className="mt-0.5 text-base font-semibold text-slate-900">
            Dil Bilgisi &amp; Kalıplar
          </h2>
        </div>

        <ul className="mt-3 space-y-1.5">
          {topics.map((topic, index) => {
            const isSelected = topic.id === activeTopic.id;
            return (
              <li key={topic.id}>
                <button
                  type="button"
                  onClick={() => handleSelectTopic(topic.id)}
                  className={`w-full rounded-lg px-3.5 py-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-[#0284C7]/10 text-[#0284C7]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono tabular-nums">0{index + 1}.</span>
                    <span>{topic.categoryTr}</span>
                  </div>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      isSelected ? 'text-[#0284C7]' : 'text-slate-900'
                    }`}
                  >
                    {topic.titleTr}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{topic.summaryTr}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Right Topic Content Stage (8 cols) */}
      <div className="space-y-6 lg:col-span-8">
        <article className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-mono font-semibold text-[#0284C7]">{activeTopic.level}</span>
            <span aria-hidden="true">·</span>
            <span>{activeTopic.categoryTr}</span>
            <span aria-hidden="true">·</span>
            <span>{activeTopic.titleEn}</span>
          </div>

          <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900 sm:text-3xl text-balance">
            {activeTopic.titleTr}
          </h2>

          {/* Structure Formula */}
          <div className="mt-5 border-y border-slate-100 py-4">
            <p className="text-xs font-medium text-slate-500">Yapı Formülü</p>
            <p className="mt-1 font-mono text-sm font-medium text-slate-900">
              {activeTopic.formula}
            </p>
          </div>

          {/* Turkish Explanation */}
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-slate-900">Türkçe Açıklama</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
              {activeTopic.explanationTr}
            </p>
          </div>

          {/* English Examples with Speech Playback */}
          <div className="mt-7">
            <h3 className="text-sm font-semibold text-slate-900">Örnek Cümleler</h3>
            <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
              {activeTopic.examples.map((ex, i) => {
                const isPlaying = speakingText === ex.en;
                return (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-4 py-3.5"
                  >
                    <div className="space-y-1">
                      <p className="text-base font-medium text-slate-900">{ex.en}</p>
                      <p className="text-sm text-slate-600">{ex.tr}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSpeak(ex.en)}
                      aria-label={`Örnek cümleyi dinle: ${ex.en}`}
                      className={`shrink-0 rounded-lg border p-2 transition-colors ${
                        isPlaying
                          ? 'border-[#0284C7] bg-[#0284C7] text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Common Turkish-Speaker Mistake Contrast */}
          <div className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-900">
              Türkçe Konuşanların Sık Yaptığı Hata
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[#DC2626]/25 bg-[#DC2626]/5 p-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#DC2626]">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Yanlış Kullanım</span>
                </div>
                <p className="mt-1.5 text-sm font-medium text-slate-900 line-through decoration-[#DC2626]/60">
                  {activeTopic.commonMistakeTr.wrong}
                </p>
              </div>
              <div className="rounded-lg border border-[#059669]/25 bg-[#059669]/5 p-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#059669]">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Doğru Kullanım</span>
                </div>
                <p className="mt-1.5 text-sm font-medium text-slate-900">
                  {activeTopic.commonMistakeTr.right}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">{activeTopic.commonMistakeTr.reasonTr}</p>
          </div>
        </article>

        {/* Micro AI Practice Widget for This Rule */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900">
            Bu Kalıpla Kendi Cümleni Test Et
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Bu kuralı kullanarak kendi İngilizce cümleni yaz veya aklına takılan bir soruyu Türkçe
            sor; Gemini API anında geri bildirim versin.
          </p>

          <form onSubmit={handleCheckSentence} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={practiceInput}
              onChange={(e) => setPracticeInput(e.target.value)}
              placeholder={`Örn: Bu kural ile ilgili bir cümle yazın (${activeTopic.level})...`}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0284C7] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoadingAi || !practiceInput.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0284C7] px-4 py-2.5 text-sm font-medium text-white whitespace-nowrap transition-colors hover:bg-[#0369A1] disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>{isLoadingAi ? 'İnceleniyor...' : 'Kontrol Et'}</span>
            </button>
          </form>

          {aiError && (
            <p role="alert" className="mt-3 text-xs font-medium text-[#DC2626]">
              {aiError}
            </p>
          )}

          {aiResult && (
            <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
              <div>
                <p className="text-xs font-semibold text-[#0284C7]">AI Öğretmen Değerlendirmesi</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-800">{aiResult.feedbackTr}</p>
              </div>

              {aiResult.improvedSentenceEn && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Önerilen Doğal Cümle</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                      {aiResult.improvedSentenceEn}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSpeak(aiResult.improvedSentenceEn)}
                    aria-label="Önerilen cümleyi dinle"
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-100"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {aiResult.extraExamples.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700">Ek Örnekler</p>
                  <ul className="mt-2 space-y-2">
                    {aiResult.extraExamples.map((ex, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-medium text-slate-900">{ex.en}</span>
                        <span className="mx-2 text-slate-400">—</span>
                        <span className="text-slate-600">{ex.tr}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
