export type QuestionType = 'TEXT' | 'MULTIPLE_CHOICE' | 'IMAGE' | 'REACTION_TIME';
export type ReactionStimulusType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'MULTIPLE_CHOICE';
export type SurveyStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  userId: string;
  fullName: string;
  email: string;
  token: string;
}

export interface QuestionOption {
  id?: string;
  label: string;
  value: string;
  displayOrder: number;
}

export interface Question {
  id?: string;
  type: QuestionType;
  title: string;
  description?: string;
  placeholder?: string;
  imageUrl?: string;
  imageKey?: string;
  videoUrl?: string;
  reactionStimulusType?: ReactionStimulusType;
  stimulus?: string;
  delayMs?: number;
  displayOrder: number;
  options: QuestionOption[];
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  status: SurveyStatus;
  publicId: string;
  publicUrl: string;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  questions: Question[];
}

export interface SurveyRequest {
  title: string;
  description?: string;
}

export interface ImageAsset {
  id: string;
  imageUrl: string;
  imageKey: string;
  originalFileName?: string;
  contentType?: string;
  sizeBytes?: number;
  uploadedAt: string;
}

export interface AnswerRequest {
  questionId: string;
  answerText?: string;
  selectedOption?: string;
  pressedKey?: string;
  reactionTimeMs?: number;
}

export interface ResponseSubmitRequest {
  sessionId?: string;
  userAgent?: string;
  answers: AnswerRequest[];
}

export interface AnswerResponse {
  id: string;
  questionId: string;
  questionTitle: string;
  answerText?: string;
  selectedOption?: string;
  reactionTimeMs?: number;
  submittedAt: string;
}

export interface SubmissionResponse {
  sessionId: string;
  startedAt: string;
  completedAt?: string;
  answers: AnswerResponse[];
}
