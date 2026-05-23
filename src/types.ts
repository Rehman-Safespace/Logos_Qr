export enum Mode {
  WORD_DECONSTRUCTION = "A",
  ROOT_GENERATION = "B",
}

export interface AnalogyNode {
  title: string;
  engine: "cybernetic" | "biological" | "physics" | "quantum" | "genetic" | "trinity";
  analogy: string;
}

export interface AnalyticalAttribute {
  label: string;
  value: string;
}

export interface DeconstructionNode {
  id: string;
  timestamp: string;
  input: string;
  mode: Mode;
  root: string;
  desertMeaning: string;
  crossLanguageMatch: string;
  antiSpinMeaning: string;
  analogies: AnalogyNode[];
  lexicalField?: {
    nouns: string[];
    verbs: string[];
    tools: string[];
  };
  systemicApplication?: string;
  matrixAnchoring?: {
    found: boolean;
    verbatimVerse?: string;
    sourceFile?: string;
  };
  deepDeduction?: string;
  
  // High thinking & memory metrics addition
  engineMetadata?: {
    timeTakenMs: number;
    timestampUtc: string;
    modelsUsed: string[];
    ragEngineHits: number;
    cognitiveStepsCount: number;
  };
  learningLog?: {
    whatLearnt: string;
    whyNew: string;
    nextPlannedSegment: string;
    memoryUnifiedKey: string;
  };
}

export interface ReferenceDocument {
  id: string;
  name: string;
  content: string;
  size: number;
  wordCount: number;
}

export interface EngineDirectives {
  arabicDefinition: string;
  operationalRules: string[];
  customPromptBase: string;
  cyberneticTemplate: string;
  biologicalTemplate: string;
  physicsTemplate: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  deconstruction?: DeconstructionNode;
  isThrottledWarning?: boolean;
}

export interface LearningState {
  hasBeenStaticallySummarized?: boolean;
  learnedCount: number;
  lastUpdated: string;
  currentSegmentName: string;
  nextSegments: string[];
  cumulativeInsights: string[];
}
