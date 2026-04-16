import { ExamSortingOptions } from '../../enums/ExamSortingOptions';
import { ProfessorExamStatus } from '../../enums/ProfessorExamStatus';

export interface Iexamdetails {
  courseId: number;
  academicLevel: number;
  departmentId: number;
  sorting: ExamSortingOptions;
  examStatus: ProfessorExamStatus;
  semesterId: number;
  searchTitle: string;
  pageIndex: number;
  pageSize: number;
}
