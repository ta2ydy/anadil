import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { getGeminiClient } from '@/lib/gemini';
import { buildQuizSystemInstruction, buildQuizTaskPrompt } from '@/lib/prompts';
import type { CefrLevel } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      level: CefrLevel;
      focusTopic?: string;
    };

    const level: CefrLevel = body.level || 'A1';
    const focusTopic =
      body.focusTopic?.trim() || 'General English (Vocabulary, Grammar & Everyday Expressions)';

    const ai = getGeminiClient();
    const systemInstruction = buildQuizSystemInstruction(level);
    const taskPrompt = buildQuizTaskPrompt(level, focusTopic);

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: taskPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              categoryTr: {
                type: Type.STRING,
                description: 'Question category in Turkish (e.g., Dil Bilgisi, Kelime Bilgisi).',
              },
              promptTr: {
                type: Type.STRING,
                description: 'Short Turkish instruction for the learner.',
              },
              questionEn: {
                type: Type.STRING,
                description: 'English sentence or question with a clear blank ____ or prompt.',
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 4 English answer options.',
              },
              correctIndex: {
                type: Type.INTEGER,
                description: 'Zero-based index (0 to 3) of the correct answer.',
              },
              explanationTr: {
                type: Type.STRING,
                description: 'Clear Turkish explanation of why the correct option is right.',
              },
            },
            required: [
              'categoryTr',
              'promptTr',
              'questionEn',
              'options',
              'correctIndex',
              'explanationTr',
            ],
          },
        },
      },
    });

    const rawText = (response.text ?? '[]').trim();
    const items = JSON.parse(rawText) as Array<{
      categoryTr: string;
      promptTr: string;
      questionEn: string;
      options: string[];
      correctIndex: number;
      explanationTr: string;
    }>;

    const timestamp = Date.now();
    const questions = items.slice(0, 5).map((item, idx) => ({
      id: `${level.toLowerCase()}-ai-q-${timestamp}-${idx}`,
      level,
      categoryTr: item.categoryTr,
      promptTr: item.promptTr,
      questionEn: item.questionEn,
      options: item.options.slice(0, 4),
      correctIndex: Math.max(0, Math.min(3, Number(item.correctIndex) || 0)),
      explanationTr: item.explanationTr,
      isAiGenerated: true,
    }));

    return NextResponse.json({
      questions,
      usedSystemInstruction: systemInstruction,
      usedTaskPrompt: taskPrompt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen sunucu hatası';
    return NextResponse.json(
      {
        error: `AI test soruları üretilemedi: ${message}`,
      },
      { status: 500 }
    );
  }
}
