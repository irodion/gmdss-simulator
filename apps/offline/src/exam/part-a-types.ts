export interface ExamOption {
  readonly key: string;
  readonly text: string;
}

export interface ExamItem {
  readonly id: string;
  readonly topic: string;
  readonly sourceExams: readonly number[];
  readonly prompt: string;
  readonly options: readonly ExamOption[];
  readonly answer: string;
  readonly explanation: string;
  readonly flagged: boolean;
  readonly note?: string;
}

export interface ExamMeta {
  readonly id: string;
  readonly title: string;
  readonly source: string;
  readonly passThreshold: number;
  readonly timeLimitMinutes: number;
  readonly itemIds: readonly string[];
}

export interface ItemBank {
  readonly version: number;
  readonly items: readonly ExamItem[];
}

export interface ExamIndex {
  readonly version: number;
  readonly exams: readonly ExamMeta[];
}

export const RANDOM_EXAM_ID = "random";
export const RANDOM_EXAM_SIZE = 20;
export const RANDOM_PASS_THRESHOLD = 0.8;
export const RANDOM_TIME_LIMIT_MINUTES = 30;
