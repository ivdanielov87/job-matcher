import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/cv-job-matcher';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const response = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(300_000),
    });

    if (!response.ok) {
      const text = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { error: 'N8N_ERROR', message: text || 'Грешка в анализа' };
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      return NextResponse.json(
        { success: false, error: 'TIMEOUT', message: 'Анализът отне прекалено много време (над 5 мин). Опитайте с по-малко дни назад.' },
        { status: 504 }
      );
    }
    console.error('Analyze route error:', err);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Вътрешна грешка. Опитайте отново.' },
      { status: 500 }
    );
  }
}
