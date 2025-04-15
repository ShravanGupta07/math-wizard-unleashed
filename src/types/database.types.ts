export interface MathHistory {
  id: string;
  created_at: string;
  user_id: string;
  problem: string;
  solution: string;
  explanation?: string;
  steps?: string[];
  hints?: string[];
  visualization?: any;
  latex?: string;
  topic?: string;
  type: 'text' | 'image' | 'voice' | 'drawing' | 'file';
}

export interface Database {
  public: {
    Tables: {
      math_history: {
        Row: MathHistory;
        Insert: Omit<MathHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<MathHistory, 'id' | 'created_at'>>;
      };
      // ... other tables
    };
  };
} 