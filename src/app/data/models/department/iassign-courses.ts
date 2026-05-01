export interface IAssignCourses {
  assignedCourses: {
    courseId: number;
    courseName: string;
    courseCode: string;
    academicLevel: number;
  }[];
}
