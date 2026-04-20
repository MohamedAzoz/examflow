export interface IQuestionResponse {
  id: number;
  text: string;
  imagePath?: string;
  questionType: number;
  degree: number;
  courseId: number;
  options: string[];
  correctOptionText: string;
}
