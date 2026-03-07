export interface IQuestionRequest {
  text: string;
  questionType: number;
  degree: number;
  courseId: number;
  options: string[];
  correctOptionText: string;
}
