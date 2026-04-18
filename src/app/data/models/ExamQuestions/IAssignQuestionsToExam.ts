export interface IAssignQuestionsToExam {
  examId: number;
  questions: IAssignQuestion[];
}
export interface IAssignQuestion {
  id: number;
  questionDegree: number;
} 
