export interface RecentExamData {
  examId: number;
  courseName: string;
  examTitle: string;
  startTime: Date;
  academicLevel: number;
  departmentCodes: {
    code: string;
  }[];
  attendStudents: number;
  absentStudents: number;
  cheatFlag: number;
  questionsDifficulty: number;
}
