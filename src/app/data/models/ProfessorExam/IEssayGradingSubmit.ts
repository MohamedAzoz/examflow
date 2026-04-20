export interface IEssayGradingSubmit {
  examId: number;
  studentId: string;
  essayGrades: {
    questionId: number;
    assignedScore: number;
  }[];
}
