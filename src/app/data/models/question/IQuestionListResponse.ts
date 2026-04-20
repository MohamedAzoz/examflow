import { IQuestionResponse } from './iquestion-response';

export interface IQuestionListResponse {
  pageSize: number;
  pageIndex: number;
  totalSize: number;
  data: IQuestionResponse[];
}
