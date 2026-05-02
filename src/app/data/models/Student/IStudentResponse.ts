export interface IStudentResponse {
  pageSize: number;
  pageIndex: number;
  totalSize: number;
  data: [
    {
      id: string;
      nationalId: string;
      fullName: string;
      universityCode: string;
      academicLevel: number;
      departmentCode: string;
      email: string;
      phoneNumber: string;
    },
  ];
}
