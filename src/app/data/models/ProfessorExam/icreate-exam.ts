export interface IcreateExam {
  title: string;
  passingScore: number;
  startTime: string;
  durationMinutes: number;
  totalDegree: number;
  isRandomQuestions: boolean;
  isRandomAnswers: boolean;
  courseId: number;
  academicLevel: number;
  departmentsIds: number[];
}
