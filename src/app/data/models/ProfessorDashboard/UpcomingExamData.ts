export interface UpcomingExamData {
  courseName: string;
  examTitle: string;
  startTime: Date;
  durationMinutes: number;
  academicLevel: number;
  departmentCodes: {
    code: string;
  }[];
}
