import { z } from 'zod';

export const INTENTS = ['routine', 'indoor', 'alternatives', 'health', 'forecast'] as const;
export type Intent = (typeof INTENTS)[number];
export const intentSchema = z.enum(INTENTS);
