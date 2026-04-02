import { QuestionType } from "../../enums/question-type";

export interface IstartExam {
  studentExamId: string;
  exam: Iexam;
  savedAnswers: IsavedAnswer[];
}

export interface Iexam {
  examId: number;
  title: string;
  startTime: string;
  durationMinutes: number;
  courseName: string;
  liveExamQuestios: IliveExamQuestios[];
}

export interface IliveExamQuestios {
  questionId: number;
  text: string;
  questionType: QuestionType;
  imagePath: string;
  options: Ioption[];
}

export interface Ioption {
  optionId: number;
  optionText: string;
}

export interface IsavedAnswer {
  questionId: number;
  selectedOptionId: number;
  eassayAnswer: string;
}
