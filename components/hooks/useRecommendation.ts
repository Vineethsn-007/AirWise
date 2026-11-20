'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Intent } from '@/lib/ai/intents';
import type { Recommendation } from '@/lib/ai/types';
import { useAppState } from '@/components/AppState';

interface StreamMessage {
  type: 'meta' | 'token' | 'result' | 'error';
  text?: string;
  message?: string;
  recommendation?: Recommendation;
}

export function useRecommendation(intent: Intent, enabled = true) {
  const { location, profile, snapshot } = useAppState();
  const [text, setText] = useState('');
  const [result, setResult] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    if (!snapshot || !enabled) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setText('');
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ intent, location, profile }),
      });
      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? `Recommendation failed (${response.status})`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split(/\r?\n\r?\n/);
        buffer = chunks.pop() ?? '';
        for (const chunk of chunks) {
          const data = chunk.split(/\r?\n/).find((line) => line.startsWith('data:'));
          if (!data) continue;
          const message = JSON.parse(data.slice(5).trim()) as StreamMessage;
          if (message.type === 'token' && message.text) setText((current) => current + message.text);
          if (message.type === 'result' && message.recommendation) setResult(message.recommendation);
          if (message.type === 'error') setError(message.message ?? 'Recommendation failed');
        }
      }
    } catch (caught: unknown) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      setError(caught instanceof Error ? caught.message : 'Recommendation failed');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [enabled, intent, location, profile, snapshot]);

  useEffect(() => {
    void run();
    return () => controllerRef.current?.abort();
  }, [run]);

  return { text, result, error, loading, regenerate: run };
}
