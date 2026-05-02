import { ExamOverviewSortingOptions } from '../../enums/ExamOverviewSortingOptions';

export interface RecentExamSearchParams {
  SortingOptions: ExamOverviewSortingOptions;
  ExamTitleSearch?: string;
  PageIndex: number;
  PageSize: number;
}
