export interface IEssayGradingDetailsResponse {
  pageSize: number;
  pageIndex: number;
  totalSize: number;
  data: {
    studentId: string;
    essayQuestions: {
      questionId: number;
      questionText: string;
      studentAnswerText: string;
      maxDegree: number;
      score?: number;
    }[];
  }[];
}
