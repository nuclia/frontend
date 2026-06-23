export interface PageEntry {
  id: string;
  route: string;
  title: string;
  summary: string;
  capabilities: string[];
}

export interface ChatAdviceResponse {
  answer: string;
  pages: { id: string; title: string }[];
}

export type MessageSegment = { type: 'text'; content: string } | { type: 'link'; content: string; route: string };

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  segments?: MessageSegment[];
}

export type ChatState = 'idle' | 'thinking' | 'answered' | 'error';

export interface NdJsonItem {
  item?: {
    type: string;
    text?: string;
    object?: unknown;
  };
}

export interface RouteContext {
  accountSlug?: string;
  accountId?: string;
  zone?: string;
  kb?: string;
  agent?: string;
}
