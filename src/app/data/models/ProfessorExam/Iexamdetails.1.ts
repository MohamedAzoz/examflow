import { ExamSortingOptions } from '../../enums/ExamSortingOptions';
import { ProfessorExamStatus } from '../../enums/ProfessorExamStatus';

export interface Iexamdetails {
  courseId?: number | null;
  academicLevel?: number | null;
  departmentId?: number | null;
  sorting?: ExamSortingOptions | null;
  examStatus?: ProfessorExamStatus | null;
  semesterId?: number | null;
  searchTitle?: string | null;
  pageIndex?: number;
  pageSize?: number;
}
