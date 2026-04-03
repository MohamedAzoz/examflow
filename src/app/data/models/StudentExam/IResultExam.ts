export interface IResultExam {
  examTitle: string;
  studentScore: number;
  examMaxScore: number;
  examStatus: number;
  timeTaken: number;
  examQuestionsAnswers: IExamQuestionsAnswers[];
  examEssaysQuestions: IExamEssaysQuestion[];
}
export interface IExamQuestionsAnswers {
  questionText: string;
  imagePath: string;
  degree: number;
  correctOptionText: string;
  selectedOptionText: string;
  answerStatus: boolean;
}
export interface IExamEssaysQuestion {
  questionText: string;
  imagePath: string;
  degree: number;
  essayAnswer: string;
}
