import { NextRequest, NextResponse } from 'next/server';

const N8N_STOP_WEBHOOK =
  process.env.N8N_STOP_WEBHOOK_URL || 'http://localhost:5678/webhook/cv-job-matcher-stop';

/**
 * Сигнализира на n8n да спре текущото изпълнение чрез request_id.
 * n8n workflow-ът вдига кооперативен "stop" флаг за този request_id и
 * прекъсва потока на следващата контролна точка (между възлите).
 * Best-effort: клиентът вече е върнат към формата независимо от резултата тук.
 */
export async function POST(req: NextRequest) {
  try {
    const { request_id } = await req.json();
    if (!request_id || typeof request_id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Липсва request_id.' },
        { status: 400 }
      );
    }

    await fetch(N8N_STOP_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    // Best-effort — не връщаме грешка към клиента.
    return NextResponse.json({ success: true });
  }
}
