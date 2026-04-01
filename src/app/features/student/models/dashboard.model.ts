export interface Exam {
  id: number;
  name: string;
  schedule: string;
  icon: string;
}

export interface PastExam {
  id: number;
  name: string;
  grade: string;
  percentage: number;
}

export interface ActiveExam {
  id: number;
  name: string;
  message: string;
  remainingSeconds: number;
}

