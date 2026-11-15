import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { getGeminiClient } from '@/lib/gemini';
import {
  buildGrammarCoachSystemInstruction,
  buildGrammarCoachTaskPrompt,
} from '@/lib/prompts';
import type { CefrLevel } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      level: CefrLevel;
      topicTitleEn: string;
      query: string;
    };

    const level: CefrLevel = body.level || 'A1';
    const topicTitleEn = body.topicTitleEn || 'English Grammar';
    const query = (body.query || '').trim();

    if (!query) {
      return NextResponse.json(
        { error: 'Lütfen kontrol edilecek bir cümle veya soru yazın.' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();
    const systemInstruction = buildGrammarCoachSystemInstruction(level);
    const taskPrompt = buildGrammarCoachTaskPrompt(level, topicTitleEn, query);

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: taskPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedbackTr: {
              type: Type.STRING,
              description: 'Clear Turkish explanation or evaluation of the learner sentence.',
            },
            improvedSentenceEn: {
              type: Type.STRING,
              description: 'Natural corrected or model English sentence.',
            },
            extraExamples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  en: { type: Type.STRING },
                  tr: { type: Type.STRING },
                },
                required: ['en', 'tr'],
              },
            },
          },
          required: ['feedbackTr', 'improvedSentenceEn', 'extraExamples'],
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText);

    return NextResponse.json({
      ...parsed,
      usedSystemInstruction: systemInstruction,
      usedTaskPrompt: taskPrompt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen sunucu hatası';
    return NextResponse.json(
      {
        error: `Dil bilgisi değerlendirmesi alınamadı: ${message}`,
      },
      { status: 500 }
    );
  }
}
