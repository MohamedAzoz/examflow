export interface IQuestionRequest {
  text: string;
  questionType: number;
  degree: number;
  imagePath: string;
  courseId: number;
  options: string[];
  correctOptionText: string;
}
