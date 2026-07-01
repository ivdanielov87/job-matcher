import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/cv-job-matcher';

let isRunning = false;

export async function POST(req: NextRequest) {
  if (isRunning) {
    return NextResponse.json(
      { success: false, error: 'BUSY', message: 'В момента се обработва друга заявка. Опитайте след около минута.' },
      { status: 429 }
    );
  }

  isRunning = true;
  try {
    const formData = await req.formData();

    const response = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      body: formData,
      // Прекратяване, ако клиентът се разкачи (Прекрати търсенето) ИЛИ при 5-мин таймаут.
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(300_000)]),
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
    // Клиентът е прекратил търсенето — освобождаваме lock-а (finally) и излизаме тихо.
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'ABORTED', message: 'Търсенето е прекратено.' },
        { status: 499 }
      );
    }
    console.error('Analyze route error:', err);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: 'Вътрешна грешка. Опитайте отново.' },
      { status: 500 }
    );
  } finally {
    isRunning = false;
  }
}
