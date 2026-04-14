// Constant for application routes ant Titles

export const ROUTES = {
  LOGIN: { path: 'login', title: 'Login' },
  MAIN: { path: 'main', title: 'Main' },
  ADMIN: { path: 'admin', title: 'Admin' },
  STUDENT: { path: 'student', title: 'Student' },
  ACCESS_DENIED: { path: 'access-denied', title: 'Access Denied' },
  NOT_FOUND: { path: '**', title: 'Not Found' },
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
