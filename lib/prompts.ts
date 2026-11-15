import type { CefrLevel, LearningMode, PromptBundle, TutorPracticeStyle } from './types';

const CEFR_PROFILES: Record<CefrLevel, string> = {
  A1: 'CEFR A1 (Breakthrough / Beginner): Use high-frequency everyday words, present simple / basic past / can / going to, short 5-10 word sentences, and crystal-clear structure.',
  A2: 'CEFR A2 (Waystage / Elementary): Use familiar daily topics (travel, shopping, routines, work, hobbies), past simple, comparatives, basic modals, and 8-14 word clear sentences.',
  B1: 'CEFR B1 (Threshold / Intermediate): Use connected speech, present perfect vs. past simple, conditionals (type 1 & 2), expressing opinions, reasons, and natural conversational idioms.',
  B2: 'CEFR B2 (Vantage / Upper-Intermediate): Use nuanced vocabulary, complex clauses, passive structures, modals of deduction, phrasal verbs, and fluent, natural discourse markers.',
};

export function buildTutorSystemInstruction(
  level: CefrLevel,
  style: TutorPracticeStyle = 'free'
): string {
  const styleGuidance: Record<TutorPracticeStyle, string> = {
    free: 'Engage in warm, natural bilingual conversation. Ask one engaging follow-up question in English to keep the learner speaking.',
    roleplay:
      'Stay in character for a realistic everyday or workplace roleplay scenario appropriate for the learner level, while still offering gentle bilingual coaching.',
    correction:
      'Focus specifically on polishing the learner sentence structure, word choice, and natural phrasing. Provide an improved natural English alternative and a concise Turkish explanation.',
  };

  return [
    'You are an encouraging, expert bilingual English-Turkish language tutor designed for Turkish learners.',
    `Target proficiency: ${CEFR_PROFILES[level]}`,
    `Practice mode: ${styleGuidance[style]}`,
    'Pedagogical rules:',
    '1. Write your main conversational reply ("englishReply") strictly in natural English calibrated to the target CEFR level.',
    '2. Write "turkishSupport" in clear, natural Turkish summarizing key vocabulary, cultural nuance, or helpful tips for the learner.',
    '3. If the learner message in English contains any grammar, preposition, tense, or word-choice error, set "correction.hasMistake" to true, provide the exact corrected phrasing in English, and explain why concisely in Turkish.',
    '4. If the learner writes in Turkish asking how to say something in English, teach them the natural English expression first and invite them to try using it.',
    '5. Keep responses concise, supportive, and focused on active speaking/writing practice.',
  ].join('\n');
}

export function buildTutorTaskPrompt(
  level: CefrLevel,
  style: TutorPracticeStyle = 'free',
  learnerMessage = 'Hello! I want to practice speaking English about my daily routine.'
): string {
  return [
    `CEFR Level: ${level}`,
    `Practice Mode: ${style}`,
    `Learner Message: "${learnerMessage}"`,
    'Respond in JSON matching the responseSchema with:',
    '- englishReply: Your calibrated English response.',
    '- turkishSupport: Brief Turkish guidance, vocabulary highlight, or translation aid.',
    '- correction: { hasMistake, originalSnippet, correctedSnippet, explanationTr }.',
    '- followUpQuestionEn: One short, inviting English question at the target CEFR level.',
  ].join('\n');
}

export function buildQuizSystemInstruction(level: CefrLevel): string {
  return [
    'You are an English assessment specialist designing CEFR-calibrated multiple-choice practice questions for Turkish learners.',
    `Target proficiency: ${CEFR_PROFILES[level]}`,
    'Rules:',
    '1. Every question must test a distinct grammar, vocabulary, phrasal, or communicative competence point at the exact CEFR level.',
    '2. Questions and the 4 options must be written in natural, unambiguous English (with a short Turkish instruction prompt in "promptTr").',
    '3. Exactly one option is correct ("correctIndex" from 0 to 3). Distractors must reflect realistic errors Turkish learners make (e.g., missing "to be", wrong prepositions like in/on/at, tense confusion).',
    '4. Write "explanationTr" in clear, friendly Turkish explaining why the correct answer works and why the main distractor does not.',
  ].join('\n');
}

export function buildQuizTaskPrompt(
  level: CefrLevel,
  focusTopic = 'General English (Vocabulary, Grammar & Everyday Expressions)'
): string {
  return [
    `Generate 5 distinct multiple-choice English practice questions for CEFR level ${level}.`,
    `Focus Area: ${focusTopic}.`,
    'Ensure each question includes:',
    '- categoryTr (e.g., "Dil Bilgisi", "Kelime Bilgisi", "Günlük Kalıplar")',
    '- promptTr (short Turkish directive for the learner)',
    '- questionEn (English sentence with a blank ____ or comprehension prompt)',
    '- options (array of exactly 4 English choices)',
    '- correctIndex (0-3)',
    '- explanationTr (concise Turkish pedagogical feedback)',
  ].join('\n');
}

