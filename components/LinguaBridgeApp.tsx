'use client';

import { useState, useCallback, useMemo, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import HeaderBar from './HeaderBar';
import LevelSwitcherBar from './LevelSwitcherBar';
import FlashcardsView from './FlashcardsView';
import GrammarView from './GrammarView';
import QuizView from './QuizView';
import TutorView from './TutorView';
import PromptInspectorModal from './PromptInspectorModal';
import { GRAMMAR_TOPICS, INITIAL_FLASHCARDS, INITIAL_QUIZZES } from '@/lib/curriculum';
import type {
  CardMasteryStatus,
  CefrLevel,
  FlashcardItem,
  LearningMode,
  QuizQuestion,
  TutorPracticeStyle,
} from '@/lib/types';

const STORAGE_KEY_MASTERY = 'dilkoprusu_card_mastery_v1';
const MASTERY_EVENT = 'dilkoprusu-mastery-change';

function subscribeMastery(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(MASTERY_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(MASTERY_EVENT, callback);
  };
}

function getMasterySnapshot(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY_MASTERY) || '{}';
  } catch {
    return '{}';
  }
}

function getMasteryServerSnapshot(): string {
  return '{}';
}

export default function LinguaBridgeApp() {
  const [activeLevel, setActiveLevel] = useState<CefrLevel>('A1');
  const [activeMode, setActiveMode] = useState<LearningMode>('flashcards');
  const [tutorStyle, setTutorStyle] = useState<TutorPracticeStyle>('free');
  const [activeGrammarTopicEn, setActiveGrammarTopicEn] = useState<string>(
    GRAMMAR_TOPICS.A1[0].titleEn
  );
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  const [decksByLevel, setDecksByLevel] =
    useState<Record<CefrLevel, FlashcardItem[]>>(INITIAL_FLASHCARDS);
  const [quizzesByLevel, setQuizzesByLevel] =
    useState<Record<CefrLevel, QuizQuestion[]>>(INITIAL_QUIZZES);

  const masteryRaw = useSyncExternalStore(
    subscribeMastery,
    getMasterySnapshot,
    getMasteryServerSnapshot
  );

  const masteryMap = useMemo<Record<string, CardMasteryStatus>>(() => {
    try {
      return JSON.parse(masteryRaw);
    } catch {
      return {};
    }
  }, [masteryRaw]);

  const [livePromptOverride, setLivePromptOverride] = useState<{
    systemInstruction: string;
    taskPrompt: string;
  } | null>(null);

  const handleUpdateMastery = useCallback(
    (cardId: string, status: CardMasteryStatus) => {
      const next = { ...masteryMap, [cardId]: status };
      try {
        window.localStorage.setItem(STORAGE_KEY_MASTERY, JSON.stringify(next));
        window.dispatchEvent(new Event(MASTERY_EVENT));
      } catch {
        // Ignore storage write failure
      }
    },
    [masteryMap]
  );

  const handleAddAiCards = useCallback(
    (newCards: FlashcardItem[]) => {
      setDecksByLevel((prev) => ({
        ...prev,
        [activeLevel]: [...prev[activeLevel], ...newCards],
      }));
    },
    [activeLevel]
  );

  const handleReplaceQuiz = useCallback(
    (newQuestions: QuizQuestion[]) => {
      setQuizzesByLevel((prev) => ({
        ...prev,
        [activeLevel]: newQuestions,
      }));
    },
    [activeLevel]
  );

  const handleResetQuiz = useCallback(() => {
    setQuizzesByLevel((prev) => ({
      ...prev,
      [activeLevel]: INITIAL_QUIZZES[activeLevel],
    }));
  }, [activeLevel]);

  const handlePromptCaptured = useCallback((systemInstruction: string, taskPrompt: string) => {
    setLivePromptOverride({ systemInstruction, taskPrompt });
  }, []);

  const handleSelectLevel = useCallback((lvl: CefrLevel) => {
    setActiveLevel(lvl);
    setActiveGrammarTopicEn(GRAMMAR_TOPICS[lvl][0]?.titleEn ?? 'English Grammar');
    setLivePromptOverride(null);
  }, []);

  const handleSelectMode = useCallback((mode: LearningMode) => {
    setActiveMode(mode);
    setLivePromptOverride(null);
  }, []);

  const currentCards = decksByLevel[activeLevel];
  const currentMasteredCount = currentCards.filter(
    (card) => masteryMap[card.id] === 'mastered'
  ).length;
  const activeQuizKey = `${activeLevel}-${quizzesByLevel[activeLevel][0]?.id ?? 'default'}`;

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0F172A]">
      <HeaderBar
        activeMode={activeMode}
        onSelectMode={handleSelectMode}
        onOpenPromptInspector={() => setIsPromptModalOpen(true)}
      />

      <LevelSwitcherBar
        activeLevel={activeLevel}
        onSelectLevel={handleSelectLevel}
        masteredCount={currentMasteredCount}
        totalCardsCount={currentCards.length}
      />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeMode}-${activeLevel}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeMode === 'flashcards' && (
              <FlashcardsView
                key={activeLevel}
                level={activeLevel}
                cards={currentCards}
                masteryMap={masteryMap}
                onUpdateMastery={handleUpdateMastery}
                onAddAiCards={handleAddAiCards}
                onPromptCaptured={handlePromptCaptured}
              />
            )}

            {activeMode === 'grammar' && (
              <GrammarView
                key={activeLevel}
                level={activeLevel}
                onActiveTopicChange={setActiveGrammarTopicEn}
                onPromptCaptured={handlePromptCaptured}
              />
            )}

            {activeMode === 'quiz' && (
              <QuizView
                key={activeQuizKey}
                level={activeLevel}
                questions={quizzesByLevel[activeLevel]}
                onReplaceWithAiQuestions={handleReplaceQuiz}
                onResetCuratedQuiz={handleResetQuiz}
                onPromptCaptured={handlePromptCaptured}
              />
            )}

            {activeMode === 'tutor' && (
              <TutorView
                key={activeLevel}
                level={activeLevel}
                practiceStyle={tutorStyle}
                onPracticeStyleChange={setTutorStyle}
                onPromptCaptured={handlePromptCaptured}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-200 bg-white py-5">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:px-6">
          <p>DilKöprüsü · A1–B2 CEFR İngilizce Öğrenme Atölyesi</p>
          <button
            type="button"
            onClick={() => setIsPromptModalOpen(true)}
            className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-[#0284C7]"
          >
            Aktif İngilizce AI Studio Promptunu İncele
          </button>
        </div>
      </footer>

      <PromptInspectorModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        activeLevel={activeLevel}
        activeMode={activeMode}
        tutorStyle={tutorStyle}
        activeGrammarTopicEn={activeGrammarTopicEn}
        livePromptOverride={livePromptOverride}
      />
    </div>
  );
}
