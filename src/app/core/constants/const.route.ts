// Constant for application routes ant Titles

export const ROUTES = {
  LOGIN: { path: 'login', title: 'Login' },
  // FORGET_PASSWORD: { path: 'forget-password', title: 'Forget Password' },
  // VERIFY_OTP: { path: 'verify-otp', title: 'Verify OTP' },
  // RESET_PASSWORD: { path: 'reset-password', title: 'Reset Password' },
  MAIN: { path: 'main', title: 'Main' },
  ADMIN: { path: 'admin', title: 'Admin' },
  AUTH: { path: 'auth', title: 'Authentication' },
  PROFESSOR: { path: 'professor', title: 'Professor' },
  STUDENT: { path: 'student', title: 'Student' },
  ACCESS_DENIED: { path: 'access-denied', title: 'Access Denied' },
  NOT_FOUND: { path: '**', title: 'Not Found' },
};

export const AUTH_ROUTES = {
  REQUEST_EMAIL: { path: 'request-email', title: 'Request Email Change' },
  CONFIRM_EMAIL: { path: 'confirm-email', title: 'Confirm Email' },
  FORGET_PASSWORD: { path: 'forget-password', title: 'Forget Password' },
  VERIFY_OTP: { path: 'verify-otp', title: 'Verify OTP' },
  RESET_PASSWORD: { path: 'reset-password', title: 'Reset Password' },
};

export const ROUTESADMIN = {
  DASHBOARD: { path: 'dashboard', title: 'Dashboard' },
  USERS: { path: 'user-managment', title: 'User Management' },
  SEMESTERS: { path: 'semester-managment', title: 'Semester Management' },
  COURSES: { path: 'courses-managment', title: 'Courses Management' },
  DEPARTMENTS: { path: 'departments-managment', title: 'Departments Management' },
  ASSIGN_COURSES: { path: 'assign-courses-managment', title: 'Assign Courses' },
  ENROLL_STUDENTS: { path: 'enroll-students-managment', title: 'Enroll Students' },
  RESET_PASSWORDS: { path: 'reset-passwords-managment', title: 'Reset Passwords' },
  SYSTEM_SETTINGS: { path: 'system-settings-managment', title: 'System Settings' },
};

export const ROUTESSTUDENT = {
  DASHBOARD: { path: 'stdashboard', title: 'Student Dashboard' },
  COURSES: { path: 'courses', title: 'Courses' },
  EXAM: { path: 'exam/:examId', title: 'Exam Section' },
  PAST_RESULTS: { path: 'past-results', title: 'My Results' },
  EXAM_RESULT: { path: 'past-results/:examId', title: 'Exam Result' },
  SETTINGS: { path: 'settings', title: 'Settings' },
};

export const ROUTESPROFESSOR = {
  COURSES: { path: 'my-courses', title: 'My Courses' },
  COURSE_DETAILS: { path: 'my-courses/:courseId', title: 'Course Details' },
  COURSE_EXAMS: { path: 'my-courses/:courseId/exams', title: 'Exams Management' },
  COURSE_EXAM_BUILDER: {
    path: 'my-courses/:courseId/exams/:examId/builder',
    title: 'Exam Builder',
  },
};
