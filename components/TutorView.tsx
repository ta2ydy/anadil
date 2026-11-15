'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Volume2,
  CheckCircle2,
  Languages,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import { CONVERSATION_STARTERS } from '@/lib/curriculum';
import { speakEnglish } from '@/lib/speech';
import type {
  CefrLevel,
  ConversationStarter,
  TutorMessage,
  TutorPracticeStyle,
} from '@/lib/types';

interface TutorViewProps {
  level: CefrLevel;
  practiceStyle: TutorPracticeStyle;
  onPracticeStyleChange: (style: TutorPracticeStyle) => void;
  onPromptCaptured?: (systemInstruction: string, taskPrompt: string) => void;
}

const PRACTICE_MODES: Array<{ id: TutorPracticeStyle; label: string }> = [
  { id: 'free', label: 'Serbest Sohbet' },
  { id: 'roleplay', label: 'Rol Yapma' },
  { id: 'correction', label: 'Cümle Düzeltme' },
];

function createWelcomeMessage(level: CefrLevel): TutorMessage {
  const greetings: Record<CefrLevel, { en: string; tr: string }> = {
    A1: {
      en: 'Hello! I am your English tutor. We can practice simple daily sentences together. How are you today?',
      tr: 'Merhaba! Ben İngilizce öğretmeninim. Birlikte basit günlük cümlelerle pratik yapabiliriz. İngilizce veya Türkçe yazabilirsin.',
    },
    A2: {
      en: 'Hi there! Welcome to our A2 speaking session. Tell me about your day or pick a starter topic on the right!',
      tr: 'Selam! A2 konuşma pratiğine hoş geldin. Günün nasıl geçtiğini anlatabilir ya da sağdaki başlatıcılardan birini seçebilirsin.',
    },
    B1: {
      en: 'Welcome back! At B1 level, we will practice sharing opinions, past experiences, and natural phrases. What would you like to talk about?',
      tr: 'Tekrar hoş geldin! B1 seviyesinde fikir paylaşımı, geçmiş deneyimler ve doğal ifadeler üzerinde çalışacağız. Ne hakkında konuşmak istersin?',
    },
    B2: {
      en: 'Good to see you! At B2 level, let us focus on nuanced arguments, business communication, and natural idioms. Ready to start?',
      tr: 'Görüşmek güzel! B2 seviyesinde nüanslı ifadeler, iş iletişimi ve doğal deyimlere odaklanalım. Başlamaya hazır mısın?',
    },
  };

  return {
    id: `welcome-${level}`,
    role: 'tutor',
    englishText: greetings[level].en,
    turkishSupport: greetings[level].tr,
    timestamp: '',
  };
}