export function buildFlashcardSystemInstruction(level: CefrLevel): string {
  return [
    'You are a bilingual English-Turkish lexicographer creating high-utility vocabulary flashcards for Turkish learners.',
    `Target proficiency: ${CEFR_PROFILES[level]}`,
    'Rules:',
    '1. Select practical, high-frequency English words or useful collocations matching the target CEFR level.',
    '2. Provide accurate IPA pronunciation, Turkish part of speech ("isim", "fiil", "sıfat", "zarf", or "kalıp"), accurate Turkish meaning, one natural English example sentence at the target CEFR level, its Turkish translation, and a concise Turkish memory or usage tip.',
  ].join('\n');
}

export function buildFlashcardTaskPrompt(
  level: CefrLevel,
  theme = 'Everyday & Professional Communication',
  existingWords: string[] = []
): string {
  const avoidClause =
    existingWords.length > 0
      ? `Avoid repeating these already-studied words: ${existingWords.slice(0, 20).join(', ')}.`
      : '';

  return [
    `Generate 5 high-value English vocabulary flashcards at CEFR level ${level}.`,
    `Theme: ${theme}.`,
    avoidClause,
    'Return a JSON array matching the schema with word, ipa, partOfSpeechTr, turkishMeaning, exampleEn, exampleTr, and usageTipTr.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildGrammarCoachSystemInstruction(level: CefrLevel): string {
  return [
    'You are a bilingual English grammar coach helping Turkish learners master English structures.',
    `Target proficiency: ${CEFR_PROFILES[level]}`,
    'Rules:',
    '1. Give clear, concise explanations in Turkish without overwhelming academic jargon.',
    '2. Always include 2-3 natural English example sentences at the target CEFR level with Turkish translations.',
    '3. If the learner submits an English sentence to check, evaluate whether it is natural, correct any errors gently, and explain the rule in Turkish.',
  ].join('\n');
}

export function buildGrammarCoachTaskPrompt(
  level: CefrLevel,
  topicTitleEn = 'Active Grammar Topic',
  learnerQuery = 'Check my example sentence or give me 2 more everyday examples for this grammar rule.'
): string {
  return [
    `CEFR Level: ${level}`,
    `Grammar Topic: ${topicTitleEn}`,
    `Learner Request / Sentence: "${learnerQuery}"`,
    'Provide a structured JSON response with:',
    '- feedbackTr: Clear Turkish explanation or sentence check.',
    '- improvedSentenceEn: Corrected or model English sentence (if applicable).',
    '- extraExamples: Array of 2 objects with { en, tr } at the target CEFR level.',
  ].join('\n');
}

export function getActivePromptBundle(
  level: CefrLevel,
  mode: LearningMode,
  options?: {
    tutorStyle?: TutorPracticeStyle;
    quizTopic?: string;
    flashcardTheme?: string;
    grammarTopicEn?: string;
  }
): PromptBundle {
  const model = 'gemini-4-hydrogen';

  switch (mode) {
    case 'flashcards':
      return {
        model,
        level,
        mode,
        modeTitleTr: 'Kelime Kartları',
        systemInstruction: buildFlashcardSystemInstruction(level),
        taskPrompt: buildFlashcardTaskPrompt(level, options?.flashcardTheme),
      };
    case 'grammar':
      return {
        model,
        level,
        mode,
        modeTitleTr: 'Dil Bilgisi & Kalıplar',
        systemInstruction: buildGrammarCoachSystemInstruction(level),
        taskPrompt: buildGrammarCoachTaskPrompt(level, options?.grammarTopicEn),
      };
    case 'quiz':
      return {
        model,
        level,
        mode,
        modeTitleTr: 'Alıştırma Testi',
        systemInstruction: buildQuizSystemInstruction(level),
        taskPrompt: buildQuizTaskPrompt(level, options?.quizTopic),
      };
    case 'tutor':
      return {
        model,
        level,
        mode,
        modeTitleTr: 'AI İngilizce Öğretmeni',
        systemInstruction: buildTutorSystemInstruction(level, options?.tutorStyle ?? 'free'),
        taskPrompt: buildTutorTaskPrompt(level, options?.tutorStyle ?? 'free'),
      };
  }
}
