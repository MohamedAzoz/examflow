export interface IupdateExam {
  id: number;
  title: string;
  startTime: string;
  durationMinutes: number;
  passingScore: number;
  isRandomQuestions: boolean;
  isRandomAnswers: boolean;
  totalDegree: number;
  academicLevel: number;
  departmentsIds: number[];
}
