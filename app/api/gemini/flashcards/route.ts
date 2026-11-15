import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { getGeminiClient } from '@/lib/gemini';
import { buildFlashcardSystemInstruction, buildFlashcardTaskPrompt } from '@/lib/prompts';
import type { CefrLevel } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      level: CefrLevel;
      theme?: string;
      existingWords?: string[];
    };

    const level: CefrLevel = body.level || 'A1';
    const theme = body.theme?.trim() || 'Everyday & Professional Communication';
    const existingWords = Array.isArray(body.existingWords) ? body.existingWords : [];

    const ai = getGeminiClient();
    const systemInstruction = buildFlashcardSystemInstruction(level);
    const taskPrompt = buildFlashcardTaskPrompt(level, theme, existingWords);

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
              word: { type: Type.STRING },
              ipa: { type: Type.STRING },
              partOfSpeechTr: { type: Type.STRING },
              turkishMeaning: { type: Type.STRING },
              exampleEn: { type: Type.STRING },
              exampleTr: { type: Type.STRING },
              usageTipTr: { type: Type.STRING },
            },
            required: [
              'word',
              'ipa',
              'partOfSpeechTr',
              'turkishMeaning',
              'exampleEn',
              'exampleTr',
              'usageTipTr',
            ],
          },
        },
      },
    });

    const rawText = (response.text ?? '[]').trim();
    const items = JSON.parse(rawText) as Array<{
      word: string;
      ipa: string;
      partOfSpeechTr: string;
      turkishMeaning: string;
      exampleEn: string;
      exampleTr: string;
      usageTipTr: string;
    }>;

    const timestamp = Date.now();
    const cards = items.slice(0, 5).map((item, idx) => ({
      id: `${level.toLowerCase()}-ai-fc-${timestamp}-${idx}`,
      level,
      word: item.word,
      ipa: item.ipa,
      partOfSpeechTr: item.partOfSpeechTr,
      turkishMeaning: item.turkishMeaning,
      exampleEn: item.exampleEn,
      exampleTr: item.exampleTr,
      usageTipTr: item.usageTipTr,
      isAiGenerated: true,
    }));

    return NextResponse.json({
      cards,
      usedSystemInstruction: systemInstruction,
      usedTaskPrompt: taskPrompt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen sunucu hatası';
    return NextResponse.json(
      {
        error: `AI kelime kartları üretilemedi: ${message}`,
      },
      { status: 500 }
    );
  }
}
