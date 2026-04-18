export interface IexamByIddetails {
  title: string;
  passingScore: number;
  startTime: Date;
  durationMinutes: number;
  totalDegree: number;
  isRandomQuestions: boolean;
  isRandomAnswers: boolean;
  examStatus: string;
  academicLevel: number;
  semesterName: string;
  courseName: string;
  examDepartments: {
    departmentId: number;
    departmentName: string;
    departmentCode: string;
  }[];
  examQuestions: {
    id: number;
    text: string;
    questionType: number;
    imagePath: string;
    degree: number;
    correctOption: {
      id: number;
      optionText: string;
    };
    questionOptions: {
      id: number;
      optionText: string;
    }[];
  }[];
}
