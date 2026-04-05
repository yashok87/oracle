
export interface OracleSource {
  title: string;
  uri: string;
}

export interface ComparisonOption {
  title: string;
  description: string;
  score: number;
}

export interface LearningProfile {
  type: string; // e.g., "INTJ"
  label: string; // e.g., "The Architect"
  traits: {
    energy: 'I' | 'E';
    information: 'S' | 'N';
    decision: 'T' | 'F';
    lifestyle: 'J' | 'P';
  };
}

export interface Perspective {
  philosopherName?: string; 
  philosopherThemes?: string[]; // The specific values they brought to this query
  vote: string; // "A", "B", "YES", "NO", "RECOMMEND" or empty
  verdict: string; // The short summary used to build the core
  analysis?: string; // The lazy-loaded full text
  sourceQuery?: string;
}

export interface OracleResponse {
  type: 'COMPARISON' | 'RECOMMENDATION' | 'KNOWLEDGE' | 'PREDICTION' | 'DECISION' | 'PERSONAL';
  isDecision: boolean; 
  title: string; 
  verdict: string; // The high-visibility RED summary
  verdictUrl?: string; // Hyperlink to Google for the artifact
  category: string;
  genre?: string;
  reasoning: string;
  sources?: OracleSource[];
  studyMoreUrl?: string;
  studyMoreLabel?: string;
  base64Image?: string; 
  imageUrl?: string;
  imageStyleLabel?: string;
  language?: 'EN' | 'RU';
  isFallback?: boolean;
  isDaily?: boolean;
  isUncertain?: boolean;
  uncertaintyQuery?: string;
  textModelUsed?: string;
  perspectives: {
    psychoanalysis: Perspective;
    gestalt: Perspective;
    russian_philosophy: Perspective;
    german_philosophy: Perspective;
    existential: Perspective;
    theological: Perspective;
    buddhist: Perspective;
    post_modern: Perspective;
    ancient_greeks: Perspective;
    ancient_romans: Perspective;
  };
  imageError?: string;
  detailedAnalysis: string; 
  recommendationLink?: string;
  comparison?: {
    optionA: string;
    optionB: string;
    percentageA: number;
    percentageB: number;
    winner?: 'A' | 'B' | 'DRAW';
  };
  tally?: string;
}

export interface HistoryItem {
  id: string;
  query: string;
  response: OracleResponse;
  timestamp: number;
  logicScore: number;
  chaosScore: number;
}

export interface OracleState {
  status: 'IDLE' | 'THINKING' | 'REVEALED' | 'ERROR';
  query: string;
  response: OracleResponse | null;
  logicScore: number; 
  chaosScore: number; 
  error?: string;
  attempts: number; 
}