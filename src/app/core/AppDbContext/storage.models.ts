import { IstartExam } from '../../data/models/StudentExam/IstartExam';

export interface PersistedAuthState {
  token: string;
  role: string | null;
  userName: string | null;
  userId: string | null;
  issuedAt: number | null;
  notBefore: number | null;
  expiresAt: number | null;
  email?: string | null;
  hasConfirmedEmail?: boolean;
}

export type ThemePreference = 'dark' | 'light';

export interface PersistedPasswordResetFlowState {
  email: string;
  resetToken: string;
  updatedAt: number;
}

export interface PersistedExamSessionState {
  examId: number;
  examSnapshot: IstartExam;
  selectedOptions: Record<number, number>;
  essayAnswers: Record<number, string>;
  markedQuestions: Record<number, boolean>;
  syncedAnsweredIds: Record<number, boolean>;
  currentQuestionId: number | null;
  currentQuestionIndex: number;
  serverResponses: number;
  sessionId: number;
  updatedAt: number;
}
