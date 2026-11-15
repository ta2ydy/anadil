import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { getGeminiClient } from '@/lib/gemini';
import { buildTutorSystemInstruction, buildTutorTaskPrompt } from '@/lib/prompts';
import type { CefrLevel, TutorPracticeStyle } from '@/lib/types';

interface HistoryEntry {
  role: 'user' | 'tutor';
  text: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      level: CefrLevel;
      style: TutorPracticeStyle;
      message: string;
      history?: HistoryEntry[];
    };

    const level: CefrLevel = body.level || 'A1';
    const style: TutorPracticeStyle = body.style || 'free';
    const message = (body.message || '').trim();

    if (!message) {
      return NextResponse.json(
        { error: 'Lütfen öğretmene göndermek için bir mesaj yazın.' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();
    const systemInstruction = buildTutorSystemInstruction(level, style);
    const taskPrompt = buildTutorTaskPrompt(level, style, message);

    const recentHistory = (body.history || []).slice(-8);
    const historyTranscript =
      recentHistory.length > 0
        ? [
            'Conversation history so far:',
            ...recentHistory.map(
              (item) => `${item.role === 'user' ? 'Learner' : 'Tutor'}: ${item.text}`
            ),
            '',
          ].join('\n')
        : '';

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `${historyTranscript}${taskPrompt}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            englishReply: {
              type: Type.STRING,
              description: 'Main conversational reply in English calibrated to the CEFR level.',
            },
            turkishSupport: {
              type: Type.STRING,
              description:
                'Helpful Turkish explanation, vocabulary note, or translation summary for the Turkish learner.',
            },
            correction: {
              type: Type.OBJECT,
              properties: {
                hasMistake: {
                  type: Type.BOOLEAN,
                  description: 'True if the learner made a grammar, spelling, or phrasing mistake.',
                },
                originalSnippet: {
                  type: Type.STRING,
                  description: 'The learner snippet containing the mistake, if any.',
                },
                correctedSnippet: {
                  type: Type.STRING,
                  description: 'The corrected natural English phrasing, if applicable.',
                },
                explanationTr: {
                  type: Type.STRING,
                  description: 'Concise Turkish explanation of the correction.',
                },
              },
              required: ['hasMistake'],
            },
            followUpQuestionEn: {
              type: Type.STRING,
              description: 'A short inviting follow-up question in English at the target CEFR level.',
            },
          },
          required: ['englishReply', 'turkishSupport', 'correction', 'followUpQuestionEn'],
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
        error: `AI Öğretmen yanıtı oluşturulamadı: ${message}`,
      },
      { status: 500 }
    );
  }
}
