export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2';

export type LearningMode = 'flashcards' | 'grammar' | 'quiz' | 'tutor';

export type TutorPracticeStyle = 'free' | 'roleplay' | 'correction';

export type CardMasteryStatus = 'new' | 'review' | 'mastered';

export interface FlashcardItem {
  id: string;
  level: CefrLevel;
  word: string;
  ipa: string;
  partOfSpeechTr: string;
  turkishMeaning: string;
  exampleEn: string;
  exampleTr: string;
  usageTipTr: string;
  isAiGenerated?: boolean;
}

export interface GrammarExample {
  en: string;
  tr: string;
  highlight?: string;
}

export interface GrammarTopic {
  id: string;
  level: CefrLevel;
  titleTr: string;
  titleEn: string;
  categoryTr: string;
  summaryTr: string;
  formula: string;
  explanationTr: string;
  examples: GrammarExample[];
  commonMistakeTr: {
    wrong: string;
    right: string;
    reasonTr: string;
  };
}

export interface QuizQuestion {
  id: string;
  level: CefrLevel;
  categoryTr: string;
  questionEn: string;
  promptTr: string;
  options: string[];
  correctIndex: number;
  explanationTr: string;
  isAiGenerated?: boolean;
}

export interface ConversationStarter {
  id: string;
  level: CefrLevel;
  titleTr: string;
  scenarioEn: string;
  starterEn: string;
  hintTr: string;
  style: TutorPracticeStyle;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'tutor';
  englishText: string;
  turkishSupport?: string;
  correction?: {
    hasMistake: boolean;
    originalSnippet?: string;
    correctedSnippet?: string;
    explanationTr?: string;
  };
  followUpQuestionEn?: string;
  timestamp: string;
}

export interface PromptBundle {
  model: string;
  level: CefrLevel;
  mode: LearningMode;
  modeTitleTr: string;
  systemInstruction: string;
  taskPrompt: string;
}
