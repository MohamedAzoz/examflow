export interface Iregister {
  fullName: string;
  nationalId: string;
  universityCode: string;
  jobTitle: string;
  academicRank: string;
  academicLevel: number;
  departmentId: number;
  email: string;
  phoneNumber: string;
  password: string;
  userType: userType;
}
export enum userType{
    Admin=1,
    Student=2,
    Doctor=3
}
