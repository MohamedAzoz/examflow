export interface IexamDetails {
  pageSize: number;
  pageIndex: number;
  totalSize: number;
  data: IexamDetailsData[];
}
export interface IexamDetailsData {
  id: number;
  title: string;
  passingScore: number;
  startTime: Date;
  durationMinutes: number;
  totalDegree: number;
  isRandomQuestions: boolean;
  isRandomAnswers: boolean;
  examStatus: string;
  semesterName: string;
  courseName: string;
  academicLevel: number;
  departmentNames: string[];
}
