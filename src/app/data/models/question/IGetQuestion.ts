import { QuestionType } from '../../enums/question-type';

export interface IGetQuestion {
  QuestionTextSearch: string;
  QuestionType: QuestionType;
  CourseId?: number | null;
  PageIndex: number;
  PageSize: number;
}
