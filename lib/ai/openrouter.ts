import type { PromptBundle } from './types';

export const PRIMARY_MODEL = 'openai/gpt-oss-120b:free';
export const FALLBACK_MODEL = 'openrouter/free';
const MODELS = [PRIMARY_MODEL, FALLBACK_MODEL] as const;
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

interface StreamChoice {
  delta?: { content?: string | null };
  finish_reason?: string | null;
}

interface StreamPayload {
  choices?: StreamChoice[];
  error?: { message?: string };
}

export interface CompletionRequest {
  prompt: PromptBundle;
  onToken?: (delta: string) => void;
  signal?: AbortSignal;
}

export interface CompletionResult {
  text: string;
  model: string;
}

export class MissingApiKeyError extends Error {
  constructor() {
    super('OPENROUTER_API_KEY is not set. Add it to .env.local (server-side only).');
    this.name = 'MissingApiKeyError';
  }
}

function sseDataLines(buffer: string): { lines: string[]; remainder: string } {
  const lines: string[] = [];
  const parts = buffer.split(/\r?\n\r?\n/);
  const remainder = parts.pop() ?? '';
  for (const part of parts) {
    for (const line of part.split(/\r?\n/)) {
      if (line.startsWith('data:')) lines.push(line.slice(5).trim());
    }
  }
  return { lines, remainder };
}

async function streamModel(model: string, request: CompletionRequest): Promise<string> {
  const signal = request.signal
    ? AbortSignal.any([request.signal, AbortSignal.timeout(45_000)])
    : AbortSignal.timeout(45_000);
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://airwise.vercel.app',
      'X-Title': 'AirWise',
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        { role: 'system', content: request.prompt.system },
        { role: 'user', content: request.prompt.user },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenRouter ${model} returned ${response.status}: ${detail.slice(0, 240)}`);
  }
  if (!response.body) throw new Error(`OpenRouter ${model} returned no stream`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = sseDataLines(buffer);
    buffer = parsed.remainder;
    for (const line of parsed.lines) {
      if (line === '[DONE]') continue;
      const payload = JSON.parse(line) as StreamPayload;
      if (payload.error?.message) throw new Error(payload.error.message);
      const delta = payload.choices?.[0]?.delta?.content;
      if (delta) {
        text += delta;
        request.onToken?.(delta);
      }
    }
  }
  return text;
}

/** Tries the primary free model, then OpenRouter's free-model router. */
export async function complete(request: CompletionRequest): Promise<CompletionResult> {
  if (!process.env.OPENROUTER_API_KEY) throw new MissingApiKeyError();
  const errors: string[] = [];
  for (const model of MODELS) {
    try {
      return { text: await streamModel(model, request), model };
    } catch (error) {
      errors.push(`${model}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }
  throw new Error(`All OpenRouter models failed. ${errors.join(' | ')}`);
}
