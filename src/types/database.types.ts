import { Json } from './supabase';
import { InputType, ToolType } from './history';

export interface MathHistory {
  id: string;
  user_id: string;
  tool_used: ToolType;
  input_type: InputType;
  topic?: string;
  content: {
    query: string;
    imageUrl?: string;
    audioUrl?: string;
    fileUrl?: string;
  };
  result: {
    solution: string;
    steps?: string[];
    error?: string;
  };
  timestamp: string;
}

export type Database = {
  public: {
    Tables: {
      math_history: {
        Row: MathHistory;
        Insert: Omit<MathHistory, 'id' | 'timestamp'>;
        Update: Partial<Omit<MathHistory, 'id' | 'timestamp'>>;
      };
      // ... other tables
    };
  };
}; 