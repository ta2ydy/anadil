'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Volume2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Gauge,
} from 'lucide-react';
import { speakEnglish } from '@/lib/speech';
import type { CardMasteryStatus, CefrLevel, FlashcardItem } from '@/lib/types';

interface FlashcardsViewProps {
  level: CefrLevel;
  cards: FlashcardItem[];
  masteryMap: Record<string, CardMasteryStatus>;
  onUpdateMastery: (cardId: string, status: CardMasteryStatus) => void;
  onAddAiCards: (newCards: FlashcardItem[]) => void;
  onPromptCaptured?: (systemInstruction: string, taskPrompt: string) => void;
}

type FilterMode = 'all' | 'review' | 'mastered';

const THEME_OPTIONS = [
  'Günlük Yaşam ve İletişim',
  'Seyahat ve Ulaşım',
  'İş ve Kariyer',
  'Teknoloji ve Eğitim',
];

export default function FlashcardsView({
  level,
  cards,
  masteryMap,
  onUpdateMastery,
  onAddAiCards,
  onPromptCaptured,
}: FlashcardsViewProps) {
  const [filter, setFilter] = useState<FilterMode>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [slowSpeech, setSlowSpeech] = useState(false);
  const [speakingTarget, setSpeakingTarget] = useState<'word' | 'example' | null>(null);
  const [selectedTheme, setSelectedTheme] = useState(THEME_OPTIONS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredCards = cards.filter((card) => {
    const status = masteryMap[card.id] || 'new';
    if (filter === 'mastered') return status === 'mastered';
    if (filter === 'review') return status !== 'mastered';
    return true;
  });

  const safeIndex = filteredCards.length > 0 ? Math.min(currentIndex, filteredCards.length - 1) : 0;
  const activeCard = filteredCards[safeIndex];

  function handleFilterChange(nextFilter: FilterMode) {
    setFilter(nextFilter);
    setCurrentIndex(0);
    setIsFlipped(false);
    setErrorMsg(null);
  }

  const handleNext = useCallback(() => {
    if (filteredCards.length <= 1) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  }, [filteredCards.length]);

  const handlePrev = useCallback(() => {
    if (filteredCards.length <= 1) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  }, [filteredCards.length]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, handlePrev]);

  function handleSpeak(text: string, target: 'word' | 'example') {
    speakEnglish(text, {
      rate: slowSpeech ? 0.72 : 0.96,
      onStart: () => setSpeakingTarget(target),
      onEnd: () => setSpeakingTarget(null),
      onError: () => setSpeakingTarget(null),
    });
  }

  async function handleGenerateMoreCards() {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/gemini/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          theme: selectedTheme,
          existingWords: cards.map((c) => c.word),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kelime kartları üretilemedi.');
      }
      if (data.usedSystemInstruction && data.usedTaskPrompt) {
        onPromptCaptured?.(data.usedSystemInstruction, data.usedTaskPrompt);
      }
      if (Array.isArray(data.cards) && data.cards.length > 0) {
        onAddAiCards(data.cards);
        setFilter('all');
        setCurrentIndex(cards.length);
        setIsFlipped(false);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  }

  const masteredTotal = cards.filter((c) => masteryMap[c.id] === 'mastered').length;
  const reviewTotal = cards.length - masteredTotal;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
      {/* Main Interactive 3D Flashcard Stage (Left 8 cols) */}
      <div className="space-y-5 lg:col-span-8">
        {/* Toolbar: Filter Tabs & Speech Rate */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tümü ({cards.length})
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('review')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                filter === 'review'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Çalışılacak ({reviewTotal})
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('mastered')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                filter === 'mastered'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Öğrenildi ({masteredTotal})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSlowSpeech((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              slowSpeech
                ? 'border-[#0284C7] bg-[#0284C7]/10 text-[#0284C7]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Telaffuz Hızı: {slowSpeech ? 'Yavaş (0.72x)' : 'Normal (1.0x)'}</span>
          </button>
        </div>

        {/* 3D Flip Card Container */}
        {activeCard ? (
          <div className="space-y-4">
            <div className="perspective-1000 relative h-[360px] w-full sm:h-[380px]">
              <motion.div
                className="preserve-3d relative h-full w-full cursor-pointer"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setIsFlipped((prev) => !prev)}
                role="button"
                tabIndex={0}
                aria-label={`${activeCard.word} kelime kartını çevir`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setIsFlipped((prev) => !prev);
                  }
                }}
              >
                {/* FRONT FACE: English Word + Phonetics + Speech */}
                <div className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[#0284C7]">
                        {activeCard.level}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{activeCard.partOfSpeechTr}</span>
                      {activeCard.isAiGenerated && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-600">AI ile Üretildi</span>
                        </>
                      )}
                    </div>
                    <span className="tabular-nums">
                      Kart {safeIndex + 1} / {filteredCards.length}
                    </span>
                  </div>

                  <div className="my-auto flex flex-col items-center text-center">
                    <h2 className="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                      {activeCard.word}
                    </h2>
                    <p className="mt-2 font-mono text-base text-slate-500">{activeCard.ipa}</p>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeak(activeCard.word, 'word');
                      }}
                      className={`mt-6 inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                        speakingTarget === 'word'
                          ? 'border-[#0284C7] bg-[#0284C7] text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-[#0284C7] hover:bg-white'
                      }`}
                    >
                      <Volume2 className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {speakingTarget === 'word' ? 'Okunuyor...' : 'İngilizce Telaffuzu Dinle'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span>Türkçe anlamı ve örnek cümle için karta tıklayın</span>
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                      <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                      Çevir (Boşluk)
                    </span>
                  </div>
                </div>

                {/* BACK FACE: Turkish Meaning + Example Sentence + Tip */}
                <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{activeCard.word}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{activeCard.ipa}</span>
                    </div>
                    <span className="text-[#0284C7] font-medium">Türkçe Karşılık</span>
                  </div>

                  <div className="my-auto space-y-5">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Anlamı</p>
                      <p className="mt-1 font-display text-3xl font-semibold text-slate-900">
                        {activeCard.turkishMeaning}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-base font-medium text-slate-900">
                            &ldquo;{activeCard.exampleEn}&rdquo;
                          </p>
                          <p className="text-sm text-slate-600">{activeCard.exampleTr}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeak(activeCard.exampleEn, 'example');
                          }}
                          aria-label="Örnek cümleyi İngilizce dinle"
                          className={`shrink-0 rounded-lg border p-2.5 transition-colors ${
                            speakingTarget === 'example'
                              ? 'border-[#0284C7] bg-[#0284C7] text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                          }`}
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">Kullanım Notu: </span>
                        {activeCard.usageTipTr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span>Ön yüze dönmek için karta tıklayın</span>
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                      <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                      Ön Yüz
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Card Controls: Prev / Mastery Buttons / Next */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={filteredCards.length <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Önceki</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={filteredCards.length <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  <span>Sonraki</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateMastery(activeCard.id, 'review');
                    handleNext();
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                    masteryMap[activeCard.id] === 'review'
                      ? 'border-[#D97706] bg-[#D97706]/10 text-[#B45309]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tekrar Et</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateMastery(activeCard.id, 'mastered');
                    handleNext();
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                    masteryMap[activeCard.id] === 'mastered'
                      ? 'border-[#059669] bg-[#059669] text-white'
                      : 'border-[#059669]/40 bg-[#059669]/10 text-[#059669] hover:bg-[#059669]/15'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Öğrendim</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-[320px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="font-display text-lg font-semibold text-slate-900">
              Bu filtrede gösterilecek kart kalmadı.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Tüm kartları görüntüleyebilir veya sağdaki panelden yapay zekâ ile yeni kelimeler
              ekleyebilirsiniz.
            </p>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="mt-4 rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-medium text-white hover:bg-[#0369A1]"
            >
              Tüm Kartları Göster
            </button>
          </div>
        )}
      </div>

      {/* Right Deck List & AI Generator Panel (4 cols) */}
      <aside className="space-y-6 lg:col-span-4">
        {/* AI Word Generator */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">
            AI ile Yeni Kelimeler Ekle
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Seçili <span className="font-mono font-semibold">{level}</span> seviyesine uygun 5 yeni
            kelime kartını Gemini API ile destenize ekleyin.
          </p>

          <div className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-slate-700" htmlFor="fc-theme-select">
              Kelime Teması
            </label>
            <select
              id="fc-theme-select"
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-[#0284C7] focus:bg-white focus:outline-none"
            >
              {THEME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleGenerateMoreCards}
              disabled={isGenerating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0284C7] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0369A1] disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>{isGenerating ? 'Kartlar Hazırlanıyor...' : '5 Yeni Kelime Üret'}</span>
            </button>

            {errorMsg && (
              <p role="alert" className="text-xs font-medium text-[#DC2626]">
                {errorMsg}
              </p>
            )}
          </div>
        </div>

        {/* Deck Index */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">Destedeki Kelimeler</h3>
            <span className="text-xs tabular-nums text-slate-500">
              {filteredCards.length} kart
            </span>
          </div>

          <ul className="mt-3 max-h-[320px] divide-y divide-slate-100 overflow-y-auto pr-1">
            {filteredCards.map((card, idx) => {
              const status = masteryMap[card.id] || 'new';
              const isCurrent = idx === safeIndex;
              return (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsFlipped(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors ${
                      isCurrent ? 'bg-[#0284C7]/8 text-[#0284C7]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{card.word}</p>
                      <p className="truncate text-xs text-slate-500">{card.turkishMeaning}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium">
                      {status === 'mastered' ? (
                        <span className="inline-flex items-center gap-1 text-[#059669]">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Öğrenildi
                        </span>
                      ) : status === 'review' ? (
                        <span className="text-[#B45309]">Tekrar</span>
                      ) : (
                        <span className="text-slate-400">Yeni</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
