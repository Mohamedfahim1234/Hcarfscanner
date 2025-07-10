// Chat interface types
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: {
    provider: string;
    tokens?: number;
    confidence?: number;
  };
}
