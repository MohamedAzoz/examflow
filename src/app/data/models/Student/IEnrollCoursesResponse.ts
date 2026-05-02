export interface IEnrollCoursesResponse {
  semesterName: string;
  assignedCourses: [
    {
      courseId: number;
      courseName: string;
      courseCode: string;
      academicLevel: number;
    },
  ];
}