export default function TutorView({
  level,
  practiceStyle,
  onPracticeStyleChange,
  onPromptCaptured,
}: TutorViewProps) {
  const [messages, setMessages] = useState<TutorMessage[]>(() => [createWelcomeMessage(level)]);
  const [inputValue, setInputValue] = useState('');
  const [showTurkishSupport, setShowTurkishSupport] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const msgCounterRef = useRef(0);

  const starters = CONVERSATION_STARTERS[level];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length, isSending]);

  function handleSpeak(text: string, msgId: string) {
    speakEnglish(text, {
      rate: level === 'A1' ? 0.86 : 0.96,
      onStart: () => setSpeakingId(msgId),
      onEnd: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  }

  async function sendMessage(textToSend: string, overrideStyle?: TutorPracticeStyle) {
    const trimmed = textToSend.trim();
    if (!trimmed || isSending) return;

    const activeStyle = overrideStyle ?? practiceStyle;
    msgCounterRef.current += 1;
    const userMsg: TutorMessage = {
      id: `user-${level}-${msgCounterRef.current}`,
      role: 'user',
      englishText: trimmed,
      timestamp: '',
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputValue('');
    setIsSending(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/gemini/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          style: activeStyle,
          message: trimmed,
          history: nextHistory.map((m) => ({
            role: m.role,
            text: m.englishText,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Öğretmen yanıtı alınamadı.');
      }

      if (data.usedSystemInstruction && data.usedTaskPrompt) {
        onPromptCaptured?.(data.usedSystemInstruction, data.usedTaskPrompt);
      }

      msgCounterRef.current += 1;
      const tutorMsg: TutorMessage = {
        id: `tutor-${level}-${msgCounterRef.current}`,
        role: 'tutor',
        englishText: data.englishReply || '',
        turkishSupport: data.turkishSupport,
        correction: data.correction,
        followUpQuestionEn: data.followUpQuestionEn,
        timestamp: '',
      };

      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Bağlantı hatası oluştu.');
    } finally {
      setIsSending(false);
    }
  }

  function handleUseStarter(starter: ConversationStarter) {
    onPracticeStyleChange(starter.style);
    sendMessage(starter.starterEn, starter.style);
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
      {/* Main Bilingual Conversation Stage (8 cols) */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-8">
        {/* Tutor Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
          <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
            {PRACTICE_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onPracticeStyleChange(m.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  practiceStyle === m.id
                    ? 'bg-white text-[#0284C7] shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTurkishSupport((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                showTurkishSupport
                  ? 'border-[#0284C7] bg-[#0284C7]/10 text-[#0284C7]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Languages className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Türkçe Destek: {showTurkishSupport ? 'Açık' : 'Kapalı'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMessages([createWelcomeMessage(level)]);
                setErrorMsg(null);
              }}
              aria-label="Sohbeti sıfırla"
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="h-[460px] space-y-5 overflow-y-auto px-5 py-5">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const fullEnglish = msg.followUpQuestionEn
              ? `${msg.englishText} ${msg.followUpQuestionEn}`
              : msg.englishText;

            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[82%] rounded-xl bg-[#0284C7] px-4 py-3 text-sm leading-relaxed text-white">
                    {msg.englishText}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[90%] space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-[#0284C7]">
                        AI Öğretmen · {level}
                      </p>
                      <p className="text-[15px] font-medium leading-relaxed text-slate-900">
                        {msg.englishText}
                      </p>
                      {msg.followUpQuestionEn && (
                        <p className="text-[15px] font-semibold text-slate-900">
                          {msg.followUpQuestionEn}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSpeak(fullEnglish, msg.id)}
                      aria-label="Öğretmen yanıtını İngilizce dinle"
                      className={`shrink-0 rounded-lg border p-2 transition-colors ${
                        speakingId === msg.id
                          ? 'border-[#0284C7] bg-[#0284C7] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Grammar / Phrasing Correction Callout */}
                  {msg.correction?.hasMistake && msg.correction.correctedSnippet && (
                    <div className="border-t border-slate-200 pt-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#059669]">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Daha Doğal İfade Önerisi</span>
                      </div>
                      {msg.correction.originalSnippet && (
                        <p className="mt-1 text-xs text-slate-500 line-through">
                          {msg.correction.originalSnippet}
                        </p>
                      )}
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {msg.correction.correctedSnippet}
                      </p>
                      {msg.correction.explanationTr && (
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          {msg.correction.explanationTr}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Turkish Support Summary */}
                  {showTurkishSupport && msg.turkishSupport && (
                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-xs font-medium text-slate-500">Türkçe İpucu ve Özet</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-700">
                        {msg.turkishSupport}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600">
                AI Öğretmen yanıt hazırlıyor...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(inputValue);
          }}
          className="border-t border-slate-200 bg-white p-4"
        >
          {errorMsg && (
            <p role="alert" className="mb-2.5 text-xs font-medium text-[#DC2626]">
              {errorMsg}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="İngilizce pratik yapın veya Türkçe soru sorun..."
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0284C7] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSending || !inputValue.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0284C7] px-5 py-2.5 text-sm font-medium text-white whitespace-nowrap transition-colors hover:bg-[#0369A1] disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>Gönder</span>
            </button>
          </div>
        </form>
      </div>

      {/* Right CEFR Conversation Starters Sidebar (4 cols) */}
      <aside className="space-y-5 lg:col-span-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-xs font-medium text-slate-500">
              {level} Seviyesine Özel
            </p>
            <h2 className="mt-0.5 text-base font-semibold text-slate-900">
              Konuşma Başlatıcıları
            </h2>
          </div>

          <ul className="mt-4 space-y-3">
            {starters.map((starter) => (
              <li
                key={starter.id}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-[#0284C7]/50 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{starter.titleTr}</h3>
                  <span className="text-xs text-slate-500">
                    {starter.style === 'free'
                      ? 'Sohbet'
                      : starter.style === 'roleplay'
                        ? 'Rol Yapma'
                        : 'Düzeltme'}
                  </span>
                </div>
                <p className="mt-1.5 text-xs italic text-slate-700">
                  &ldquo;{starter.starterEn}&rdquo;
                </p>
                <p className="mt-1.5 text-xs text-slate-500">{starter.hintTr}</p>
                <button
                  type="button"
                  disabled={isSending}
                  onClick={() => handleUseStarter(starter)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:text-[#0369A1] disabled:opacity-50"
                >
                  <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Bu Konuyla Başla</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
