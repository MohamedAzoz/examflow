import { ExamStatus } from '../../enums/ExamStatus';

export interface IpastExams {
  pageSize: number;
  pageIndex: number;
  totalSize: number;
  data: data[];
}
export interface data {
  examId: number;
  examTitle: string;
  studentScore: number;
  examMaxScore: number;
  examStatus: ExamStatus;
}
