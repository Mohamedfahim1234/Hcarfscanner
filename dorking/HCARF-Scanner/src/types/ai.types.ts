// AI-related type definitions
export interface AIProvider {
  name: string;
  endpoint: string;
  authenticate: (apiKey: string) => boolean;
  sendMessage: (context: any) => Promise<any>;
  getModels: () => Promise<any>;
}

export interface AIResponse {
  content: string;
  usage?: any;
  model: string;
  confidence?: number;
  suggestions?: string[];
}
