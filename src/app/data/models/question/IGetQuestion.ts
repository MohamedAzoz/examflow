import { QuestionType } from "../../enums/question-type";

export interface IGetQuestion {
  QuestionTextSearch: string;
  QuestionType: QuestionType;
  CourseId: number;
  PageIndex: number;
  PageSize: number;
}
