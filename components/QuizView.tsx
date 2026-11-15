'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Volume2,
} from 'lucide-react';
import { speakEnglish } from '@/lib/speech';
import type { CefrLevel, QuizQuestion } from '@/lib/types';

interface QuizViewProps {
  level: CefrLevel;
  questions: QuizQuestion[];
  onReplaceWithAiQuestions: (newQuestions: QuizQuestion[]) => void;
  onResetCuratedQuiz: () => void;
  onPromptCaptured?: (systemInstruction: string, taskPrompt: string) => void;
}

const FOCUS_TOPICS = [
  'Genel İngilizce (Dil Bilgisi + Kelime)',
  'Dil Bilgisi ve Zamanlar',
  'Günlük Konuşma Kalıpları',
  'Kelime Bilgisi ve Eşdizimler',
];

export default function QuizView({
  level,
  questions,
  onReplaceWithAiQuestions,
  onResetCuratedQuiz,
  onPromptCaptured,
}: QuizViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [focusTopic, setFocusTopic] = useState(FOCUS_TOPICS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeQuestion = questions[currentIndex];
  const chosenOption = activeQuestion ? selectedAnswers[activeQuestion.id] : undefined;
  const hasAnsweredCurrent = chosenOption !== undefined;
  const isCurrentCorrect =
    hasAnsweredCurrent && chosenOption === activeQuestion?.correctIndex;

  const totalCorrect = questions.reduce((acc, q) => {
    return selectedAnswers[q.id] === q.correctIndex ? acc + 1 : acc;
  }, 0);

  function handleSelectOption(optionIdx: number) {
    if (!activeQuestion || hasAnsweredCurrent) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [activeQuestion.id]: optionIdx,
    }));
  }

  function handleNextQuestion() {
    if (currentIndex + 1 >= questions.length) {
      setIsCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function handleRestartCurrent() {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsCompleted(false);
  }

  async function handleGenerateAiQuiz() {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const topicMap: Record<string, string> = {
        'Genel İngilizce (Dil Bilgisi + Kelime)':
          'General English (Vocabulary, Grammar & Everyday Expressions)',
        'Dil Bilgisi ve Zamanlar': 'English Grammar, Tenses & Sentence Structure',
        'Günlük Konuşma Kalıpları': 'Everyday Conversational Phrases & Polite Expressions',
        'Kelime Bilgisi ve Eşdizimler': 'CEFR Vocabulary, Prepositions & Natural Collocations',
      };

      const res = await fetch('/api/gemini/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          focusTopic: topicMap[focusTopic] || topicMap[FOCUS_TOPICS[0]],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI testi oluşturulamadı.');
      }
      if (data.usedSystemInstruction && data.usedTaskPrompt) {
        onPromptCaptured?.(data.usedSystemInstruction, data.usedTaskPrompt);
      }
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        onReplaceWithAiQuestions(data.questions);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  }

  const progressPercent =
    questions.length > 0
      ? Math.round(((currentIndex + (hasAnsweredCurrent ? 1 : 0)) / questions.length) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
      {/* Main Quiz Stage (8 cols) */}
      <div className="lg:col-span-8">
        {isCompleted ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="border-b border-slate-100 pb-6">
              <p className="text-xs font-medium text-slate-500">
                {level} Seviyesi · Alıştırma Sonucu
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-slate-900">
                Test Tamamlandı
              </h2>
              <p className="mt-2 text-base text-slate-600">
                Toplam <span className="font-semibold tabular-nums text-slate-900">{questions.length}</span> sorudan{' '}
                <span className="font-semibold tabular-nums text-[#059669]">{totalCorrect}</span> tanesini doğru yanıtladınız.
              </p>
            </div>

            {/* Question Review List */}
            <ul className="mt-6 divide-y divide-slate-100">
              {questions.map((q, idx) => {
                const userAns = selectedAnswers[q.id];
                const ok = userAns === q.correctIndex;
                return (
                  <li key={q.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">
                          Soru {idx + 1} · {q.categoryTr}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{q.questionEn}</p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold ${
                          ok ? 'text-[#059669]' : 'text-[#DC2626]'
                        }`}
                      >
                        {ok ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            <span>Doğru</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" aria-hidden="true" />
                            <span>Yanlış</span>
                          </>
                        )}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">Doğru Yanıt: </span>
                      {q.options[q.correctIndex]} — {q.explanationTr}
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={handleRestartCurrent}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Bu Testi Tekrar Çöz</span>
              </button>
              <button
                type="button"
                onClick={handleGenerateAiQuiz}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0284C7] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0369A1] disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>{isGenerating ? 'Üretiliyor...' : 'AI ile 5 Yeni Soru Üret'}</span>
              </button>
            </div>
          </div>
        ) : activeQuestion ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            {/* Progress Header */}
            <div className="space-y-3 border-b border-slate-100 pb-5">
              <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-[#0284C7]">
                    {activeQuestion.level}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeQuestion.categoryTr}</span>
                  {activeQuestion.isAiGenerated && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-700">AI Üretimi</span>
                    </>
                  )}
                </div>
                <span className="tabular-nums font-medium text-slate-700">
                  Soru {currentIndex + 1} / {questions.length}
                </span>
              </div>

              <div
                aria-hidden="true"
                className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  className="h-full bg-[#0284C7] transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Question Prompt */}
            <div className="mt-6">
              <p className="text-sm font-medium text-slate-600">{activeQuestion.promptTr}</p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <h2 className="font-display text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
                  {activeQuestion.questionEn}
                </h2>
                <button
                  type="button"
                  onClick={() => speakEnglish(activeQuestion.questionEn.replace('____', 'blank'))}
                  aria-label="Soruyu İngilizce dinle"
                  className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-white"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="mt-6 space-y-3">
              {activeQuestion.options.map((option, idx) => {
                const isSelected = chosenOption === idx;
                const isCorrectOpt = idx === activeQuestion.correctIndex;

                let optionStyle =
                  'border-slate-200 bg-white text-slate-900 hover:border-[#0284C7] hover:bg-slate-50';
                if (hasAnsweredCurrent) {
                  if (isCorrectOpt) {
                    optionStyle = 'border-[#059669] bg-[#059669]/8 text-slate-900';
                  } else if (isSelected && !isCorrectOpt) {
                    optionStyle = 'border-[#DC2626] bg-[#DC2626]/8 text-slate-900';
                  } else {
                    optionStyle = 'border-slate-200 bg-slate-50 text-slate-500 opacity-75';
                  }
                }

                const letter = ['A', 'B', 'C', 'D'][idx] ?? String(idx + 1);

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={hasAnsweredCurrent}
                    onClick={() => handleSelectOption(idx)}
                    className={`flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-3.5 text-left transition-colors ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-slate-500">
                        {letter}.
                      </span>
                      <span className="text-sm font-medium sm:text-base">{option}</span>
                    </div>

                    {hasAnsweredCurrent && isCorrectOpt && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#059669]">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        <span>Doğru</span>
                      </span>
                    )}
                    {hasAnsweredCurrent && isSelected && !isCorrectOpt && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#DC2626]">
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        <span>Seçiminiz</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Instant Turkish Feedback */}
            {hasAnsweredCurrent && (
              <div
                role="status"
                className={`mt-6 rounded-lg border p-4 ${
                  isCurrentCorrect
                    ? 'border-[#059669]/30 bg-[#059669]/6'
                    : 'border-[#DC2626]/30 bg-[#DC2626]/6'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCurrentCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-[#059669]" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-4 w-4 text-[#DC2626]" aria-hidden="true" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      isCurrentCorrect ? 'text-[#059669]' : 'text-[#DC2626]'
                    }`}
                  >
                    {isCurrentCorrect
                      ? 'Harika! Doğru yanıtladınız.'
                      : `Yanlış yanıt. Doğru seçenek: "${activeQuestion.options[activeQuestion.correctIndex]}"`}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {activeQuestion.explanationTr}
                </p>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0369A1]"
                  >
                    <span>
                      {currentIndex + 1 >= questions.length ? 'Sonucu Gör' : 'Sonraki Soru'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Right AI Quiz Generator Sidebar (4 cols) */}
      <aside className="space-y-6 lg:col-span-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">
            AI Soru Üretici ({level})
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            İngilizce görev istemiyle Gemini API üzerinden seviyenize özel 5 yeni çoktan seçmeli
            soru ve anında Türkçe açıklamalar oluşturun.
          </p>

          <div className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-slate-700" htmlFor="quiz-focus-select">
              Soru Odağı
            </label>
            <select
              id="quiz-focus-select"
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-[#0284C7] focus:bg-white focus:outline-none"
            >
              {FOCUS_TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleGenerateAiQuiz}
              disabled={isGenerating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0284C7] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0369A1] disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>{isGenerating ? 'Sorular Hazırlanıyor...' : 'AI ile 5 Yeni Soru Üret'}</span>
            </button>

            <button
              type="button"
              onClick={onResetCuratedQuiz}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Hazır {level} Testine Dön</span>
            </button>

            {errorMsg && (
              <p role="alert" className="text-xs font-medium text-[#DC2626]">
                {errorMsg}
              </p>
            )}
          </div>
        </div>

        {/* Live Quiz Score Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Mevcut Oturum Özeti</h3>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Yanıtlanan Soru</dt>
              <dd className="font-mono font-semibold tabular-nums text-slate-900">
                {Object.keys(selectedAnswers).length} / {questions.length}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Doğru Sayısı</dt>
              <dd className="font-mono font-semibold tabular-nums text-[#059669]">
                {totalCorrect}
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
